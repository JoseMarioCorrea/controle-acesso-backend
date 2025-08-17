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


Invoke-PS2EXE .\install-services.ps1 .\install-services.exe -requireAdmin -noConsole








<# install-services.ps1
   Recria serviços Backend/Frontend via NSSM com LOG detalhado.

   Uso:
     PowerShell -NoProfile -ExecutionPolicy Bypass -File .\install-services.ps1
     PowerShell -NoProfile -ExecutionPolicy Bypass -File .\install-services.ps1 -Pre
#>

param(
  [switch]$Pre,
  [string]$SvcBack         = 'ControleAcessoBackendV01',
  [string]$SvcFront        = 'ControleAcessoFrontendV01',
  [string]$BackPattern     = 'ControleAcesso*.exe',
  [string]$FrontPattern    = 'Front*end*.exe',
  [string]$NssmExe         = $null,
  [switch]$StartNow,
  # Se seu Front precisar abrir um arquivo HTML, informe aqui (opcional).
  [string]$FrontHtmlPath   = $null,        # ex.: "C:\release\frontend\index.html"
  [string]$FrontHtmlName   = 'index.html'  # usado se FrontHtmlPath não vier setado
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSDefaultParameterValues['Add-Content:Encoding'] = 'utf8'
$PSDefaultParameterValues['Out-File:Encoding']    = 'utf8'

# ───────────── paths base ─────────────
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).ProviderPath }
$RootDir   = (Resolve-Path (Join-Path $ScriptDir '..')).Path
$BinDir    = Join-Path $RootDir 'bin'

# logs
$RunId         = Get-Date -Format 'yyyyMMdd_HHmmss'
$SvcLogRoot    = Join-Path $env:ProgramData "Techtra\ControleAcesso"
$SetupLogRoot  = Join-Path $SvcLogRoot       "setup\$RunId"
$BackSvcLogs   = Join-Path $SvcLogRoot 'backend'
$FrontSvcLogs  = Join-Path $SvcLogRoot 'frontend'
$null = New-Item -ItemType Directory -Force -Path $SetupLogRoot,$BackSvcLogs,$FrontSvcLogs | Out-Null
$MainLog       = Join-Path $SetupLogRoot 'install_services.log'

# ───────────── helpers ─────────────
function Write-Log {
  param([Parameter(Mandatory)][string]$Message,
        [ValidateSet('INFO','WARN','ERROR','OK','CMD')][string]$Level='INFO')
  $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff'
  $line = "[$ts][$Level] $Message"
  switch ($Level) {
    'ERROR' { Write-Host $line -ForegroundColor Red }
    'WARN'  { Write-Host $line -ForegroundColor Yellow }
    'OK'    { Write-Host $line -ForegroundColor Green }
    'CMD'   { Write-Host $line -ForegroundColor Cyan }
    default { Write-Host $line }
  }
  Add-Content -Path $MainLog -Value $line
}
function Q([string]$s){ '"' + ($s -replace '"','""') + '"' }

function Exec {
  param(
    [Parameter(Mandatory)][string]$File,
    [Parameter(Mandatory)][string]$Args,
    [string]$Step = $null,
    [int[]]$SuccessCodes = @(0),
    [switch]$NoThrow
  )
  if (-not (Test-Path $File)) {
    Write-Log ("Arquivo não encontrado: {0}" -f $File) 'ERROR'
    if (-not $NoThrow) { throw "Missing: $File" } else { return $null }
  }
  if ($Step) { Write-Log (">> {0}" -f $Step) 'CMD' }
  Write-Log ("exec: {0} {1}" -f $File,$Args) 'CMD'

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $File
  $psi.Arguments = $Args
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError  = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $p = [System.Diagnostics.Process]::Start($psi)
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  if ($stdout) { Add-Content -Path $MainLog -Value $stdout.TrimEnd() }
  if ($stderr) { Add-Content -Path $MainLog -Value ("[stderr] " + $stderr.TrimEnd()) }
  Write-Log ("exitcode: {0}" -f $p.ExitCode) 'CMD'

  if ($SuccessCodes -notcontains $p.ExitCode) {
    if ($NoThrow) { Write-Log ("IGNORANDO falha (NoThrow): {0} {1}" -f $File,$Args) 'WARN' }
    else          { throw ("Command failed ({0}): {1} {2}" -f $p.ExitCode,$File,$Args) }
  }
  return $p.ExitCode
}

# admin
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).
  IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { Write-Log 'Rode como Administrador.' 'ERROR'; pause; exit 1 }

# achar NSSM/EXEs
function Find-Exe([string]$pattern){
  Write-Log ("Procurando: {0} em {1}" -f $pattern,$RootDir)
  $f = Get-ChildItem $RootDir -Recurse -Filter $pattern -File -ErrorAction SilentlyContinue |
       Select-Object -First 1 -ExpandProperty FullName
  if ($f) { Write-Log ("Achei: {0}" -f $f) 'OK' } else { Write-Log ("Não achei: {0}" -f $pattern) 'WARN' }
  $f
}
if (-not $NssmExe) {
  $cands = @(
    (Join-Path $BinDir 'nssm.exe'),
    (Join-Path $RootDir 'backend\tools\nssm.exe'),
    (Join-Path $RootDir 'frontend\tools\nssm.exe'),
    "$env:ProgramFiles(x86)\NSSM\nssm.exe",
    "$env:ProgramFiles(x86)\tools\nssm\nssm.exe",
    "C:\tools\nssm\nssm.exe"
  )
  $NssmExe = $cands | Where-Object { Test-Path $_ } | Select-Object -First 1
}
$BackExe  = Find-Exe $BackPattern
$FrontExe = Find-Exe $FrontPattern

Write-Log ("Host={0} User={1} PS={2} RootDir={3}" -f $env:COMPUTERNAME,$env:USERNAME,$PSVersionTable.PSVersion,$RootDir)
Write-Log ("NSSM={0}" -f $NssmExe)
if (-not (Test-Path $NssmExe)) { Write-Log "nssm.exe não encontrado." 'ERROR'; pause; exit 1 }
if (-not $BackExe)             { Write-Log "Backend EXE não encontrado." 'ERROR'; pause; exit 1 }
if (-not $FrontExe)            { Write-Log "Frontend EXE não encontrado." 'ERROR'; pause; exit 1 }

# ───────────── utilitários Node ─────────────
function Is-NodeHost([string]$exe){
  $name = [IO.Path]::GetFileName($exe).ToLower()
  if ($name -eq 'node.exe') { return $true }
  try {
    $vi = [Diagnostics.FileVersionInfo]::GetVersionInfo($exe)
    if ($vi.ProductName -like '*Node*' -or $vi.FileDescription -like '*Node*') { return $true }
  } catch {}
  return $false
}
function Find-NodeEntry([string]$base){
  $cands = @(
    (Join-Path $base 'dist\main.js'),
    (Join-Path $base 'dist\server.js'),
    (Join-Path $base 'dist\main.cjs'),
    (Join-Path $base 'build\main.js'),
    (Join-Path $base 'build\server.js'),
    (Join-Path $base 'server.js'),
    (Join-Path $base 'index.js')
  )
  foreach($c in $cands){ if (Test-Path $c) { return $c } }
  $any = Get-ChildItem -Path $base -Recurse -Filter main.js -ErrorAction SilentlyContinue |
         Select-Object -First 1 -ExpandProperty FullName
  if ($any) { return $any }
  return $null
}
function Make-AppParams-ABS([string]$entryFull){
  $full = (Resolve-Path $entryFull).Path
  return ('"""{0}"""' -f $full)  # triple-quotes para NSSM não zoar espaços
}

# ───────────── helpers de serviço ─────────────
function Remove-Svc([string]$Name){
  $svcName = $Name
  $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
  if ($svc) {
    try { Exec -File $NssmExe -Args ("stop {0}" -f $svcName)   -Step ("nssm stop {0}" -f $svcName) -NoThrow } catch {}
    try {
      Exec -File $NssmExe -Args ("remove {0} confirm" -f $svcName) -Step ("nssm remove {0}" -f $svcName) -NoThrow
      Write-Log ("Removido {0} (NSSM)" -f $svcName) 'OK'
    } catch {}
  }
  Exec -File "$env:SystemRoot\System32\sc.exe" -Args ("stop {0}" -f $svcName)   -NoThrow
  Exec -File "$env:SystemRoot\System32\sc.exe" -Args ("delete {0}" -f $svcName) -NoThrow
  Start-Sleep -Milliseconds 700
  try {
    $rk = "HKLM:\SYSTEM\CurrentControlSet\Services\$svcName"
    if (Test-Path $rk) { Remove-Item -Path $rk -Recurse -Force -ErrorAction Stop; Write-Log ("Registro removido: {0}" -f $rk) 'OK' }
  } catch { Write-Log ("Não consegui limpar registro de {0}: {1}" -f $svcName, $_.Exception.Message) 'WARN' }
}
function Dump-Nssm([string]$svcName){
  try { Exec -File $NssmExe -Args ("dump {0}" -f $svcName) -Step ("nssm dump {0}" -f $svcName) -NoThrow } catch {}
}

function Start-SvcRobusto {
  param(
    [Parameter(Mandatory)][string]$svcName,
    [Parameter(Mandatory)][string]$OutLog,
    [Parameter(Mandatory)][string]$ErrLog
  )
  Exec -File $NssmExe -Args ("start {0}" -f $svcName) -Step ("nssm start {0}" -f $svcName) -SuccessCodes @(0,1) -NoThrow

  $deadline = (Get-Date).AddSeconds(25)
  do {
    Start-Sleep -Milliseconds 600
    try { $st = Get-Service -Name $svcName -ErrorAction Stop } catch { Write-Log ("Não consegui ler status de {0}: {1}" -f $svcName, $_.Exception.Message) 'WARN'; break }
    if ($st.Status -eq 'Running') { Write-Log ("Status {0}: {1}" -f $svcName,$st.Status) 'OK'; return }
    if ($st.Status -in @('Paused','StartPending')) {
      if ($st.Status -eq 'Paused') { Write-Log ("Serviço {0} está PAUSED. Tentando Resume..." -f $svcName) 'WARN' }
      try { Resume-Service -Name $svcName -ErrorAction Stop } catch { Exec -File "$env:SystemRoot\System32\sc.exe" -Args ("continue {0}" -f $svcName) -NoThrow }
    }
  } while ((Get-Date) -lt $deadline)

  try { $st = Get-Service -Name $svcName -ErrorAction Stop } catch {}
  if (-not $st -or $st.Status -ne 'Running') {
    Write-Log ("AVISO: {0} não está Running. Tail dos logs:" -f $svcName) 'WARN'
    if (Test-Path $ErrLog) { (Get-Content $ErrLog -Tail 120 -ErrorAction SilentlyContinue) | ForEach-Object { Write-Log ("[ERR] {0}" -f $_) 'WARN' } }
    if (Test-Path $OutLog) { (Get-Content $OutLog -Tail 120 -ErrorAction SilentlyContinue) | ForEach-Object { Write-Log ("[OUT] {0}" -f $_) 'WARN' } }
    throw ("Serviço {0} não iniciou (status atual: {1})" -f $svcName, ($st.Status))
  }
}

function Install-Svc {
  param(
    [Parameter(Mandatory)][string]$Name,
    [Parameter(Mandatory)][string]$ExePath,
    [Parameter(Mandatory)][string]$SvcLogsDir,
    [string]$AppDirToUse = $null,
    [string]$DependOn = $null,
    [switch]$SkipNodeDetect,     # evita tratar como Node
    [string]$HtmlEntry = $null   # se o EXE precisar do index.html
  )

  $svcName = $Name
  $ExeDir  = Split-Path -Parent $ExePath
  $AppDir  = if ($AppDirToUse) { $AppDirToUse } else { $ExeDir }

  $null   = New-Item -ItemType Directory -Force -Path $SvcLogsDir | Out-Null
  $OutLog = Join-Path $SvcLogsDir 'svc_out.log'
  $ErrLog = Join-Path $SvcLogsDir 'svc_err.log'

  $AppParams = $null

  # --- Backend (Node) apenas se não pulado e EXE for Node host
  if (-not $SkipNodeDetect -and (Is-NodeHost $ExePath)) {
    $entry = Find-NodeEntry $AppDir
    if (-not $entry) {
      $dist = Join-Path $AppDir 'dist'
      if (Test-Path $dist) {
        Write-Log ("Conteúdo de {0}:" -f $dist)
        Get-ChildItem $dist | ForEach-Object { Write-Log ("  - {0}" -f $_.FullName) }
      } else {
        Write-Log ("Pasta dist não existe em: {0}" -f $AppDir) 'WARN'
      }
      throw ("ATENÇÃO: Executável parece ser Node, mas não encontrei entrypoint (ex.: {0})." -f (Join-Path $AppDir 'dist\main.js'))
    }
    if (-not (Test-Path $entry)) { throw ("EntryPoint não encontrado: {0}" -f $entry) }
    $AppParams = Make-AppParams-ABS $entry
    Write-Log ("Detectado Node host. AppParameters={0}" -f $AppParams)
  }

  # --- Frontend: se HtmlEntry foi passado, usa como parâmetro
  if ($HtmlEntry) {
    if (-not (Test-Path $HtmlEntry)) { throw ("HtmlEntry não encontrado: {0}" -f $HtmlEntry) }
    $AppParams = Make-AppParams-ABS $HtmlEntry
    Write-Log ("HtmlEntry configurado: {0}" -f $HtmlEntry)
  }

  Write-Log ("Instalando {0}" -f $svcName)
  Write-Log ("  Exe   : {0}" -f $ExePath)
  Write-Log ("  AppDir: {0}" -f $AppDir)
  Write-Log ("  Logs  : {0} | {1}" -f $OutLog,$ErrLog)

  # limpa antes de instalar
  Remove-Svc -Name $svcName

  # instala (com retry em erro 5)
  $installed = $false
  for($i=1;$i -le 2 -and -not $installed;$i++){
    try {
      Exec -File $NssmExe -Args ("install {0} {1}" -f $svcName,(Q $ExePath)) -Step ("nssm install {0}" -f $svcName) -SuccessCodes @(0)
      $installed = $true
    } catch {
      if ($_.Exception.Message -match 'failed \(5\)' -or $_.Exception.Message -match '\(5\):') {
        Write-Log "Install retornou 5 (Access denied). Forçando limpeza e retry..." 'WARN'
        Remove-Svc -Name $svcName
        Start-Sleep -Milliseconds 800
      } else { throw }
    }
  }
  if (-not $installed) { throw "Não consegui instalar o serviço $svcName (erro 5 persistente)." }

  # configurações NSSM
  Exec -File $NssmExe -Args ("set {0} AppDirectory {1}"   -f $svcName,(Q $AppDir))
  Exec -File $NssmExe -Args ("set {0} AppNoConsole 1"     -f $svcName)
  Exec -File $NssmExe -Args ("set {0} AppStdout {1}"      -f $svcName,(Q $OutLog))
  Exec -File $NssmExe -Args ("set {0} AppStderr {1}"      -f $svcName,(Q $ErrLog))
  Exec -File $NssmExe -Args ("set {0} AppRestartDelay 5000" -f $svcName)
  Exec -File $NssmExe -Args ("set {0} AppExit Default Restart" -f $svcName)
  Exec -File $NssmExe -Args ("set {0} ObjectName LocalSystem" -f $svcName) -NoThrow
  if ($AppParams) { Exec -File $NssmExe -Args ("set {0} AppParameters {1}" -f $svcName, $AppParams) }
  if ($DependOn)  { Exec -File $NssmExe -Args ("set {0} DependOnService {1}" -f $svcName,$DependOn) }
  Exec -File $NssmExe -Args ("set {0} Start SERVICE_AUTO_START" -f $svcName)
  Exec -File "$env:SystemRoot\System32\sc.exe" -Args ("config {0} start= delayed-auto" -f $svcName)

  Dump-Nssm $svcName

  if ($StartNow -or $true) {
    Start-SvcRobusto -svcName $svcName -OutLog $OutLog -ErrLog $ErrLog
  }
}

# ───────────── execução ─────────────
try {
  if ($Pre) {
    Write-Log 'PRE: parar/remover serviços'
    Remove-Svc -Name $SvcBack
    Remove-Svc -Name $SvcFront
    Write-Log 'PRE ok' 'OK'
  } else {
    Write-Log 'Instalação INICIADA'

    # BACKEND: Node (detecta main.js/entrypoint sozinho)
    Install-Svc -Name $SvcBack `
      -ExePath $BackExe `
      -SvcLogsDir $BackSvcLogs

    # FRONTEND: SEM detecção Node, opcional HtmlEntry
    $frontExeDir = Split-Path -Parent $FrontExe
    $htmlToUse = $null
    if ($FrontHtmlPath) {
      $htmlToUse = $FrontHtmlPath
    } else {
      $tryHtml = Join-Path $frontExeDir $FrontHtmlName
      if (Test-Path $tryHtml) { $htmlToUse = $tryHtml }
    }

    if ($htmlToUse) {
      Install-Svc -Name $SvcFront `
        -ExePath $FrontExe `
        -SvcLogsDir $FrontSvcLogs `
        -DependOn $SvcBack `
        -SkipNodeDetect `
        -HtmlEntry $htmlToUse
    } else {
      Install-Svc -Name $SvcFront `
        -ExePath $FrontExe `
        -SvcLogsDir $FrontSvcLogs `
        -DependOn $SvcBack `
        -SkipNodeDetect
    }

    if ($StartNow) { Write-Log 'StartNow já aplicado (NSSM start após install).' }
    Write-Log 'Instalação CONCLUÍDA' 'OK'
  }
}
catch {
  Write-Log ("ERRO geral: {0}" -f $_.Exception.Message) 'ERROR'
  if ($_.InvocationInfo) {
    Write-Log ("Onde: {0}:{1}" -f $_.InvocationInfo.ScriptName, $_.InvocationInfo.ScriptLineNumber) 'WARN'
    Write-Log ("Linha: {0}" -f ($_.InvocationInfo.Line.Trim())) 'WARN'
  }
}

Write-Log ("Log principal: {0}" -f $MainLog) 'OK'
Write-Host ""
Write-Host "Logs de runtime:"
Write-Host "  Backend: $BackSvcLogs\svc_out.log | $BackSvcLogs\svc_err.log"
Write-Host "  Front  : $FrontSvcLogs\svc_out.log | $FrontSvcLogs\svc_err.log"
Write-Host ""
pause
