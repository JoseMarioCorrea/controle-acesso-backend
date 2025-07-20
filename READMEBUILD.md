# Guia de build, empacotamento e instalador (Windows)

> **Objetivo**: compilar o backend *NestJS* em um executável standalone
> (`ControleAcesso.exe`) e gerar o instalador `.exe` via **Inno Setup 6**,
> já contendo o banco **SQLite** embutido.

---

## 1. Pré‑requisitos

| Ferramenta            | Versão recomendada | Observações                                                     |
| --------------------- | ------------------ | --------------------------------------------------------------- |
| **Node.js**           | 20.13.0 (LTS)      | Instale via `nvm` para alternar versões                         |
| **npm**               | ≥ 9.6              | Já vem com o Node 20                                            |
| **git**               | Qualquer recente   | Clonar o repositório                                            |
| **pkg** (dev dep)     | 5.8.1              | Já listado em *devDependencies*                                 |
| **esbuild** (dev dep) | 0.18.x             | Bundler ultra‑rápido                                            |
| **Inno Setup 6**      | 6.x                | `ISCC.exe` deve estar em `C:\Program Files (x86)\Inno Setup 6\` |

```powershell
nvm install 20.13.0
nvm use 20.13.0
```

---

## 2. Instalação das dependências

```powershell
cd controle-acesso-backend
npm install
```

*O pacote **sqlite3@^5** está em `dependencies` – necessário para o driver
nativo.*

---

## 3. Scripts `package.json` relevantes

```jsonc
{
  "scripts": {
    "clean":   "rimraf dist release",                      // limpa builds anteriores
    "build":   "nest build && copy \"node_modules\\sql.js\\dist\\sql-wasm.wasm\" dist\\", // compila + copia wasm (opcional)
    "bundle":  "esbuild dist/main.js --bundle --platform=node --target=node18 --format=cjs --outfile=dist/bundle.js --external:sqlite3 --external:@nestjs/websockets/socket-module --external:@nestjs/microservices/microservices-module --external:@nestjs/microservices --external:class-transformer/storage",
    "pkg:win": "npm run clean && npm run build && npm run bundle && pkg dist/bundle.js --targets node18-win-x64 --output release/ControleAcesso.exe",
    "installer:win": "\"C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe\" setup.iss",
    "release:win": "npm run pkg:win && npm run installer:win"
  },
  "pkg": {
    "scripts": [
      "dist/**/*.js",
      "node_modules/axios/dist/**/*.cjs",
      "node_modules/sqlite3/lib/**/*.js"                      // incluir driver JS
    ],
    "assets": [
      ".env",
      "data/**/*.sqlite",                                     // banco embutido
      "uploads/**/*",
      "node_modules/sqlite3/lib/binding/**/node_sqlite3.node" // binário nativo
    ]
  }
}
```

Principais mudanças:

* `--external:sqlite3` no **esbuild** → mantém `require('sqlite3')` literal.
* Adição de **scripts** e **assets** do `sqlite3` na seção `pkg` para que o
  módulo nativo (`node_sqlite3.node`) vá para dentro do executável.

---

## 4. Geração do executável standalone

```powershell
npm run pkg:win    # gera release/ControleAcesso.exe
```

*O comando executa `clean` → `build` → `bundle` → `pkg`.*

Verifique a saída:

```
release\ControleAcesso.exe   (≈ 55 MB)
release\data\controle_acesso.sqlite
```

---

## 5. Geração do instalador

```powershell
npm run installer:win   # executa ISCC com setup.iss
```

O script **setup.iss** copia `ControleAcesso.exe`, cria atalhos e registra
no “Adicionar/Remover Programas”. O instalador final fica em
`release/Output/ControleAcesso_Setup.exe`.

> Tip : personalize ícone, nome de empresa, diretório‑padrão etc.

Se preferir um passo único:

```powershell
npm run release:win
```

---

## 6. Teste local

```powershell
cd release
./ControleAcesso.exe
```

Saída esperada:

```
[TypeOrmModule] Connection "default" has been established
[Nest] ... LOG [NestApplication] Nest application successfully started on port 3000
```

A API estará acessível em [http://localhost:3000](http://localhost:3000) com Swagger em
`/api` (se estiver habilitado).

---

## 7. Estrutura final de distribuição

```
release/
 ├─ ControleAcesso.exe
 ├─ data/
 │   └─ controle_acesso.sqlite
 ├─ Output/
 │   └─ ControleAcesso_Setup.exe   (instalador Inno Setup)
 └─ outros assets…
```

---

### Dúvidas frequentes

| Sintoma                                                      | Causa provável                               | Solução                                                                                                                                  |
| ------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `SQLite package has not been found installed` dentro do .exe | `sqlite3` não foi incluído pelo `pkg`        | 1. Confirme que está em **dependencies**<br>2. Verifique se o caminho `node_sqlite3.node` aparece no log de build (`--enable-pkgdebug`). |
| `Error: sql-wasm.wasm not included`                          | Arquivo copiado mas não listado em `assets`  | Adicione à lista ou remova totalmente se não usar sql.js no runtime nativo.                                                              |
| `error: short read while indexing nul` ao fazer `git add`    | Arquivo fantasma **nul** criado pelo Windows | `del nul` e adicione `nul` ao `.gitignore` (`echo nul>> .gitignore`) depois repita `git add -A`.                                         |

---

## 8. Versionamento no Git (opcional)

Caso deseje versionar o instalador e as alterações do build:

```powershell
# 1. Verifique os arquivos alterados
git status -s

# 2. Adicione somente o que interessa (ex.: scripts, setup.iss, README etc.)
git add package.json package-lock.json setup.iss README*.md src/**

# OU — para **forçar** e levar tudo que mudou
# (inclusive novos arquivos e deleções)
git add -A

# 3. Faça o commit
git commit -m "build(installer): ajustes finais do script pkg + guia markdown"

# 4. Envie para o remoto
git push origin feature/1.1.0

# Se o servidor rejeitar por divergência e você tiver certeza
# do que está fazendo, use (⚠️ sobrescreve remoto):
# git push --force-with-lease origin feature/1.1.0
```

> **Dica**: mantenha o diretório `release/` fora do versionamento
> adicionando‑o ao `.gitignore`, para evitar repositórios gigantes.

---

**Pronto!** O backend agora pode ser instalado em qualquer PC Windows
64 bits sem Node.js pré‑instalado e já leva o banco SQLite interno.





BUILD FINAL PARA ENVIO

# BACKEND -------------------------------------------------
cd controle-acesso-backend
npm ci
npm run pkg:win          # cria release/controleAcesso.exe

# FRONTEND ------------------------------------------------
cd ../controle-acesso-frontend
npm ci
npm run pkg:win          # cria release/controleAcessoUI.exe + dist/
:: em PowerShell ou cmd
rd /s /q release 2>NUL

mkdir release\backend\{data,uploads}
mkdir release\frontend

:: copia backend
copy controle-acesso-backend\release\controleAcesso.exe           release\backend\
xcopy /E /I /Y controle-acesso-backend\data\*                     release\backend\data\
copy controle-acesso-backend\.env                                 release\backend\

:: copia frontend
copy controle-acesso-frontend\release\controleAcessoUI.exe        release\frontend\
xcopy /E /I /Y controle-acesso-frontend\release\dist\*            release\frontend\dist\

:: script de inicialização
(
echo @echo off
echo echo 🔄  Iniciando Backend...
echo start "" ".\backend\controleAcesso.exe"
echo timeout /t 2 /nobreak ^>NUL
echo echo 🔄  Iniciando Frontend...
echo start "" ".\frontend\controleAcessoUI.exe"
echo echo ✅  Tudo pronto!  Abra http://localhost:5173
) > release\start.cmd

18.55

18.77


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
