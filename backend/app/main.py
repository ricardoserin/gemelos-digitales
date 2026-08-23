from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import Body, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from .config import get_settings
from .database import Base, SessionLocal, engine, get_db
from .models import AlertRow, EquipmentRow, SparePartRow, TelemetryHistoryRow, WorkOrderRow
from .schemas import AcknowledgeAlertRequest, CopilotRequest, DiagnoseRequest, WorkOrderStatusRequest
from .seed import parse_dt, seed_database
from .services import alert_to_dict, compute_kpis, equipment_to_dict, simulate_telemetry, work_order_to_dict

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="Gemelo Digital Operacional de Carguío Minero API",
    description="API FastAPI + PostgreSQL para el gemelo digital minero y CMMS.",
    version="3.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def sync_equipment_work_order_count(db: Session, equipment_id: str) -> None:
    equipment = db.get(EquipmentRow, equipment_id)
    if not equipment:
        return
    open_count = db.scalar(
        select(func.count())
        .select_from(WorkOrderRow)
        .where(
            WorkOrderRow.equipment_id == equipment_id,
            WorkOrderRow.status.notin_(["COMPLETADA", "CANCELADA"]),
        )
    ) or 0
    data = dict(equipment.data)
    data["openWorkOrderCount"] = int(open_count)
    equipment.data = data
    flag_modified(equipment, "data")


def reserve_parts_for_work_order(db: Session, payload: dict[str, Any]) -> None:
    requested: list[tuple[SparePartRow, int]] = []
    for item in payload.get("requiredParts", []):
        part_id = item.get("partId")
        quantity = int(item.get("quantity", 0))
        if not part_id or quantity <= 0:
            continue
        part = db.get(SparePartRow, part_id)
        if not part:
            raise HTTPException(status_code=422, detail=f"Repuesto no encontrado: {part_id}")
        free_stock = part.stock_available - part.stock_reserved
        if free_stock < quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Stock insuficiente para {part.part_number}. Disponible sin reservar: {free_stock}",
            )
        requested.append((part, quantity))

    for part, quantity in requested:
        part.stock_reserved += quantity
        data = dict(part.data)
        data["stockReserved"] = part.stock_reserved
        part.data = data
        flag_modified(part, "data")


def release_or_consume_parts(db: Session, row: WorkOrderRow, new_status: str) -> None:
    if new_status not in {"COMPLETADA", "CANCELADA"}:
        return
    for item in row.data.get("requiredParts", []):
        part = db.get(SparePartRow, item.get("partId"))
        quantity = int(item.get("quantity", 0))
        if not part or quantity <= 0:
            continue
        part.stock_reserved = max(0, part.stock_reserved - quantity)
        if new_status == "COMPLETADA":
            part.stock_available = max(0, part.stock_available - quantity)
        data = dict(part.data)
        data["stockReserved"] = part.stock_reserved
        data["stockAvailable"] = part.stock_available
        part.data = data
        flag_modified(part, "data")


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": "3.0.0-fastapi-postgresql",
        "dataMode": "POSTGRESQL_PERSISTENT",
        "postgresqlStatus": "CONNECTED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/fleet")
def get_fleet(db: Session = Depends(get_db)):
    rows = db.scalars(select(EquipmentRow).order_by(EquipmentRow.code)).all()
    return [equipment_to_dict(row) for row in rows]


@app.get("/api/fleet/{equipment_id}")
def get_equipment(equipment_id: str, db: Session = Depends(get_db)):
    row = db.get(EquipmentRow, equipment_id)
    if not row:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return equipment_to_dict(row)


@app.get("/api/spare-parts")
def get_spare_parts(db: Session = Depends(get_db)):
    rows = db.scalars(select(SparePartRow).order_by(SparePartRow.part_number)).all()
    return [row.data for row in rows]


@app.get("/api/work-orders")
def get_work_orders(db: Session = Depends(get_db)):
    rows = db.scalars(select(WorkOrderRow).order_by(WorkOrderRow.created_at.desc())).all()
    return [work_order_to_dict(row) for row in rows]


@app.post("/api/work-orders", status_code=201)
def create_work_order(payload: dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    required = ["id", "code", "equipmentId", "equipmentCode", "type", "status", "priority", "createdAt"]
    missing = [key for key in required if not payload.get(key)]
    if missing:
        raise HTTPException(status_code=422, detail=f"Campos obligatorios faltantes: {', '.join(missing)}")
    if db.get(WorkOrderRow, payload["id"]) or db.scalar(select(WorkOrderRow.id).where(WorkOrderRow.code == payload["code"])):
        raise HTTPException(status_code=409, detail="La orden de trabajo o su código ya existe")
    if not db.get(EquipmentRow, payload["equipmentId"]):
        raise HTTPException(status_code=422, detail="El equipo asociado no existe")

    reserve_parts_for_work_order(db, payload)
    row = WorkOrderRow(
        id=payload["id"], code=payload["code"], equipment_id=payload["equipmentId"],
        equipment_code=payload["equipmentCode"], type=payload["type"], status=payload["status"],
        priority=payload["priority"], created_at=parse_dt(payload["createdAt"]), data=payload,
    )
    db.add(row)
    db.flush()
    sync_equipment_work_order_count(db, row.equipment_id)
    db.commit()
    db.refresh(row)
    return work_order_to_dict(row)


@app.patch("/api/work-orders/{work_order_id}/status")
def update_work_order_status(work_order_id: str, request: WorkOrderStatusRequest, db: Session = Depends(get_db)):
    allowed = {"CREADA", "PLANIFICADA", "EN_EJECUCION", "EN_REVISION", "COMPLETADA", "CANCELADA"}
    if request.status not in allowed:
        raise HTTPException(status_code=422, detail="Estado de OT inválido")
    row = db.get(WorkOrderRow, work_order_id)
    if not row:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    if row.status in {"COMPLETADA", "CANCELADA"} and request.status != row.status:
        raise HTTPException(status_code=409, detail="Una OT cerrada no puede reabrirse desde esta versión")

    previous_status = row.status
    row.status = request.status
    data = dict(row.data)
    data["status"] = request.status
    row.data = data
    flag_modified(row, "data")
    if previous_status not in {"COMPLETADA", "CANCELADA"}:
        release_or_consume_parts(db, row, request.status)
    db.flush()
    sync_equipment_work_order_count(db, row.equipment_id)
    db.commit()
    return work_order_to_dict(row)


@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    rows = db.scalars(select(AlertRow).order_by(AlertRow.detected_at.desc())).all()
    return [alert_to_dict(row) for row in rows]


@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, request: AcknowledgeAlertRequest, db: Session = Depends(get_db)):
    row = db.get(AlertRow, alert_id)
    if not row:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    row.acknowledged = True
    data = dict(row.data)
    data.update({
        "acknowledged": True,
        "acknowledgedBy": request.user,
        "acknowledgedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "acknowledgmentNotes": request.notes,
    })
    row.data = data
    flag_modified(row, "data")
    db.commit()
    return alert_to_dict(row)


@app.get("/api/kpis")
def get_kpis(db: Session = Depends(get_db)):
    return compute_kpis(db)


@app.get("/api/telemetry/{equipment_id}/history")
def telemetry_history(equipment_id: str, limit: int = 100, db: Session = Depends(get_db)):
    if not db.get(EquipmentRow, equipment_id):
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    safe_limit = max(1, min(limit, 1000))
    rows = db.scalars(
        select(TelemetryHistoryRow)
        .where(TelemetryHistoryRow.equipment_id == equipment_id)
        .order_by(TelemetryHistoryRow.captured_at.desc())
        .limit(safe_limit)
    ).all()
    return [
        {
            "id": row.id,
            "equipmentId": row.equipment_id,
            "capturedAt": row.captured_at.isoformat().replace("+00:00", "Z"),
            "telemetry": row.payload,
        }
        for row in rows
    ]


# IMPORTANT: declare the static /simulate route before the dynamic /{equipment_id}
# route. FastAPI/Starlette resolves routes in declaration order, so placing the
# dynamic route first would interpret the literal word "simulate" as an
# equipment_id and then require a telemetry JSON body, returning HTTP 422.
@app.post("/api/telemetry/simulate")
def simulate(db: Session = Depends(get_db)):
    return simulate_telemetry(db)


@app.post("/api/telemetry/{equipment_id}")
def ingest_telemetry(equipment_id: str, payload: dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    row = db.get(EquipmentRow, equipment_id)
    if not row:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    captured_at = datetime.now(timezone.utc)
    telemetry = dict(payload)
    telemetry["timestamp"] = telemetry.get("timestamp") or captured_at.isoformat().replace("+00:00", "Z")
    data = dict(row.data)
    data["telemetry"] = telemetry
    row.data = data
    flag_modified(row, "data")
    db.add(TelemetryHistoryRow(equipment_id=equipment_id, captured_at=captured_at, payload=telemetry))
    db.commit()
    return equipment_to_dict(row)


@app.post("/api/gemini/copilot")
def gemini_copilot(request: CopilotRequest):
    question = request.prompt or request.message or ""
    context = request.equipmentContext or request.context or {}
    if not settings.gemini_api_key:
        analysis = (
            f"[ASISTENTE LOCAL] Para la consulta \"{question}\", recomiendo revisar parámetros de vibración, "
            "presiones hidráulicas, tendencia térmica y RUL antes de intervenir. Si el RUL cae bajo el umbral "
            "operacional, genere una OT prescriptiva y aplique LOTO antes de cualquier inspección física."
        )
        return {"analysis": analysis, "reply": analysis, "mode": "LOCAL_FALLBACK"}

    try:
        from google import genai
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = (
            "Eres TwinGuard AI, especialista en mantenimiento predictivo minero e ISO 14224. "
            f"Contexto: {context}. Consulta: {question}. Responde en español técnico, conciso y accionable."
        )
        response = client.models.generate_content(model=settings.gemini_model, contents=prompt)
        analysis = response.text or "Sin respuesta del modelo."
        return {"analysis": analysis, "reply": analysis, "mode": "GEMINI"}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini no disponible: {exc}")


@app.post("/api/gemini/diagnose")
def gemini_diagnose(request: DiagnoseRequest):
    telemetry = request.telemetry or {}
    subsystem = request.selectedSubsystem or "SISTEMA_HIDRAULICO"
    return {
        "diagnosis": f"Análisis prescriptivo del subsistema {subsystem}: validar vibración RMS ({telemetry.get('vibrationRms', 'N/D')}) y temperatura hidráulica ({telemetry.get('hydraulicTemp', 'N/D')}).",
        "rootCauseAnalysis": "Posible degradación térmica/cavitación; confirmar con tendencia histórica y análisis de aceite antes de reemplazo.",
        "prescriptiveWorkPlan": [
            "Aplicar LOTO y despresurizar el circuito.",
            "Tomar muestra de aceite y revisar filtros.",
            "Inspeccionar bomba, líneas de succión y válvulas de alivio.",
            "Corregir componente degradado y ejecutar flushing si corresponde.",
            "Realizar prueba de presión, temperatura y vibración antes de liberar el equipo.",
        ],
        "iso14224Code": "HYD-CAV-PUMP-02",
        "riskLevel": "ALTO",
    }
