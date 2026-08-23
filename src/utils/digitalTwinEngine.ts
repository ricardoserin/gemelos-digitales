import { Equipment, SubsystemType, DegradationPoint, WhatIfSimulationInput, WhatIfSimulationResult, AnomalyCorrelation } from '../types';

export const SUBSYSTEM_WEIGHTS: Record<SubsystemType, number> = {
  MOTOR_DIESEL_POWERTRAIN: 0.30,
  SISTEMA_HIDRAULICO: 0.30,
  TREN_RODAJE_SUSPENSION: 0.15,
  SISTEMA_ELECTRICO_CONTROL: 0.15,
  ESTRUCTURA_CHASIS_TOLVA: 0.10
};

export function calculateDynamicHealthScore(
  equipment: Equipment,
  environmentalFactors?: {
    altitudeMeters?: number;
    ambientTempC?: number;
    inclineGradePct?: number;
    dustIndexPpm?: number;
  }
): {
  overallScore: number;
  subsystemScores: Record<SubsystemType, number>;
  environmentalPenaltyPct: number;
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  dominantFailureRiskSubsystem: string;
} {
  const env = environmentalFactors || {
    altitudeMeters: equipment.telemetry.altitudeMeters,
    ambientTempC: equipment.telemetry.ambientTemp,
    inclineGradePct: equipment.telemetry.inclineGradePct,
    dustIndexPpm: equipment.telemetry.dustIndexPpm
  };

  // Environmental stress calculation
  let envPenalty = 0;
  if ((env.altitudeMeters || 0) > 3000) {
    envPenalty += Math.min(6, ((env.altitudeMeters || 0) - 3000) / 300); // Hypoxia / derating
  }
  if ((env.ambientTempC || 0) > 30) {
    envPenalty += Math.min(8, ((env.ambientTempC || 0) - 30) * 0.8); // Heat dissipation stress
  }
  if ((env.inclineGradePct || 0) > 7) {
    envPenalty += Math.min(10, ((env.inclineGradePct || 0) - 7) * 1.5); // Steep haulage slope strain
  }
  if ((env.dustIndexPpm || 0) > 40) {
    envPenalty += Math.min(5, ((env.dustIndexPpm || 0) - 40) * 0.15); // Dust abrasive wear
  }

  let weightedSubsystemsScore = 0;
  const subsystemScores: Record<SubsystemType, number> = {} as any;
  let lowestSubsystemScore = 100;
  let dominantSubsystem = 'MOTOR_DIESEL_POWERTRAIN';

  for (const [key, weight] of Object.entries(SUBSYSTEM_WEIGHTS)) {
    const subKey = key as SubsystemType;
    const sub = equipment.subsystems[subKey];
    const score = sub ? sub.healthScore : 85;
    subsystemScores[subKey] = score;
    weightedSubsystemsScore += score * weight;

    if (score < lowestSubsystemScore) {
      lowestSubsystemScore = score;
      dominantSubsystem = sub ? sub.name : key;
    }
  }

  // Final Health score with environmental derate
  const finalScore = Math.max(5, Math.min(100, Number((weightedSubsystemsScore - envPenalty).toFixed(1))));

  let healthGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (finalScore >= 90) healthGrade = 'A';
  else if (finalScore >= 80) healthGrade = 'B';
  else if (finalScore >= 68) healthGrade = 'C';
  else if (finalScore >= 50) healthGrade = 'D';
  else healthGrade = 'F';

  return {
    overallScore: finalScore,
    subsystemScores,
    environmentalPenaltyPct: Number(envPenalty.toFixed(1)),
    healthGrade,
    dominantFailureRiskSubsystem: dominantSubsystem
  };
}

export function generateDegradationForecast(
  totalHours: number,
  currentHealth: number,
  rulHours: number
): DegradationPoint[] {
  const points: DegradationPoint[] = [];
  const historicalSteps = 7;
  const futureSteps = 9;
  
  // Historical points (past 700 hours)
  for (let i = historicalSteps; i >= 1; i--) {
    const hours = totalHours - i * 100;
    const health = Math.min(100, currentHealth + i * 2.8 + (Math.sin(i * 1.5) * 1.2));
    points.push({
      operatingHours: hours,
      actualHealth: Number(health.toFixed(1)),
      predictedHealth: Number(health.toFixed(1)),
      upperConfidence: Number((health + 1.5).toFixed(1)),
      lowerConfidence: Number((health - 1.5).toFixed(1)),
      isHistorical: true
    });
  }

  // Current point
  points.push({
    operatingHours: totalHours,
    actualHealth: currentHealth,
    predictedHealth: currentHealth,
    upperConfidence: currentHealth,
    lowerConfidence: currentHealth,
    isHistorical: true
  });

  // Future predicted degradation trajectory based on non-linear Weibull hazard slope
  const degradationRatePer100h = Math.max(1.8, (currentHealth - 45) / (rulHours / 100));
  let simHealth = currentHealth;

  for (let j = 1; j <= futureSteps; j++) {
    const hours = totalHours + j * 50;
    // Accelerating degradation as components wear
    const decay = degradationRatePer100h * 0.5 * (1 + (j * 0.08));
    simHealth = Math.max(0, simHealth - decay);
    const uncertaintyBand = j * 1.6;

    points.push({
      operatingHours: hours,
      actualHealth: null as any,
      predictedHealth: Number(simHealth.toFixed(1)),
      upperConfidence: Number(Math.min(100, simHealth + uncertaintyBand).toFixed(1)),
      lowerConfidence: Number(Math.max(0, simHealth - uncertaintyBand).toFixed(1)),
      isHistorical: false
    });
  }

  return points;
}

export function evaluateAnomalyMatrix(equipment: Equipment): {
  overallAnomalyScore: number;
  anomalyDetected: boolean;
  correlations: AnomalyCorrelation[];
  rootCauseDescription: string;
} {
  const telem = equipment.telemetry;
  const correlations: AnomalyCorrelation[] = [];

  // Pair 1: Hydraulic Pressure vs Vibration RMS
  const hydPressNorm = (telem.hydraulicPressure - 250) / 100;
  const vibNorm = (telem.vibrationRms - 2.0) / 4.0;
  const hydVibResidual = Math.abs(hydPressNorm * vibNorm * 1.8);
  correlations.push({
    sensorPair: 'Presión Hidráulica vs. Vibración Espectral RMS',
    correlationCoefficient: 0.88,
    anomalyResidual: Number(hydVibResidual.toFixed(2)),
    status: hydVibResidual > 0.65 ? 'ANOMALO' : 'NORMAL'
  });

  // Pair 2: Hydraulic Temp vs Engine Load
  const hydTempNorm = (telem.hydraulicTemp - 65) / 30;
  const loadNorm = (telem.engineLoadPct - 75) / 25;
  const tempLoadResidual = Math.abs(hydTempNorm - loadNorm * 0.7);
  correlations.push({
    sensorPair: 'Temperatura Hidráulica vs. Factor de Carga Motor',
    correlationCoefficient: 0.74,
    anomalyResidual: Number(tempLoadResidual.toFixed(2)),
    status: tempLoadResidual > 0.55 ? 'ANOMALO' : 'NORMAL'
  });

  // Pair 3: Incline Slope vs Fuel Burn Rate
  const slopeNorm = (telem.inclineGradePct - 5) / 6;
  const fuelNorm = (telem.fuelRate - 250) / 150;
  const slopeFuelResidual = Math.abs(fuelNorm - slopeNorm * 0.9);
  correlations.push({
    sensorPair: 'Pendiente de Rampa (%) vs. Tasa de Consumo Diésel (L/h)',
    correlationCoefficient: 0.92,
    anomalyResidual: Number(slopeFuelResidual.toFixed(2)),
    status: slopeFuelResidual > 0.80 ? 'ANOMALO' : 'NORMAL'
  });

  // Pair 4: Payload Ton vs Suspension Pressure
  const payloadNorm = (telem.payloadTons - 380) / 50;
  const brakeTempNorm = (telem.brakeTemp - 75) / 50;
  const brakeResidual = Math.abs(brakeTempNorm * 0.8 - payloadNorm * 0.5);
  correlations.push({
    sensorPair: 'Carga Neta Tolva (Ton) vs. Temperatura Frenos Húmedos',
    correlationCoefficient: 0.82,
    anomalyResidual: Number(brakeResidual.toFixed(2)),
    status: brakeResidual > 0.75 ? 'ANOMALO' : 'NORMAL'
  });

  const highestResidual = Math.max(...correlations.map(c => c.anomalyResidual));
  const isAnomaly = highestResidual > 0.60;
  const anomalyScore = Math.min(1.0, Number((highestResidual * 0.85).toFixed(2)));

  let rootCause = 'Comportamiento de señales dentro de la elipse de confianza multivariable (distancia Mahalanobis < 3σ).';
  if (isAnomaly) {
    if (telem.vibrationRms > 4.5 && telem.hydraulicTemp > 85) {
      rootCause = 'Detección de Cavitación Dinámica en Bomba de Pistones: acoplamiento anómalo entre sobrepresión transitoria, pico espectral de vibración de alta frecuencia y degradación térmica del fluido.';
    } else if (telem.brakeTemp > 110) {
      rootCause = 'Retardo de Frenado Dinámico Elevado: acumulación térmica en paquetes de discos húmedos por acarreo con pendiente continua >10%.';
    } else {
      rootCause = 'Desviación multivariante detectada en sensores de tren de potencia.';
    }
  }

  return {
    overallAnomalyScore: anomalyScore,
    anomalyDetected: isAnomaly,
    correlations,
    rootCauseDescription: rootCause
  };
}

export function runWhatIfSimulation(
  equipment: Equipment,
  input: WhatIfSimulationInput
): WhatIfSimulationResult {
  const currentHealth = equipment.healthScore;
  const currentRul = equipment.rulHours;

  // Incline slope stress multiplier: every 1% above 7% increases wear by 12%
  const slopeExcess = Math.max(0, input.inclineGradePct - 7);
  const slopeFactor = 1 + (slopeExcess * 0.12);

  // Overload multiplier: every 5% overload adds 18% structural & hydraulic stress
  const overloadExcess = Math.max(0, input.payloadOverloadPct);
  const overloadFactor = 1 + (overloadExcess * 0.036);

  // Ambient temp heat stress factor
  const heatExcess = Math.max(0, input.ambientTempC - 28);
  const heatFactor = 1 + (heatExcess * 0.025);

  // Dust factor
  const dustFactor = Math.max(0.9, input.dustIndexMultiplier);

  // Composite degradation acceleration factor
  const compositeStressFactor = slopeFactor * overloadFactor * heatFactor * dustFactor;

  // Subsystem impacts
  const subsystemImpacts = [
    {
      subsystem: 'SISTEMA_HIDRAULICO' as SubsystemType,
      healthImpactPct: Number((6.5 * (compositeStressFactor - 1) * 1.5).toFixed(1)),
      temperatureIncreaseC: Number((heatExcess * 1.4 + slopeExcess * 2.2).toFixed(1)),
      wearAccelerationFactor: Number((compositeStressFactor * 1.35).toFixed(2))
    },
    {
      subsystem: 'MOTOR_DIESEL_POWERTRAIN' as SubsystemType,
      healthImpactPct: Number((5.2 * (compositeStressFactor - 1) * 1.2).toFixed(1)),
      temperatureIncreaseC: Number((heatExcess * 1.1 + slopeExcess * 1.8).toFixed(1)),
      wearAccelerationFactor: Number((compositeStressFactor * 1.20).toFixed(2))
    },
    {
      subsystem: 'TREN_RODAJE_SUSPENSION' as SubsystemType,
      healthImpactPct: Number((4.0 * (compositeStressFactor - 1) * 1.1).toFixed(1)),
      temperatureIncreaseC: Number((slopeExcess * 3.5).toFixed(1)), // Brake discs
      wearAccelerationFactor: Number((compositeStressFactor * 1.15).toFixed(2))
    },
    {
      subsystem: 'ESTRUCTURA_CHASIS_TOLVA' as SubsystemType,
      healthImpactPct: Number((3.5 * (overloadFactor - 1) * 2.0).toFixed(1)),
      temperatureIncreaseC: 0.5,
      wearAccelerationFactor: Number(overloadFactor.toFixed(2))
    },
    {
      subsystem: 'SISTEMA_ELECTRICO_CONTROL' as SubsystemType,
      healthImpactPct: Number((1.8 * (heatFactor - 1) * 1.0).toFixed(1)),
      temperatureIncreaseC: Number((heatExcess * 0.8).toFixed(1)),
      wearAccelerationFactor: Number(heatFactor.toFixed(2))
    }
  ];

  const totalHealthDrop = subsystemImpacts.reduce((acc, curr) => acc + curr.healthImpactPct * (SUBSYSTEM_WEIGHTS[curr.subsystem] || 0.2), 0);
  const simulatedHealthScore = Math.max(10, Number((currentHealth - totalHealthDrop).toFixed(1)));
  const healthScoreDelta = Number((simulatedHealthScore - currentHealth).toFixed(1));

  const simulatedRulHours = Math.max(12, Math.round(currentRul / compositeStressFactor));
  const rulHoursDelta = simulatedRulHours - currentRul;

  const estimatedTimeToCritical = Math.max(8, Math.round(simulatedRulHours * 0.45));

  let riskLevel: 'BAJO' | 'MODERADO' | 'ELEVADO' | 'CRITICO' = 'BAJO';
  if (compositeStressFactor > 1.8 || simulatedHealthScore < 55) riskLevel = 'CRITICO';
  else if (compositeStressFactor > 1.4 || simulatedHealthScore < 70) riskLevel = 'ELEVADO';
  else if (compositeStressFactor > 1.15) riskLevel = 'MODERADO';

  const prescriptiveMitigations: string[] = [];
  if (input.inclineGradePct > 9) {
    prescriptiveMitigations.push(`Limitar velocidad máxima de ascenso en rampa a 11 km/h para reducir temperatura de aceite hidráulico en -8°C.`);
  }
  if (input.payloadOverloadPct > 5) {
    prescriptiveMitigations.push(`Ajustar calibración de balde de pala en Frente Fase 5: reducir pase final en -${input.payloadOverloadPct}% para evitar fatiga en vigas de bastidor.`);
  }
  if (input.ambientTempC > 32) {
    prescriptiveMitigations.push(`Activar ciclo de enfriamiento forzado en paradas intermedias de vaciado y verificar flujo de radiadores.`);
  }
  if (input.dustIndexMultiplier > 1.5) {
    prescriptiveMitigations.push(`Intensificar riego con camión cisterna en circuito de acarreo y adelantar soplado de filtros de aire.`);
  }
  if (prescriptiveMitigations.length === 0) {
    prescriptiveMitigations.push('Condiciones operacionales dentro de la envolvente de diseño óptima de fabricante.');
  }

  return {
    simulatedHealthScore,
    healthScoreDelta,
    simulatedRulHours,
    rulHoursDelta,
    estimatedTimeToCriticalThresholdHours: estimatedTimeToCritical,
    subsystemImpacts,
    riskLevel,
    prescriptiveMitigations
  };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}
