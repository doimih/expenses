# Expenses Manager (Laravel API + React PWA + PostgreSQL + Docker)

## 1) Structura finală proiect

```text
expenses/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── CategoryController.php
│   │   │   │   ├── ExpenseController.php
│   │   │   │   └── ReportController.php
│   │   │   └── Requests/
│   │   │       ├── CategoryRequest.php
│   │   │       ├── ExpenseRequest.php
│   │   │       ├── LoginRequest.php
│   │   │       └── RegisterRequest.php
│   │   ├── Models/
│   │   │   ├── Category.php
│   │   │   ├── Expense.php
│   │   │   └── User.php
│   │   └── Services/
│   │       └── MonthlyReportService.php
│   ├── config/
│   │   └── cors.php
│   ├── database/
│   │   └── migrations/
│   │       ├── 2026_02_22_000000_create_users_table.php
│   │       ├── 2026_02_22_000100_create_categories_table.php
│   │       └── 2026_02_22_000200_create_expenses_table.php
│   └── routes/
│       └── api.php
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── public/
    │   ├── manifest.json
    │   ├── sw.js
    │   └── icon.svg
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── hooks/
        │   └── useAuth.js
        ├── services/
        │   └── api.js
        ├── pages/
        │   ├── Login.jsx
        │   ├── Categories.jsx
        │   ├── Expenses.jsx
        │   └── Dashboard.jsx
        └── components/charts/
            ├── PieChart.jsx
            ├── BarChart.jsx
            └── LineChart.jsx
```

## 2) Rulare proiect

```bash
docker compose up --build
```

- API Laravel: `http://localhost:18000`
- Frontend React PWA: `http://localhost:15173`
- Public via Traefik: `https://projects.doimih.net/expenses`

## 3) API Routes (Laravel)

### Monitoring
- `GET /expenses/health`
- Endpoint public: `https://projects.doimih.net/expenses/health`
- Restricție acces: doar request-uri cu `Origin: https://projects.doimih.net`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (auth:sanctum)
- `GET /api/auth/tokens` (auth:sanctum)
- `POST /api/auth/logout` (auth:sanctum)
- `POST /api/auth/logout-all` (auth:sanctum)

### Categories (auth:sanctum)
- `GET /api/categories`
- `POST /api/categories`
- `GET /api/categories/{id}`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`

### Expenses (auth:sanctum)
- `GET /api/expenses?month=YYYY-MM`
- `POST /api/expenses`
- `GET /api/expenses/{id}`
- `PUT /api/expenses/{id}`
- `DELETE /api/expenses/{id}`

### Reports (auth:sanctum)
- `GET /api/reports/monthly?month=YYYY-MM`

## 4) Exemple JSON API

### Register
`POST /api/auth/register`

```json
{
  "name": "Demo User",
  "email": "demo@expenses.com",
  "password": "password",
  "password_confirmation": "password",
  "device_name": "pwa-ios"
}
```

Răspuns:

```json
{
  "token": "1|xxxxxxxxxxxxxxxx",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Demo User",
    "email": "demo@expenses.com"
  }
}
```

### Create Category
`POST /api/categories`

```json
{
  "name": "Food",
  "color": "#22C55E"
}
```

Răspuns:

```json
{
  "id": 1,
  "user_id": 1,
  "name": "Food",
  "color": "#22C55E",
  "created_at": "2026-02-22T10:00:00.000000Z",
  "updated_at": "2026-02-22T10:00:00.000000Z"
}
```

### Create Expense
`POST /api/expenses`

```json
{
  "category_id": 1,
  "amount": 120.5,
  "description": "Groceries",
  "date": "2026-02-22"
}
```

Răspuns:

```json
{
  "id": 10,
  "user_id": 1,
  "category_id": 1,
  "amount": "120.50",
  "description": "Groceries",
  "date": "2026-02-22",
  "category": {
    "id": 1,
    "name": "Food",
    "color": "#22C55E"
  }
}
```

### Monthly Report
`GET /api/reports/monthly?month=2026-02`

```json
{
  "month": "2026-02",
  "total": 1450.75,
  "by_category": [
    { "id": 1, "name": "Food", "color": "#22C55E", "total": 620.25 },
    { "id": 2, "name": "Transport", "color": "#F59E0B", "total": 330.0 }
  ],
  "charts": {
    "pie": {
      "labels": ["Food", "Transport"],
      "datasets": [
        {
          "label": "Distribuție categorii",
          "data": [620.25, 330.0],
          "backgroundColor": ["#22C55E", "#F59E0B"]
        }
      ]
    },
    "bar": {
      "labels": ["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"],
      "datasets": [
        {
          "label": "Total pe luni",
          "data": [910.0, 1020.3, 1200.0, 1310.5, 1400.2, 1450.75],
          "backgroundColor": "#6366F1"
        }
      ]
    },
    "line": {
      "labels": ["2026-02-01", "2026-02-02", "2026-02-03"],
      "datasets": [
        {
          "label": "Evoluție zilnică",
          "data": [40.0, 12.5, 90.0],
          "borderColor": "#0EA5E9",
          "backgroundColor": "rgba(14,165,233,0.2)",
          "fill": true,
          "tension": 0.35
        }
      ]
    }
  }
}
```

## 5) PWA

- Manifest: `frontend/public/manifest.json`
- Service Worker: `frontend/public/sw.js`
- Registration: `frontend/src/main.jsx`
- iOS install: Safari -> Share -> Add to Home Screen

## 6) Optimizări recomandate (senior)

1. Activează `php artisan config:cache` și `route:cache` în profilul production.
2. Mută `APP_KEY` în secret management (nu hardcoded).
3. Adaugă rate-limiting pe `/auth/login`.
4. Adaugă refresh flow pentru token și expirare controlată.
5. Adaugă index compus pe `expenses(user_id, category_id, date)` la volum mare.
6. Rulează frontend în imagine nginx pentru production (`vite build` + static serving).
7. Adaugă teste API (Pest/PHPUnit) pentru auth, categorii, cheltuieli, rapoarte.
