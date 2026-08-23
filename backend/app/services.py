import random
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from .models import AlertRow, EquipmentRow, TelemetryHistoryRow, WorkOrderRow


def equipment_to_dict(row: EquipmentRow) -> dict[str, Any]:
    data = dict(row.data)
    data.update({
        "id": row.id,
        "code": row.code,
        "name": row.name,
        "type": row.type,
        "status": row.status,
        "healthScore": row.health_score,
        "rulHours": row.rul_hours,
    })
    return data


def work_order_to_dict(row: WorkOrderRow) -> dict[str, Any]:
    data = dict(row.data)
    data.update({
        "id": row.id, "code": row.code, "equipmentId": row.equipment_id,
        "equipmentCode": row.equipment_code, "type": row.type,
        "status": row.status, "priority": row.priority,
    })
    return data


def alert_to_dict(row: AlertRow) -> dict[str, Any]:
    data = dict(row.data)
    data.update({
        "id": row.id, "equipmentId": row.equipment_id, "equipmentCode": row.equipment_code,
        "severity": row.severity, "acknowledged": row.acknowledged, "resolved": row.resolved,
        "detectedAt": row.detected_at.isoformat().replace("+00:00", "Z"),
    })
    return data


def compute_kpis(db: Session) -> dict[str, Any]:
    equipment = db.scalars(select(EquipmentRow)).all()
    if not equipment:
        return {}

    payloads = [equipment_to_dict(eq) for eq in equipment]
    count = len(payloads)
    status_counts = {
        "operativo": sum(1 for e in payloads if e["status"] == "OPERATIVO"),
        "enMantenimiento": sum(1 for e in payloads if e["status"] == "EN_MANTENIMIENTO"),
        "fueraDeServicio": sum(1 for e in payloads if e["status"] == "FUERA_DE_SERVICIO"),
        "standBy": sum(1 for e in payloads if e["status"] == "STAND_BY"),
    }
    open_critical = db.scalar(select(func.count()).select_from(AlertRow).where(
        AlertRow.severity.in_(["CRITICA", "EMERGENCIA"]),
        AlertRow.acknowledged.is_(False), AlertRow.resolved.is_(False)
    )) or 0
    pending_wo = db.scalar(select(func.count()).select_from(WorkOrderRow).where(
        WorkOrderRow.status.notin_(["COMPLETADA", "CANCELADA"])
    )) or 0

    return {
        "fleetHealthAvg": round(sum(float(e.get("healthScore", 0)) for e in payloads) / count, 1),
        "physicalAvailabilityPct": round(sum(float(e.get("availabilityPct", 0)) for e in payloads) / count, 1),
        "effectiveUtilizationPct": round(sum(float(e.get("utilizationPct", 0)) for e in payloads) / count, 1),
        "meanTimeBetweenFailuresHours": round(sum(float(e.get("mtbfHours", 0)) for e in payloads) / count),
        "meanTimeToRepairHours": round(sum(float(e.get("mttrHours", 0)) for e in payloads) / count, 1),
        "totalOperatingHoursToday": 384.5,
        "totalTonnageMovedToday": 48950,
        "avoidedDowntimeCostUsd": 6480000,
        "openCriticalAlertsCount": int(open_critical),
        "pendingWorkOrdersCount": int(pending_wo),
        "equipmentCountByStatus": status_counts,
    }


def simulate_telemetry(db: Session) -> list[dict[str, Any]]:
    rows = db.scalars(select(EquipmentRow).order_by(EquipmentRow.code)).all()
    now = datetime.now(timezone.utc)
    result: list[dict[str, Any]] = []

    for row in rows:
        data = dict(row.data)
        telemetry = dict(data.get("telemetry", {}))
        if not telemetry:
            result.append(equipment_to_dict(row))
            continue

        telemetry["hydraulicTemp"] = max(50, min(110, round(float(telemetry.get("hydraulicTemp", 70)) + random.uniform(-0.2, 0.2), 1)))
        telemetry["hydraulicPressure"] = max(200, min(380, round(float(telemetry.get("hydraulicPressure", 280)) + random.uniform(-1.0, 1.0), 1)))
        telemetry["vibrationRms"] = max(1.0, min(8.0, round(float(telemetry.get("vibrationRms", 2.5)) + random.uniform(-0.05, 0.05), 2)))
        telemetry["timestamp"] = now.isoformat().replace("+00:00", "Z")
        data["telemetry"] = telemetry
        row.data = data
        flag_modified(row, "data")
        db.add(TelemetryHistoryRow(equipment_id=row.id, captured_at=now, payload=telemetry))
        result.append(equipment_to_dict(row))

    db.commit()
    return result
