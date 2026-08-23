# Gemelo Digital Minero — FastAPI + PostgreSQL

Versión integrada del dashboard de mantenimiento de carguío minero.

## Arquitectura implementada

```text
Navegador
   |
   v
Frontend React/Vite (Nginx :3000)
   |  /api/*
   v
FastAPI (:8000)
   |
   v
PostgreSQL 16 (host :5436 → container :5432)
```

La aplicación ya no usa Express como backend. Nginx sirve la SPA y actúa como reverse proxy hacia FastAPI.

## Persistencia

PostgreSQL almacena:

- `equipment`: estado de flota, GPS, subsistemas y telemetría actual.
- `alerts`: alertas, reconocimiento y auditoría.
- `work_orders`: órdenes CMMS y su estado.
- `spare_parts`: catálogo, disponibilidad y reservas.
- `telemetry_history`: snapshots históricos de sensores por equipo.

Los objetos complejos se conservan en `JSONB`, mientras los campos de búsqueda/estado están normalizados en columnas e índices.

## Levantar con Docker

```bash
cp .env.docker.example .env
docker compose up -d --build
```

Servicios por defecto:

- Dashboard: http://localhost:3000
- FastAPI: http://localhost:8000
- Swagger/OpenAPI: http://localhost:8000/docs
- PostgreSQL: localhost:5436

Comprobar estado:

```bash
docker compose ps
docker compose logs -f backend
curl http://localhost:8000/api/health
```

## Endpoints principales

```text
GET    /api/health
GET    /api/fleet
GET    /api/fleet/{equipment_id}
GET    /api/spare-parts
GET    /api/alerts
POST   /api/alerts/{alert_id}/acknowledge
GET    /api/work-orders
POST   /api/work-orders
PATCH  /api/work-orders/{work_order_id}/status
GET    /api/kpis
GET    /api/telemetry/{equipment_id}/history
POST   /api/telemetry/{equipment_id}
POST   /api/telemetry/simulate
POST   /api/gemini/copilot
POST   /api/gemini/diagnose
```

## Telemetría

En modo demo, el frontend solicita cada 3 segundos a FastAPI un nuevo snapshot mediante:

```text
POST /api/telemetry/simulate
```

FastAPI actualiza la telemetría actual del equipo y guarda la muestra en `telemetry_history`.

Para una integración real con sensores, un gateway MQTT/OPC-UA puede enviar directamente un payload a:

```text
POST /api/telemetry/{equipment_id}
```

El dashboard consulta el histórico persistido para construir los gráficos.

## CMMS e inventario

Al crear una OT:

1. FastAPI valida que el equipo exista.
2. Valida los repuestos solicitados.
3. Comprueba stock libre.
4. Reserva el stock en PostgreSQL.
5. Persiste la OT.
6. Recalcula KPIs.

Al completar una OT se consume la reserva; al cancelarla se libera.

## Datos iniciales

En el primer arranque, si la tabla `equipment` está vacía, el backend carga `seed_data.json` con los datos demostrativos originales.

Los siguientes reinicios conservan los cambios gracias al volumen Docker `mining_postgres_data`.

Para reiniciar completamente los datos:

```bash
docker compose down -v
docker compose up -d --build
```

## Gemini

Gemini es opcional. Sin `GEMINI_API_KEY`, el backend responde con un asistente local de fallback y el resto del sistema funciona normalmente.

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

## Desarrollo local sin Nginx

Frontend:

```bash
npm install
npm run dev
```

Vite hace proxy de `/api` a `http://localhost:8000`.

Backend:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Para ese modo se necesita un PostgreSQL accesible y configurar `DATABASE_URL`.
