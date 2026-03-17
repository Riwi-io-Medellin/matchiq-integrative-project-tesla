# MatchIQ-Frontend

Logic frontend

---

# MatchIQ

Plataforma inteligente de matching entre empresas y candidatos.

## Funcionalidades

* Login
* SignUp
* Create Offers
* Matching con IA
* Dashboard
* Ranking de candidatos
* Feedback y evaluación

## Arquitectura tecnológica

* Frontend: JavaScript puro + HTML
* Backend: Express.js
* Base de datos: PostgreSQL
* Inteligencia Artificial: OpenAI API

## Arquitectura general

Browser (HTML + JS)
|
v
API Gateway (Express.js)
|
-

|           |           |
Auth       Matching     Tests
Service     Engine      Engine
Express     Express     Express
|
v
PostgreSQL Database
|
v
OpenAI API

## Flujo de datos principal

Empresa crea oferta
↓
Express API
↓
Matching Service
↓
Consulta DB (skills, perfiles, experiencia)
↓
Scoring Engine
↓
OpenAI Prompt
↓
Ranking generado
↓
Tabla Match
↓
Dashboard empresa

## Sistema de autenticación

* JWT (JSON Web Token)
* Roles:

  * Admin (puede autenticarse sin registro de usuario mediante credenciales configuradas en variables de entorno `ADMIN_EMAIL` y `ADMIN_PASSWORD`)
  * Empresa
  * Candidato

## Flujo DevOps

Issue → Branch → Commit → Pull Request → Review → Tests → Merge a develop → Release → main → Deploy

## Arquitectura lógica

Frontend → API Express → Auth → Services → AI Engine → Database

## Modelo de datos (flujo de relaciones)

usuario
├─ perfil_empresa
│    └─ ofertas
│         ├─ oferta_skill
│         ├─ match
│         ├─ tests
│         │    └─ test_envio
│         │          └─ test_respuesta
│         │                └─ evaluacion_ia
│         └─ seleccion_final
│
└─ perfil_candidato
├─ candidato_skill
├─ match
└─ test_envio

---

MatchIQ es una plataforma de preselección automática de talento tecnológico que conecta empresas y desarrolladores mediante sistemas de coincidencia inteligente, ranking automatizado y evaluación técnica con IA.

El sistema elimina la postulación manual, automatiza la comparación de perfiles y permite a las empresas enfocarse únicamente en los mejores candidatos generados por el sistema.

## Flujo de carpetas

src/
│
├── config/
│   ├── db.js
│   ├── env.js
│
├── middlewares/
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   ├── error.middleware.js
│
├── modules/
│
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│
│   ├── users/
│   │   ├── users.routes.js
│   │   ├── users.controller.js
│   │   ├── users.service.js
│
│   ├── candidate/
│   │   ├── candidate.routes.js
│   │   ├── candidate.controller.js
│   │   ├── candidate.service.js
│
│   ├── company/
│   │   ├── company.routes.js
│   │   ├── company.controller.js
│   │   ├── company.service.js
│
│   ├── catalog/
│   │   ├── categories.routes.js
│   │   ├── skills.routes.js
│   │   ├── catalog.service.js
│
│   ├── offers/
│   │   ├── offers.routes.js
│   │   ├── offers.controller.js
│   │   ├── offers.service.js
│
│   ├── matching/
│   │   ├── matching.routes.js
│   │   ├── matching.controller.js
│   │   ├── matching.service.js
│
│   ├── tests/
│   │   ├── tests.routes.js
│   │   ├── tests.controller.js
│   │   ├── tests.service.js
│
│   ├── ai/
│   │   ├── ai.service.js
│
│   ├── admin/
│   │   ├── admin.routes.js
│   │   ├── admin.controller.js
│   │   ├── admin.service.js
│
├── utils/
│   ├── logger.js
│
├── app.js
├── server.js

#### MODELO DE ARQUITECTURA DE SESION

# Arquitectura de sesión MatchIQ
- Modelo de sesión híbrida:

  Access Token (JWT corto)

  Refresh Token (JWT largo, persistido en DB)

  Rotación de refresh token

  Invalidación en logout

  Middleware de validación

  Roles

  Seguridad por capas

# Modelo DB

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE
);
