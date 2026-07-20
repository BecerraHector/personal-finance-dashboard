# Presupuestador

Aplicación web full-stack para llevar el control de un presupuesto mensual: ingresos, gastos categorizados, límites de gasto por categoría y balance a fin de mes.

## Funcionalidades

- **Autenticación** con JWT (registro e inicio de sesión); cada usuario nuevo recibe un set de categorías por defecto.
- **Transacciones** de ingreso y gasto con categoría, fecha y descripción, agrupadas por día y navegables por mes.
- **Categorías personalizables** con colores de una paleta accesible (validada para daltonismo).
- **Presupuestos por categoría**: límite mensual con barra de progreso y alerta al excederse.
- **Dashboard mensual**: balance del mes, gastos por categoría (dona), evolución de ingresos vs. gastos de los últimos 6 meses (barras) y progreso de presupuestos.
- **Tests unitarios** (Vitest) de la lógica de resumen, presupuestos y fechas: `npm test` en `backend/` y `frontend/`.
- **Modo oscuro** con toggle persistente (respeta la preferencia del sistema por defecto, sin flash al cargar).
- **Transacciones recurrentes** (renta, suscripciones, salario): reglas con día del mes, pausa/reactivación, y generación automática por *materialización perezosa* — al consultar datos, el backend crea las ocurrencias pendientes, con catch-up de meses perdidos aunque el servidor haya estado apagado.
- **Metas de ahorro**: monto objetivo y mes límite, con aportes manuales; la app calcula cuánto apartar al mes y si vas en camino (contra el ritmo lineal esperado), atrasado, o si la meta venció.
- **Insights automáticos** en el dashboard: cambios significativos por categoría vs. el mes anterior, gastos nuevos, variación del gasto total, tasa de ahorro, proyección de presupuestos al ritmo actual y concentración del gasto — con umbrales relativos para evitar ruido.
- **Exportar a CSV** el mes visible (UTF-8 con BOM, compatible con Excel).
- Moneda en **pesos chilenos (CLP)**, configurable en `frontend/src/lib/format.ts`.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite, Tailwind CSS 4, TanStack Query, React Router, Recharts |
| Backend | Node.js + Express 5 + TypeScript, Zod para validación |
| Base de datos | PostgreSQL 16 (Docker) + Prisma ORM |
| Auth | JWT (jsonwebtoken) + bcryptjs |

## Estructura

```
Presupuestador/
├── docker-compose.yml   # PostgreSQL 16
├── backend/             # API REST (Express + Prisma)
│   ├── prisma/          # Esquema y migraciones
│   └── src/
│       ├── routes/      # auth, categories, transactions, budgets, summary
│       ├── middleware/  # requireAuth (JWT), manejo de errores
│       └── lib/         # prisma, jwt, categorías por defecto
└── frontend/            # SPA (Vite + React)
    └── src/
        ├── pages/       # Login, Registro, Dashboard, Transacciones, Presupuestos, Categorías
        ├── components/  # Layout, MonthPicker, UI base
        ├── context/     # AuthContext
        └── api/         # Cliente axios + tipos
```

## Cómo correrlo en local

Requisitos: Node 20+, Docker.

```bash
# 1. Base de datos
docker compose up -d

# 2. Backend (puerto 4000)
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev

# 3. Frontend (puerto 5173, con proxy a la API)
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 y crea una cuenta (o usa `demo@demo.com` / `demo12345` si cargaste los datos de ejemplo).

## API

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Crear cuenta (siembra categorías por defecto) |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Usuario actual |
| GET/POST/PUT/DELETE | `/api/categories` | CRUD de categorías |
| GET/POST/PUT/DELETE | `/api/transactions?year&month` | CRUD de transacciones por mes |
| GET | `/api/transactions/export?year&month` | Descarga el mes como CSV |
| GET/POST/DELETE | `/api/budgets?year&month` | Límites mensuales por categoría (upsert) |
| GET/POST/PUT/DELETE | `/api/recurring` | Reglas de transacciones recurrentes |
| GET/POST/PUT/DELETE | `/api/goals` | Metas de ahorro (con progreso calculado) |
| POST/DELETE | `/api/goals/:id/contributions` | Aportes a una meta |
| GET | `/api/summary?year&month` | Balance, totales por categoría, presupuestos e historial de 6 meses |

Todas las rutas (excepto auth) requieren `Authorization: Bearer <token>`.

## Roadmap

Antes de desplegar a producción:

**Crítico**

- [ ] Corregir el interceptor de axios: solo debe cerrar sesión ante un 401 real, no ante errores de red o 500 (hoy desloguea al usuario si el backend está caído o arrancando en frío)
- [ ] Endurecer el backend: restringir CORS al origen de producción, rate limiting en `/api/auth` (`express-rate-limit`), `JWT_SECRET` obligatorio (sin fallback `dev-secret`), Helmet
- [ ] Definir arquitectura de despliegue: monolito (Express sirve el build del frontend, un solo servicio/dominio, sin CORS) vs. frontend y backend separados (Vercel + Railway/Render, requiere `VITE_API_URL` y CORS configurado)
- [ ] Script de seed (`prisma db seed`) para poblar el usuario demo con 3-4 meses de datos de ejemplo

**Recomendado**

- [ ] Sidebar responsive para mobile (hoy es de ancho fijo y se rompe en pantallas chicas)
- [ ] CI con GitHub Actions: correr los tests y el typecheck en cada push, badge en el README
- [ ] Screenshots del dashboard en el README (modo claro y oscuro)

**Opcional**

- [ ] Logging estructurado (pino)
- [ ] Tests de integración con supertest
- [ ] Paginación de transacciones

- [ ] Despliegue (Vercel + Railway/Render)
