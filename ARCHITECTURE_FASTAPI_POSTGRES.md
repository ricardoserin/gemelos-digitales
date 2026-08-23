# Arquitectura FastAPI + PostgreSQL

## Componentes

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | React 19 + Vite | Dashboard y visualización operacional |
| Web server | Nginx | Servir SPA y reverse proxy `/api` |
| Backend | FastAPI | REST API, reglas CMMS, telemetría y Gemini opcional |
| ORM | SQLAlchemy 2 | Persistencia y acceso a datos |
| Base de datos | PostgreSQL 16 | Estado operacional e histórico |
| Contenedores | Docker Compose | Orquestación local |

## Flujo de datos

```text
React
  |
  | HTTP /api
  v
Nginx
  |
  v
FastAPI
  |
  +---- fleet / alerts / CMMS / inventory
  |
  +---- telemetry snapshots
  |
  v
PostgreSQL
  |
  +---- equipment
  +---- alerts
  +---- work_orders
  +---- spare_parts
  +---- telemetry_history
```

## Decisiones

- PostgreSQL es la fuente de verdad.
- `JSONB` conserva la estructura rica del gemelo digital sin obligar a reescribir todos los componentes del frontend.
- Los campos usados para filtros, relaciones y búsquedas permanecen en columnas relacionales.
- `telemetry_history` separa el estado actual del histórico.
- MQTT, OPC-UA, TimescaleDB y Redis no se reportan como activos. Son extensiones futuras.
