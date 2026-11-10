# luv2shop – Angular + Spring Boot e-commerce

**Live demo:** https://luv2shop-ex.netlify.app/

> The backend runs on Render's free plan and sleeps after 15 minutes without traffic, so the first request can take up to a minute.

An online shop for developer books and gear: product catalog with categories, search and pagination, cart and checkout, JWT login, member discounts and an admin panel.

## Demo accounts

| User | Password | Role |
|---|---|---|
| `john` | `1234` | member, 10% off all products |
| `will` | `1234` | member, own discounts on some coffee mugs |
| `jim` | `1234` | admin |
| `arnold` | `1234` | admin |

## Features

- Catalog: sidebar with categories and product counts, search, pagination, product details
- Cart and checkout; prices are calculated on the backend
- Sales per product for everyone, member discounts per user (all products or selected ones), stacked on the sale price
- JWT login, settings page (change name and password, see own discounts)
- Admin panel: products (create, delete, upload image, sale %), categories, members (create, delete, discounts), contact messages
- About and contact pages

## Tech stack

| Part | Technology | Hosting |
|---|---|---|
| Frontend | Angular 22, Tailwind CSS 4 | [Netlify](https://luv2shop-ex.netlify.app/) |
| Backend | Spring Boot 4, Java 21, Spring Data REST, Spring Security, JWT | [Render](https://luv2shop-api.onrender.com/api/catalog/category-counts) (Docker) |
| Database | PostgreSQL | Neon |

## Project structure

```
02-backend/spring-boot-ecommerce/   Spring Boot API (Dockerfile for Render)
03-frontend/angular-ecommerce/      Angular app
render.yaml                         Render Blueprint (backend)
netlify.toml                        Netlify build settings (frontend)
```

## Run locally

**Backend** – with an in-memory H2 database, no setup needed:

```bash
cd 02-backend/spring-boot-ecommerce
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev      # Windows: .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Or with PostgreSQL: copy `.env.example` to `env.properties`, fill in `ECOMMERCE_DB_URL`, `ECOMMERCE_DB_USERNAME`, `ECOMMERCE_DB_PASSWORD` and `JWT_SECRET`, then run `./mvnw spring-boot:run`. An empty database is filled with the demo catalog on the first start.

**Frontend:**

```bash
cd 03-frontend/angular-ecommerce
npm install
npm start          # http://localhost:4200, talks to http://localhost:8080
```

## Deployment

- **Render** (backend): New → Blueprint → this repo. Set `ECOMMERCE_DB_URL`, `ECOMMERCE_DB_USERNAME`, `ECOMMERCE_DB_PASSWORD` and `CORS_ALLOWED_ORIGINS` (the Netlify address); `JWT_SECRET` is generated.
- **Netlify** (frontend): import this repo; build settings come from `netlify.toml`. The API address is in `src/environments/environment.prod.ts`.
