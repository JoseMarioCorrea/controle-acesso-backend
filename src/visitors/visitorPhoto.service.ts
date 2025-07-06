// src/shared/storage/visitor-photo.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

/**
 * Serviço responsável por gravar/ler fotos de visitantes
 * em disco (…/uploads/visitors/<id>/arquivo.jpg)
 */
@Injectable()
export class VisitorPhotoService {
    /** pasta base “absoluta” onde ficam as imagens  */
    private readonly baseDir = path.resolve(
        __dirname,
        '..',                // shared
        '..',                // src
        '..',                // raiz do projeto
        'uploads',
        'visitors',
    );

    /**
     * Salva a imagem recebida em `/uploads/visitors/<visitorId>/`
     * retornando o **caminho relativo HTTP** que você poderá
     * guardar no banco e servir estaticamente depois.
     */
    async savePhoto(
        visitorId: number,
        file: Express.Multer.File,
    ): Promise<string> {
        // 1) garante pasta
        const dir = path.join(this.baseDir, String(visitorId));
        await fs.mkdir(dir, { recursive: true });

        // 2) gera nome + caminho final
        const ext = path.extname(file.originalname) || '.jpg';
        const filename = `${Date.now()}-${uuid()}${ext}`;
        const finalPath = path.join(dir, filename);

        // 3) grava: ou do buffer (se usar memoryStorage) ou do diskStorage
        if (file.buffer && file.buffer.length) {
            await fs.writeFile(finalPath, file.buffer);
        } else if ('path' in file && file.path) {
            // multer gravou em disco antes, copia do temp pra nosso uploads
            await fs.copyFile(file.path, finalPath);
        } else {
            throw new InternalServerErrorException('Nenhum dado de arquivo recebido');
        }

        // 4) devolve a URL pública
        return `/uploads/visitors/${visitorId}/${filename}`;

    } catch(err) {
        throw new InternalServerErrorException(
            'Erro ao salvar foto do visitante',
            err instanceof Error ? err.message : String(err),
        );
    }
    /* acrescente dentro da classe VisitorPhotoService */

    async listPhotos(visitorId: number): Promise<string[]> {
        const dir = path.join(this.baseDir, String(visitorId));
        try {
            const files = await fs.readdir(dir);
            return files.map(f => `/uploads/visitors/${visitorId}/${f}`);
        } catch {
            return [];
        }
    }

    async getLatest(visitorId: number): Promise<string | null> {
        const photos = await this.listPhotos(visitorId);
        return photos.length ? photos.sort().at(-1) ?? null : null;
    }

}
