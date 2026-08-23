export type EquipmentType = 'CAMION_EXTRACCION' | 'PALA_ELECTRICA' | 'PALA_HIDRAULICA' | 'CARGADOR_FRONTAL';

export type OperationalStatus = 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'FUERA_DE_SERVICIO' | 'STAND_BY';

export type SubsystemType = 
  | 'MOTOR_DIESEL_POWERTRAIN'
  | 'SISTEMA_HIDRAULICO'
  | 'TREN_RODAJE_SUSPENSION'
  | 'SISTEMA_ELECTRICO_CONTROL'
  | 'ESTRUCTURA_CHASIS_TOLVA';

export interface SubsystemHealth {
  id: SubsystemType;
  name: string;
  healthScore: number; // 0 - 100
  status: 'OPTIMO' | 'ADVERTENCIA' | 'CRITICO';
  temperature: number; // °C
  pressure?: number; // bar
  vibration: number; // mm/s RMS
  wearLevel: number; // 0 - 100%
  rulHours: number; // Estimated hours remaining
  anomalyDetected: boolean;
  anomalyScore: number; // 0 - 1
  primaryMetricName: string;
  primaryMetricValue: string;
  sensors: {
    name: string;
    value: number;
    unit: string;
    nominalMin: number;
    nominalMax: number;
    currentStatus: 'NORMAL' | 'ALTO' | 'CRITICO';
  }[];
}

export interface EquipmentTelemetry {
  timestamp: string;
  engineRpm: number;
  engineTemp: number; // °C
  coolantTemp: number; // °C
  oilPressure: number; // PSI
  hydraulicPressure: number; // bar
  hydraulicTemp: number; // °C
  vibrationRms: number; // mm/s
  vibrationPeak: number; // mm/s
  fuelRate: number; // L/h
  fuelEfficiency: number; // Ton/L
  payloadTons: number; // Tons
  payloadNominal: number; // Tons
  cycleCount: number;
  engineLoadPct: number; // %
  brakeTemp: number; // °C
  batteryVoltage: number; // V
  transmissionOilTemp: number; // °C
  ambientTemp: number; // °C
  altitudeMeters: number;
  inclineGradePct: number; // %
  dustIndexPpm: number;
  isoOilContamination: string; // e.g. "18/16/13"
}

export interface Equipment {
  id: string;
  code: string; // e.g., "CA-797-04"
  name: string; // e.g., "Caterpillar 797F #04"
  type: EquipmentType;
  model: string;
  manufacturer: string;
  year: number;
  totalOperatingHours: number;
  status: OperationalStatus;
  healthScore: number; // 0 - 100
  rulHours: number; // Overall RUL
  rulConfidence: number; // 0 - 100%
  availabilityPct: number;
  utilizationPct: number;
  mtbfHours: number;
  mttrHours: number;
  gps: {
    lat: number;
    lng: number;
    altitude: number;
    zoneName: string; // e.g., "Frente de Carguío Banco 3420", "Chancadora Primaria", "Taller Central"
    speedKmh: number;
    headingDeg: number;
  };
  subsystems: Record<SubsystemType, SubsystemHealth>;
  telemetry: EquipmentTelemetry;
  activeAlertCount: number;
  openWorkOrderCount: number;
  assignedOperator: string;
  currentShift: 'GUARDIA_DIA' | 'GUARDIA_NOCHE';
  lastServiceDate: string;
  nextScheduledPmDate: string;
  hourlyDowntimeCostUsd: number; // e.g. $125,000 for CAT 797F
}

export type AlertSeverity = 'INFORMATIVA' | 'ADVERTENCIA' | 'CRITICA' | 'EMERGENCIA';

export interface AlertNotification {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  subsystem: SubsystemType;
  severity: AlertSeverity;
  title: string;
  description: string;
  detectedAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  iso14224Code: string; // e.g., "HYD-CAV-02"
  telemetryTrigger: {
    sensor: string;
    observedValue: string;
    threshold: string;
  };
  prescriptiveAction: string;
  associatedWorkOrderId?: string;
}

export type WorkOrderType = 'PREVENTIVO' | 'PREDICTIVO' | 'PRESCRIPTIVO' | 'CORRECTIVO';
export type WorkOrderStatus = 'CREADA' | 'PLANIFICADA' | 'EN_EJECUCION' | 'EN_REVISION' | 'COMPLETADA' | 'CANCELADA';
export type PriorityLevel = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA_URGENTE';

export interface SparePartItem {
  id: string;
  partNumber: string;
  description: string;
  oem: string;
  category: string;
  unitCostUsd: number;
  stockAvailable: number;
  stockReserved: number;
  leadTimeDays: number;
  warehouseLocation: string;
}

export interface WorkOrder {
  id: string;
  code: string; // e.g., "OT-2026-0842"
  equipmentId: string;
  equipmentCode: string;
  subsystem: SubsystemType;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: PriorityLevel;
  title: string;
  description: string;
  iso14224Mechanism: string; // e.g., "Cavitación de Bomba Principal por Sobretemperatura"
  iso14224FailureMode: string; // e.g., "Pérdida de Presión Hidráulica / Fuga Interna"
  createdAt: string;
  scheduledStartDate: string;
  estimatedDurationHours: number;
  actualDurationHours?: number;
  assignedLeadTech: string;
  techniciansTeam: string[];
  requiredParts: {
    partId: string;
    partNumber: string;
    description: string;
    quantity: number;
    unitCostUsd: number;
  }[];
  totalEstimatedCostUsd: number;
  triggerSource: 'ALERTA_GEMELO_DIGITAL' | 'RUL_THRESHOLD_CRITICAL' | 'PROGRAMA_MANTENIMIENTO' | 'INSPECCION_OPERADOR';
  prescriptiveRecommendations: string[];
  safetyChecklist: {
    task: string;
    completed: boolean;
  }[];
  notes?: string;
}

export interface MiningFleetKPIs {
  fleetHealthAvg: number;
  physicalAvailabilityPct: number;
  effectiveUtilizationPct: number;
  meanTimeBetweenFailuresHours: number;
  meanTimeToRepairHours: number;
  totalOperatingHoursToday: number;
  totalTonnageMovedToday: number;
  avoidedDowntimeCostUsd: number;
  openCriticalAlertsCount: number;
  pendingWorkOrdersCount: number;
  equipmentCountByStatus: {
    operativo: number;
    enMantenimiento: number;
    fueraDeServicio: number;
    standBy: number;
  };
}

export interface DegradationPoint {
  operatingHours: number;
  actualHealth: number;
  predictedHealth: number;
  upperConfidence: number;
  lowerConfidence: number;
  isHistorical: boolean;
}

export interface AnomalyCorrelation {
  sensorPair: string;
  correlationCoefficient: number;
  anomalyResidual: number;
  status: 'NORMAL' | 'ANOMALO';
}

export interface WhatIfSimulationInput {
  inclineGradePct: number; // 0 - 15%
  payloadOverloadPct: number; // -20% to +30%
  ambientTempC: number; // -5 to 45°C
  dustIndexMultiplier: number; // 0.5x to 3.0x
  shiftLengthHours: number;
}

export interface WhatIfSimulationResult {
  simulatedHealthScore: number;
  healthScoreDelta: number;
  simulatedRulHours: number;
  rulHoursDelta: number;
  estimatedTimeToCriticalThresholdHours: number;
  subsystemImpacts: {
    subsystem: SubsystemType;
    healthImpactPct: number;
    temperatureIncreaseC: number;
    wearAccelerationFactor: number;
  }[];
  riskLevel: 'BAJO' | 'MODERADO' | 'ELEVADO' | 'CRITICO';
  prescriptiveMitigations: string[];
}
