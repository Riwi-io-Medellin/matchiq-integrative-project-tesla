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

- `feature/*`  
  Nuevas funcionalidades.  
  Ejemplo: `feature/login-system`

- `fix/*`  
  Corrección de errores.  
  Ejemplo: `fix/auth-token-expiration`

---

## Commit Convention

Se utiliza el estándar de commits convencionales:

- `feat:` nueva funcionalidad  
- `fix:` corrección de bug  
- `docs:` documentación  
- `refactor:` refactorización sin cambio funcional  
- `test:` tests  

Ejemplos:
feat: add matching scoring engine
fix: resolve jwt expiration bug
docs: update api documentation
refactor: optimize matching service
test: add unit tests for auth service

## Todo PR debe cumplir:

- Descripción clara del cambio
- Issue asociado