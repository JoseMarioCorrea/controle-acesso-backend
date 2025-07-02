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

| Sintoma                                                      | Causa provável                              | Solução                                                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `SQLite package has not been found installed` dentro do .exe | `sqlite3` não foi incluído pelo `pkg`       | 1. Confirme que está em **dependencies**<br>2. Verifique se o caminho `node_sqlite3.node` aparece no log de build (`--enable-pkgdebug`). |
| `Error: sql-wasm.wasm not included`                          | Arquivo copiado mas não listado em `assets` | Adicione à lista ou remova totalmente se não usar sql.js no runtime nativo.                                                              |

---

**Pronto!** O backend agora pode ser instalado em qualquer PC Windows
64 bits sem Node.js pré‑instalado e já leva o banco SQLite interno.
