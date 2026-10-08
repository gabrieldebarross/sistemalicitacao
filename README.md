# Sistema de Gestão de Licitações

Sistema web para gestão, acompanhamento e supervisão de processos de licitação e contratação pública.

O projeto tem como objetivo organizar o fluxo de trabalho, acompanhar etapas, responsáveis, prazos internos e registrar todo o histórico dos processos.

## 🎯 Objetivo

Centralizar o acompanhamento dos processos de contratação em um único sistema, permitindo:

- Acompanhar o andamento dos processos;
- Visualizar a etapa atual;
- Controlar responsáveis e setores;
- Registrar movimentações;
- Acompanhar prazos internos;
- Supervisionar processos em andamento;
- Padronizar fluxos de trabalho.

## ⚙️ Funcionalidades

- Autenticação de usuários com JWT;
- Controle de usuários e setores;
- Cadastro de tipos de processo;
- Configuração de fluxos de trabalho;
- Organização por fases e etapas;
- Criação e acompanhamento de processos;
- Avanço e devolução de etapas;
- Atribuição de responsáveis;
- Registro de movimentações;
- Histórico do processo;
- Acompanhamento de prazos internos;
- Supervisão dos processos.

## 🏛️ Tipos de Processo

O sistema foi estruturado para trabalhar com diferentes modalidades de contratação:

- Pregão;
- Concorrência;
- Concurso;
- Leilão;
- Diálogo Competitivo;
- Dispensa de Licitação;
- Inexigibilidade.

Cada tipo de processo pode possuir seu próprio fluxo, composto por fases e etapas.

## 🧩 Estrutura do Workflow

Tipo de Processo
       ↓
     Fluxo
       ↓
     Fase
       ↓
     Etapa
       ↓
    Processo
       ↓
 ProcessoEtapa
       ↓
 Movimentações

Essa estrutura permite separar a configuração do fluxo da execução de um processo real.

## 🏗️ Arquitetura

O backend utiliza uma arquitetura baseada em camadas:

Routes
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
Model
   ↓
Database

A separação de responsabilidades facilita a manutenção, testes e evolução do sistema.

## 🛠️ Tecnologias

### Backend
- Node.js
- TypeScript
- Express
- Sequelize
- MySQL
- JWT
- bcrypt
- dotenv
- CORS
- pnpm

### Em desenvolvimento
- Next.js
- React
- Tailwind CSS
- Docker
- Testes automatizados
- CI/CD

## 📊 Supervisão

O sistema possui uma estrutura de supervisão para acompanhar informações importantes do processo:

- Processo atual;
- Tipo de processo;
- Fluxo utilizado;
- Etapa atual;
- Responsável;
- Setor responsável;
- Progresso;
- Prazo interno;
- Situação do prazo;
- Última movimentação;
- Histórico das etapas.

## 🔐 Autenticação

A autenticação utiliza JWT (JSON Web Token).
Cada operação pode ser associada ao usuário autenticado, permitindo identificar quem realizou determinada movimentação no processo.

## 📁 Estrutura

backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
│
├── database/
│   ├── migrations/
│   └── seeders/
│
├── .env
├── package.json
└── tsconfig.json

## 🚀 Executando o projeto

### Requisitos
- Node.js
- pnpm
- MySQL

### Instalação

Clone o repositório e acesse a pasta do backend:
```bash
git clone url-do-repositorio
cd sistema_licitacao
pnpm install

Configure o arquivo `.env`:
```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=sistema_licitacoes
DB_USER=root
DB_PASSWORD=

JWT_SECRET=sua_chave_secreta
```

Execute as migrations:
```bash
pnpm sequelize-cli db:migrate
```

Execute os seeders:
```bash
pnpm sequelize-cli db:seed:all
```

Inicie o servidor:
```bash
pnpm dev
```

A API estará disponível em: `http://localhost:3000`

Endpoint de teste:
```bash
GET /api/health
```

## 🚧 Status

**Em desenvolvimento** 🚀

## 🎓 Objetivo técnico

O projeto também é utilizado como projeto prático para aplicação de conceitos de engenharia de software, incluindo:

- APIs REST;
- TypeScript;
- Arquitetura em camadas;
- Padrões arquiteturais;
- ORM;
- Transações;
- Autenticação e autorização;
- Workflows;
- Banco de dados relacional;
- Testes;
- Docker;
- CI/CD;
- Deploy.