// src/pessoa/pessoas.controller.ts
import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Logger,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PessoasService } from './pessoas.service';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import { IdfaceService } from '../devices/idface.service';


@Controller('pessoas')
export class PessoasController {
  private readonly logger = new Logger(PessoasController.name);

  constructor(
    private readonly pessoasService: PessoasService,
    private readonly idfaceService: IdfaceService,
  ) { }

  @Post('enviar-idface')
  @UseInterceptors(FileInterceptor('foto'))
  async create(
    @UploadedFile() foto: Express.Multer.File,
    @Body() dto: CreatePessoaDto,
  ) {
    this.logger.log('Iniciando cadastro de pessoa e integração com iDFace');

    // 1. Cria no banco local
    const pessoaCriada = await this.pessoasService.create(dto, foto);
    this.logger.log(`Pessoa criada localmente: ID ${pessoaCriada.id}`);

    // 2. Login no iDFace
    await this.idfaceService.login();
    this.logger.log('Login no iDFace realizado com sucesso');

    // 3. Cria usuário no iDFace
    const respostaUser = await this.idfaceService.createUser({
      name: pessoaCriada.nome,
      registration: pessoaCriada.matricula,
      password: pessoaCriada.senha,
    });

    this.logger.debug(`Resposta do createUser: ${JSON.stringify(respostaUser)}`);

    const userId = respostaUser?.ids?.[0];

    if (!userId || typeof userId !== 'number') {
      throw new Error('Falha ao obter user_id do iDFace');
    }

    this.logger.log(`Usuário criado no iDFace: ID ${userId}`);
    //cria imagem no id face
    try {
      const fotoBuffer = foto.buffer;
      const imageResult = await this.idfaceService.updateUserImage(userId, fotoBuffer);
      this.logger.log(`Imagem cadastrada com sucesso: ${JSON.stringify(imageResult)}`);
    } catch (err) {
      this.logger.error(`Erro ao cadastrar imagem facial: ${err.message}`);
    }

    // 4. Cria grupo padrão
    const groupResult = await this.idfaceService.loadGroup('groups');
    this.logger.log(`Grupo criado no iDFace: ID ${JSON.stringify(groupResult)}`);
    const groupId = 1;
    this.logger.log(`Grupo criado no iDFace: ID ${groupId}`);

    // 5. Associa usuário ao grupo
    await this.idfaceService.createUserGroup(userId, groupId);
    this.logger.log(`Usuário ${userId} associado ao grupo ${groupId}`);

    // 6. Cria regra de acesso
    const accessRuleResult = await this.idfaceService.createAccessRule('Regra Padrão');
    this.logger.log(`Regra de acesso criada: ID accessRuleResult?.ids ${accessRuleResult?.ids}`);
    const accessRuleId = accessRuleResult?.ids?.[0];
    this.logger.log(`Regra de acesso criada: ID ${accessRuleId}`);

    // 7. Associa regra ao grupo
    /*await this.idfaceService.createGroupAccessRule(groupId, accessRuleId);
    this.logger.log(`Regra ${accessRuleId} associada ao grupo ${groupId}`);*/

    // 8. Cria zona de horário
    const timeZoneResult = await this.idfaceService.createTimeZone('Sempre');
    this.logger.log(`Zona de horário criada timeZoneResult: ID ${timeZoneResult}`);
    const timeZoneId = 1;
    this.logger.log(`Zona de horário criada: ID ${timeZoneId}`);

    // 9. Define intervalo de tempo
    await this.idfaceService.createTimeSpan({
      time_zone_id: timeZoneId,
      start: 0,
      end: 86399,
      sun: 1,
      mon: 1,
      tue: 1,
      wed: 1,
      thu: 1,
      fri: 1,
      sat: 1,
      hol1: 1,
      hol2: 1,
      hol3: 1,
    });
    this.logger.log(`Intervalo de tempo definido para zona ${timeZoneId}`);

    // 10. Associa zona à regra
    await this.idfaceService.createAccessRuleTimeZone(accessRuleId, timeZoneId);
    this.logger.log(`Zona de horário ${timeZoneId} associada à regra ${accessRuleId}`);

    return {
      mensagem: 'Pessoa cadastrada e enviada ao iDFace com sucesso',
      pessoa: pessoaCriada,
      idface: {
        user_id: userId,
        group_id: groupId,
        access_rule_id: accessRuleId,
        time_zone_id: timeZoneId,
      },
    };
  }
  @Get()
  async listarTodas() {
    const pessoas = await this.pessoasService.findAll();
    return pessoas;
  }

  @Delete(':id')
  async deletePessoa(@Param('id') id: number) {
    const pessoa = await this.pessoasService.findById(id);
    if (!pessoa) throw new NotFoundException('Pessoa não encontrada');

    if (pessoa.idfaceUserId) {
      await this.idfaceService.login();
      await this.idfaceService.deleteUser({ user_id: pessoa.idfaceUserId });
      await this.idfaceService.deleteUserImage(pessoa.idfaceUserId); // se quiser apagar a foto
    }

    await this.pessoasService.delete(id);
    return { message: 'Pessoa removida com sucesso do sistema e do iDFace' };
  }


}
