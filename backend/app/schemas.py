from typing import Any
from pydantic import BaseModel, Field


class AcknowledgeAlertRequest(BaseModel):
    user: str = Field(min_length=1, max_length=120)
    notes: str = Field(default="Reconocida en centro de monitoreo.", max_length=2000)


class WorkOrderStatusRequest(BaseModel):
    status: str


class CopilotRequest(BaseModel):
    prompt: str | None = None
    message: str | None = None
    equipmentContext: dict[str, Any] | None = None
    context: dict[str, Any] | None = None


class DiagnoseRequest(BaseModel):
    equipment: dict[str, Any] | None = None
    telemetry: dict[str, Any] | None = None
    activeAlerts: list[dict[str, Any]] = Field(default_factory=list)
    selectedSubsystem: str | None = None
