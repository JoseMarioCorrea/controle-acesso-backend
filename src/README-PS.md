# Rodar servidor Mysql
- cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
.\mysql.exe -u root -p



# 🛡️ Controle de Acesso - Backend (NestJS)

Este projeto é o backend de um sistema de controle de acesso que se comunica diretamente com equipamentos iDFace (Control iD) via REST API. Desenvolvido com **NestJS**, com integração a **MySQL** e interface com dispositivos físicos.

---

## 📦 Tecnologias Utilizadas

- **NestJS** (TypeScript)
- **Axios** (comunicação com iDFace)
- **MySQL** (via TypeORM)
- **class-validator + DTOs**
- **dotenv**

---

## ⚙️ Instalação

```bash
git clone https://github.com/seuusuario/controle-acesso-backend.git
cd controle-acesso-backend
npm install
```

Crie um arquivo `.env` na raiz:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=suasenha
DB_DATABASE=controle_acesso

IDFACE_BASE_URL=http://192.168.18.220
IDFACE_USER=admin
IDFACE_PASS=admin
IDFACE_DEVICE_ID=1
```

Rode o projeto:

```bash
npm run start:dev
```

---

## 📡 Endpoints - iDFace

| Método | Rota                          | Descrição                             |
|--------|-------------------------------|----------------------------------------|
| POST   | `/idface/login`              | Login no dispositivo                   |
| POST   | `/idface/logout`             | Logout da sessão                       |
| GET    | `/idface/session/valid`      | Verifica se sessão está ativa          |
| POST   | `/idface/reboot`             | Reinicia o dispositivo                 |
| POST   | `/idface/factory-reset`      | Restaura padrões de fábrica            |
| POST   | `/idface/time`               | Define data/hora                       |
| POST   | `/idface/network`            | Configura rede IP                      |
| POST   | `/idface/vpn/config`         | Define config de VPN                   |
| POST   | `/idface/vpn/upload-config`  | Envia arquivo .conf em base64          |
| POST   | `/idface/vpn/upload-zip`     | Envia zip VPN em base64                |
| POST   | `/idface/gpio`               | Consulta status de GPIO                |

---

## 👤 Endpoints - Usuário (com device_id)

| Método | Rota                             | Descrição                                   |
|--------|----------------------------------|----------------------------------------------|
| POST   | `/idface/user/authentication`    | Define modo de autenticação do usuário       |
| POST   | `/idface/user/device`            | Associa usuário ao dispositivo               |
| POST   | `/idface/user/group`             | Associa usuário a um grupo                   |
| POST   | `/idface/user/schedule`          | Define horário de acesso do usuário          |
| POST   | `/idface/user/delete`            | Remove usuário do equipamento                |

---

## 🗂️ Estrutura de Pastas

```
src/
│
├── devices/               # Módulo iDFace
│   ├── dto/               # DTOs de entrada
│   ├── idface.controller.ts
│   └── idface.service.ts
│
├── users/                 # Módulo de usuários
├── schedules/             # Horários
├── holidays/              # Feriados
├── departments/           # Departamentos
├── alarms/                # Alarmes e GPIO
└── app.module.ts
```

---

## 🧪 Testes via Postman

Use o arquivo Postman disponível em:

📥 [`idface-full-collection.postman_collection.json`](./idface-full-collection.postman_collection.json)

---

## 📘 Requisitos da API iDFace (Control iD)

- Toda requisição requer sessão via `?session=abc123`
- Autenticação inicial: `POST /login.fcgi` com `login` e `password`
- Campos como `device_id` são obrigatórios para operações de usuário
- Requisições em JSON via `Content-Type: application/json`

---

## ✅ To-Do Futuro

- Integração com Frontend React Native
- Cadastro de usuários com biometria ou facial
- Suporte a múltiplos dispositivos simultâneos
- Logs de auditoria e notificações

---

## 🧑‍💻 Autor

Desenvolvido por **José Mario Corrêa** com ❤️ e NestJS.
