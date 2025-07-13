// src/sync/sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Pessoa, PersonState } from '../pessoa/pessoa.entity';
import { Visitante, VisitorState } from '../visitors/visitor.entity';
import { IdfaceService } from '../devices/idface.service';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(
        @InjectRepository(Pessoa)
        private readonly pessoaRepo: Repository<Pessoa>,
        @InjectRepository(Visitante)
        private readonly visitorRepo: Repository<Visitante>,
        private readonly idface: IdfaceService,
    ) { }

    /**
     * Roda a cada 30s e processa todos os fluxos de estado
     */
   /* @Cron(CronExpression.EVERY_30_SECONDS)
    async handleSync() {
        await this.syncPessoas();
        await this.syncVisitors();
        await this.cleanInativos();
    }*/

    private async syncPessoas() {
        // SALVO -> PENDENTE_ENVIO
        await this.pessoaRepo.update(
            { state: PersonState.SALVO },
            { state: PersonState.PENDENTE_ENVIO },
        );

        // enviar pendentes
        const pendentes = await this.pessoaRepo.find({
            where: { state: PersonState.PENDENTE_ENVIO },
        });
        for (const p of pendentes) {
            try {
                // usar batch com 1 elemento
                const ids = await this.idface.createUsersBatch(
                    p.department.id,
                    [{ name: p.nome, registration: p.id }],
                );
                if (ids.length) {
                    p.state = PersonState.ENVIADO;
                    await this.pessoaRepo.save(p);
                    this.logger.log(`✔ Pessoa ${p.id} enviada ao device`);
                }
            } catch (err) {
                this.logger.error(`❌ Falha enviando pessoa ${p.id}`, err);
            }
        }
    }

    private async syncVisitors() {
        // SALVO -> PENDENTE_ENVIO
        await this.visitorRepo.update(
            { state: VisitorState.SALVO },
            { state: VisitorState.PENDENTE_ENVIO },
        );

        const pendentes = await this.visitorRepo.find({
            where: { state: VisitorState.PENDENTE_ENVIO },
        });
        for (const v of pendentes) {
            try {
                const ids = await this.idface.createUsersBatch(
                    v.departmentId,
                    [{ name: v.nome, registration: String(v.id) }],
                );
                if (ids.length) {
                    v.state = VisitorState.ENVIADO;
                    await this.visitorRepo.save(v);
                    this.logger.log(`✔ Visitante ${v.id} enviado ao device`);
                }
            } catch (err) {
                this.logger.error(`❌ Falha enviando visitante ${v.id}`, err);
            }
        }
    }

    private async cleanInativos() {
        // excluir do device e atualizar estado
        const pess = await this.pessoaRepo.find({
            where: { state: PersonState.INATIVO },
        });
        for (const p of pess) {
            try {
                await this.idface.deleteObjects(p.department.id, 'users', { users: { id: p.id } });
                p.state = PersonState.EXCLUIDO_DEVICE;
                await this.pessoaRepo.save(p);
                this.logger.log(`✔ Pessoa ${p.id} excluída do device`);
            } catch (err) {
                this.logger.error(`❌ Falha excluindo pessoa ${p.id}`, err);
            }
        }

        const vis = await this.visitorRepo.find({
            where: { state: VisitorState.INATIVO },
        });
        for (const v of vis) {
            try {
                await this.idface.deleteObjects(v.departmentId, 'users', { users: { id: v.id } });
                v.state = VisitorState.EXCLUIDO_DEVICE;
                await this.visitorRepo.save(v);
                this.logger.log(`✔ Visitante ${v.id} excluído do device`);
            } catch (err) {
                this.logger.error(`❌ Falha excluindo visitante ${v.id}`, err);
            }
        }
    }
}
