# Documentação das Modificações

Este documento resume em **markdown** todas as alterações realizadas no projeto de Controle de Acesso.

---

## 1. Módulos e Integrações

### 1.1 AuthModule

* **Novo endpoint** `POST /auth/login` em `AuthController`.
* **`OauthService`**: gera usuário `admin/admin` na inicialização (`seedAdmin`), faz validação de credenciais e retorna dados sem senha.

### 1.2 IdfaceModule

* **Importações**: `HttpModule`, `TypeOrmModule.forFeature([Device])`.
* **`IdfaceService`**: adapta toda a comunicação HTTP com o device Control ID via CGI:

  * `ensureSession`: login e cache de sessão.
  * Métodos genéricos: `createUsersBatch`, `updateUsersBatch`, `loadObjects`, `deleteObjects`.
  * Upload e teste de foto (`uploadUserPhoto`, `testUserImage`).
  * Endpoint de liberação de acesso (`liberarAcesso`).

### 1.3 SyncModule

* **`ScheduleModule.forRoot()`** ativado para cron.
* **`SyncService`** agendado a cada 30s:

  * Transições de estado (**SALVO** → **PENDENTE\_ENVIO** → **ENVIADO**).
  * Envio de `Pessoa` e `Visitante` via `IdfaceService`.
  * Exclusão de objetos para estados **INATIVO** → **EXCLUIDO\_DEVICE**.

---

## 2. Entidades (TypeORM)

### 2.1 Pessoa

* **Enum** `PersonState` adicionado e coluna `state` (`enum`, default `SALVO`).
* Coluna `departmentId` + relação `ManyToOne(Departamento)`.
* `ManyToMany` com `Grupo` via tabela **pessoa\_grupos**.
* Campos de foto: `fotoFilename`.
* Flags: `administrador`, `inativo`, `listaExcecao`, `isVisitante`.

### 2.2 Departamento

* `Entity('departments')`: relação `OneToMany` com `Grupo` e `Device`.

### 2.3 Grupo

* `Entity('grupos')`: `ManyToOne` → `Department` (coluna `departmentId`).
* `ManyToMany` com `Pessoa` e com `Visitante` (via entity invertida).

### 2.4 Device

* `Entity('idface')`: `id`, `nome`, `ip`, FK `departmentId` → `Department`.

### 2.5 Visitante

* **Enum** `VisitorState` e coluna `state` (`enum`, default `SALVO`).
* Campos básicos e `visitedCompanyId`.
* `ManyToMany` com `Grupo` via tabela **visitante\_grupos**.
* Foto em disco: `fotoFilename`.

---

## 3. DTOs e Validações

### 3.1 Create/UpdatePessoaDto

* Campos ajustados: `departmentId: number`, `grupos: number[]`, sem terminalId.
* `class-validator` + `class-transformer` para tipar corretamente.

### 3.2 Create/UpdateVisitorDto

* Campos obrigatórios: `selectedGroups: number[]`, opcional `visitedCompanyId: number`.
* Removido `terminalId`, `userIdIdface` do DTO.

### 3.3 CreateDepartmentDto

* `deviceId: number` em vez de `device`.
* `userIds?: number[]`, `visitorIds?: number[]` com validações.

---

## 4. Services

### 4.1 PessoasService

* Métodos **base-only**: `createBase`, `updateBase`, `removeBase`, `findAll`, `findById`.
* Upload/listagem de fotos em `uploads/pessoas/{userId}`.

### 4.2 VisitorsService

* Métodos **base-only** equivalentes: `createBase`, `updateBase`, `removeBase`, `findAll`, `findById`.
* Upload/listagem de fotos em `uploads/visitors/{visitorId}`.

### 4.3 DepartmentsService (sem alteração central) e TerminalsService existiam previamente.

---

## 5. Controllers

### 5.1 AuthController (/auth)

* `POST /login` → `OauthService.login`.

### 5.2 DepartmentsController (/departments)

* GET all, GET/\:id, POST (com criação de grupo padrão), PUT/\:id, DELETE/\:id, GET/\:id/groups.

### 5.3 IdfaceController (/idface)

* Batch create/update users, load/delete objects, upload/test photo, liberar acesso.

### 5.4 PessoasController (/pessoas)

* CRUD base, upload foto, list photos, latest photo.

### 5.5 VisitorsController (/visitors)

* CRUD base, upload photo, list photos, latest photo.

### 5.6 (Opcional) SyncController (/sync)

* `POST /sync` para disparar manualmente a sincronização (não obrigatório).

---

## 6. Agendamento e Fluxo de Estados

1. **Criação** de Pessoa/Visitante → estado `SALVO`.
2. **SyncService** roda a cada 30s:

   * `SALVO` → `PENDENTE_ENVIO`.
   * Envia ao device → `ENVIADO`.
3. Se `inativo` setado manualmente:

   * Sync detecta `INATIVO` → exclui do device → `EXCLUIDO_DEVICE`.

---

**Fim da documentação.** Copie e adapte conforme necessário. Qualquer dúvida ou acréscimo, é só falar!
