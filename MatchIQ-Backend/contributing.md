# Contribution Guide — MatchIQ

Gracias por tu interés en contribuir a MatchIQ.  
Este documento define las normas técnicas, de calidad y de flujo de trabajo que garantizan un desarrollo ordenado, escalable y mantenible.

---

## Development Standards

Todo el código debe cumplir con los siguientes principios:

- Clean Code  
- SOLID

El objetivo es mantener un código:
- legible  
- mantenible  
- escalable  
- fácil de testear    

---

## Branching Strategy

Estructura de ramas oficial del proyecto:

- `main`  
  Rama de producción. Solo recibe código estable y versionado.

- `develop`  
  Rama de integración. Todo el desarrollo se fusiona aquí antes de producción.

- `feature/[ISSUE-(N)/]*`  
  Nuevas funcionalidades.  
  Ejemplo: `feature/[ISSUE-2]/login-system`

- `fix/[ISSUE-(N)/*`  
  Corrección de errores.  
  Ejemplo: `fix/[ISSUE-12]auth-token-expiration`

---

## Commit Convention

Se utiliza el estándar de commits convencionales:

- `feat:[ISSUE-(N)]` nueva funcionalidad con su respectivo issue  
- `fix:[ISSUE-(N)]` corrección de bug con su respectivo issue
- `docs:` documentación  
- `refactor:` refactorización sin cambio funcional  
- `test:` tests  

Ejemplos:
feat:[ISSUE-2] add matching scoring engine
fix:[ISSUE-12] resolve jwt expiration bug
docs: update api documentation
refactor: optimize matching service
test: add unit tests for auth service

## Todo PR debe cumplir:

- Descripción clara del cambio
- Issue asociado