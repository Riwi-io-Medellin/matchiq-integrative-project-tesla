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

  * Admin
  * Empresa
  * Candidato

## Flujo DevOps

Issue → Branch → Commit → Pull Request → Review → Tests → Merge a develop → Release → main → Deploy

## Arquitectura lógica

Frontend → API Express → Auth → Services → AI Engine → Database

## Modelo de datos (flujo de relaciones)

usuario<br>
├─ perfil_empresa<br>
│    |─ ofertas<br>
│    |     ├─ oferta_skill<br>
│    |     ├─ match<br>
│    |     ├─ tests<br>
│    |     │    └─ test_envio<br>
│    |     │          └─ test_respuesta<br>
│    |     │                └─ evaluacion_ia<br>
│    |     └─ seleccion_final<br>
│
└─ perfil_candidato<br>
├─ candidato_skill<br>
├─ match<br>
└─ test_envio

---

MatchIQ es una plataforma de preselección automática de talento tecnológico que conecta empresas y desarrolladores mediante sistemas de coincidencia inteligente, ranking automatizado y evaluación técnica con IA.

El sistema elimina la postulación manual, automatiza la comparación de perfiles y permite a las empresas enfocarse únicamente en los mejores candidatos generados por el sistema.
