// src/shared/storage/visitor-photo.service.ts
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { copyFileSync, existsSync, promises as fs, mkdirSync, writeFileSync } from 'fs';
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
        const baseDir = process.cwd();
        const dir = path.join(baseDir, 'uploads', 'visitors', String(visitorId));
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

        const filename = `${Date.now()}-${file.originalname}`;
        const dest = path.join(dir, filename);

        // 2) gera nome + caminho final
        if (file.buffer) {
            writeFileSync(dest, file.buffer);
        } else if (file.path) {
            copyFileSync(file.path, dest);
        } else {
            throw new BadRequestException('Arquivo de foto inválido');
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
