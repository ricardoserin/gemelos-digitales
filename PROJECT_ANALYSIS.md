# Estado técnico — versión 3.0

El proyecto fue migrado desde un backend Express con datos en memoria a una arquitectura React/Vite + FastAPI + PostgreSQL.

## Mejoras implementadas

- Backend Express eliminado de la ejecución.
- FastAPI como API central.
- PostgreSQL 16 como fuente de verdad.
- SQLAlchemy 2 para persistencia.
- Seed inicial automático.
- Flota, alertas, OT y repuestos consultados desde API.
- Reconocimiento de alertas persistente.
- Creación/cambio de estado de OT persistente.
- Reserva y consumo/liberación de repuestos asociado a OT.
- Histórico de telemetría en PostgreSQL.
- Endpoint de ingesta para sensores externos.
- Simulación de telemetría trasladada al backend.
- Gráficos alimentados por histórico de PostgreSQL.
- KPIs recalculados desde datos persistidos.
- Docker Compose con frontend, backend y PostgreSQL.
- Nginx como servidor estático y reverse proxy.
- Swagger disponible en `/docs`.

## Roadmap

Para una siguiente etapa se recomienda incorporar autenticación/RBAC, Alembic, MQTT/OPC-UA, TimescaleDB para grandes volúmenes de series temporales, observabilidad y modelos predictivos entrenados con datos reales.
