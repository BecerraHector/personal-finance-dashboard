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
| GET/POST/DELETE | `/api/budgets?year&month` | Límites mensuales por categoría (upsert) |
| GET | `/api/summary?year&month` | Balance, totales por categoría, presupuestos e historial de 6 meses |

Todas las rutas (excepto auth) requieren `Authorization: Bearer <token>`.

## Roadmap

- [ ] Transacciones recurrentes (renta, suscripciones, salario)
- [ ] Exportar transacciones a CSV
- [ ] Metas de ahorro con seguimiento mensual
- [ ] Insights automáticos ("gastaste 30% más en comida que el mes pasado")
- [ ] Despliegue (Vercel + Railway/Render)
