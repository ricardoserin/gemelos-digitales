import json
import os
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import AlertRow, EquipmentRow, SparePartRow, WorkOrderRow


SEED_PATH = Path(os.getenv("SEED_DATA_PATH", str(Path.cwd() / "seed_data.json")))


def parse_dt(value: str | None) -> datetime:
    if not value:
        return datetime.now().astimezone()
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def seed_database(db: Session) -> None:
    exists = db.scalar(select(EquipmentRow.id).limit(1))
    if exists:
        return

    data = json.loads(SEED_PATH.read_text(encoding="utf-8"))

    for item in data["equipment"]:
        db.add(EquipmentRow(
            id=item["id"], code=item["code"], name=item["name"], type=item["type"],
            status=item["status"], health_score=item["healthScore"], rul_hours=item["rulHours"], data=item,
        ))

    for item in data["spare_parts"]:
        db.add(SparePartRow(
            id=item["id"], part_number=item["partNumber"], description=item["description"],
            stock_available=item["stockAvailable"], stock_reserved=item["stockReserved"], data=item,
        ))

    db.flush()

    for item in data["alerts"]:
        db.add(AlertRow(
            id=item["id"], equipment_id=item["equipmentId"], equipment_code=item["equipmentCode"],
            severity=item["severity"], acknowledged=item["acknowledged"], resolved=item["resolved"],
            detected_at=parse_dt(item["detectedAt"]), data=item,
        ))

    for item in data["work_orders"]:
        db.add(WorkOrderRow(
            id=item["id"], code=item["code"], equipment_id=item["equipmentId"], equipment_code=item["equipmentCode"],
            type=item["type"], status=item["status"], priority=item["priority"],
            created_at=parse_dt(item["createdAt"]), data=item,
        ))

    db.commit()
