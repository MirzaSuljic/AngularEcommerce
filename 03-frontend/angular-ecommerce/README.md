# AngularEcommerce – frontend

Angular 22 storefront for the Spring Boot backend in `../../02-backend/spring-boot-ecommerce`
(product catalog, search, cart, checkout) with JWT login against the backend (`POST /api/login`).

Requires Node.js `^22.22.3`, `^24.15.0` or `^26`.

## Run

```bash
npm install
npm start          # ng serve -> http://localhost:4200
```

The backend must be running on `http://localhost:8080` (see `src/environments/environment.ts`).

## Build and test

```bash
npm run build      # production build in dist/angular-ecommerce
npm test           # Vitest + jsdom
```

## Notes

- Standalone components, `bootstrapApplication` (`src/main.ts`) and providers in `src/app/app.config.ts`.
- Routes are in `src/app/app.routes.ts`; built-in control flow (`@if`, `@for`) in templates.
- Login: `src/app/auth/` (AuthService, token storage, interceptor, guard). Demo users: john, will, jim, arnold – password `1234`.
