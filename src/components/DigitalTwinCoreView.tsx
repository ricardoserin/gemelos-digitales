import React, { useState, useMemo } from 'react';
import { Equipment, SubsystemType, SubsystemHealth, WhatIfSimulationInput } from '../types';
import { EquipmentSchematic } from './EquipmentSchematic';
import { 
  calculateDynamicHealthScore, 
  generateDegradationForecast, 
  evaluateAnomalyMatrix, 
  runWhatIfSimulation 
} from '../utils/digitalTwinEngine';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  ComposedChart, 
  ReferenceLine 
} from 'recharts';
import { 
  Cpu, 
  Activity, 
  Sliders, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Wrench, 
  Sparkles, 
  Flame, 
  Zap, 
  RefreshCw,
  TrendingDown,
  Info
} from 'lucide-react';

interface DigitalTwinCoreViewProps {
  equipment: Equipment;
  equipmentList: Equipment[];
  onSelectEquipment: (equipment: Equipment) => void;
  selectedSubsystem: SubsystemType;
  onSelectSubsystem: (subsystem: SubsystemType) => void;
  onCreateWorkOrderFromTwin: (equipment: Equipment, subsystem: SubsystemType, reason: string) => void;
  onOpenAiDiagnostic: () => void;
}

export const DigitalTwinCoreView: React.FC<DigitalTwinCoreViewProps> = ({
  equipment,
  equipmentList,
  onSelectEquipment,
  selectedSubsystem,
  onSelectSubsystem,
  onCreateWorkOrderFromTwin,
  onOpenAiDiagnostic
}) => {
  // What-If Simulation State
  const [simulationInput, setSimulationInput] = useState<WhatIfSimulationInput>({
    inclineGradePct: equipment.telemetry.inclineGradePct || 10.2,
    payloadOverloadPct: 5,
    ambientTempC: equipment.telemetry.ambientTemp || 24,
    dustIndexMultiplier: 1.2,
    shiftLengthHours: 12
  });

  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'RUL' | 'ANOMALIES' | 'WHAT_IF' | 'FORMULA'>('RUL');

  // Mathematical Health Score Calculation
  const healthCalculation = useMemo(() => {
    return calculateDynamicHealthScore(equipment);
  }, [equipment]);

  // Degradation Forecast Data
  const degradationData = useMemo(() => {
    return generateDegradationForecast(
      equipment.totalOperatingHours,
      equipment.healthScore,
      equipment.rulHours
    );
  }, [equipment.totalOperatingHours, equipment.healthScore, equipment.rulHours]);

  // Anomaly Matrix Evaluation
  const anomalyMatrix = useMemo(() => {
    return evaluateAnomalyMatrix(equipment);
  }, [equipment]);

  // What-If Simulation Result
  const simulationResult = useMemo(() => {
    return runWhatIfSimulation(equipment, simulationInput);
  }, [equipment, simulationInput]);

  return (
    <div id="digital-twin-core-view" className="space-y-4">
      {/* Top Equipment Switcher & Twin Header */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-white border border-blue-400/30 uppercase">
                ACTIVE TWIN NODE
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">{equipment.name}</h2>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Real-Time Physics-Digital Twin • Dynamic Health Engine & Weibull/LSTM RUL Prognosis
            </p>
          </div>
        </div>

        {/* Quick Equipment Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-slate-400 uppercase">SELECT UNIT:</label>
          <select
            id="select-twin-equipment"
            value={equipment.id}
            onChange={(e) => {
              const selected = equipmentList.find((eq) => eq.id === e.target.value);
              if (selected) onSelectEquipment(selected);
            }}
            className="px-3 py-1.5 text-xs font-mono bg-[#0F172A] border border-slate-700 rounded text-slate-100 font-medium focus:outline-none focus:border-blue-500"
          >
            {equipmentList.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.code} — {eq.name} ({eq.healthScore}% Health)
              </option>
            ))}
          </select>

          <button
            id="btn-gemini-ai-diagnose-twin"
            onClick={onOpenAiDiagnostic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-sm transition-colors cursor-pointer border border-blue-500"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI DIAGNOSTIC</span>
          </button>
        </div>
      </div>

      {/* 2.5D Subsystem Interactive Schematic */}
      <EquipmentSchematic
        equipment={equipment}
        selectedSubsystem={selectedSubsystem}
        onSelectSubsystem={onSelectSubsystem}
      />

      {/* Analytics Tabs: RUL Forecast / Anomaly Detection / What-If Simulator / Math Formula */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden shadow-md">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700 bg-[#0F172A] overflow-x-auto">
          <button
            id="tab-rul-prognosis"
            onClick={() => setActiveAnalysisTab('RUL')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeAnalysisTab === 'RUL'
                ? 'border-blue-400 text-white bg-[#1E293B]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>RUL Prognosis & Degradation (Weibull/LSTM)</span>
          </button>

          <button
            id="tab-anomaly-detection"
            onClick={() => setActiveAnalysisTab('ANOMALIES')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeAnalysisTab === 'ANOMALIES'
                ? 'border-blue-400 text-white bg-[#1E293B]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Anomaly Detection (Isolation Forest)</span>
            {anomalyMatrix.anomalyDetected && (
              <span className="px-1.5 py-0.2 text-[9px] bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded font-mono font-bold">
                ANOMALY
              </span>
            )}
          </button>

          <button
            id="tab-what-if-simulator"
            onClick={() => setActiveAnalysisTab('WHAT_IF')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeAnalysisTab === 'WHAT_IF'
                ? 'border-blue-400 text-white bg-[#1E293B]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>"What-If" Operational Sandbox</span>
          </button>

          <button
            id="tab-health-formula"
            onClick={() => setActiveAnalysisTab('FORMULA')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeAnalysisTab === 'FORMULA'
                ? 'border-blue-400 text-white bg-[#1E293B]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Health Score Engine Formula</span>
          </button>
        </div>

        {/* Tab 1: RUL Degradation Forecast Chart */}
        {activeAnalysisTab === 'RUL' && (
          <div id="rul-prognosis-panel" className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Curva de Degradación y Remaining Useful Life (RUL)
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Proyección estimada con intervalo de confianza 95% basada en tasa de desgaste y severidad operacional
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#0F172A] border border-slate-700 px-3 py-1.5 rounded text-xs font-mono">
                  <span className="text-slate-400">RUL Global: </span>
                  <span className={`font-bold ${equipment.rulHours < 200 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {equipment.rulHours}h ({equipment.rulConfidence}% Conf.)
                  </span>
                </div>
                {equipment.rulHours < 200 && (
                  <button
                    id="btn-create-ot-low-rul"
                    onClick={() =>
                      onCreateWorkOrderFromTwin(
                        equipment,
                        selectedSubsystem,
                        `RUL Crítico (${equipment.rulHours}h) detectado en ${equipment.subsystems[selectedSubsystem].name}`
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-mono font-bold transition-colors cursor-pointer border border-rose-500"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>GENERAR OT PRESCRIPTIVA</span>
                  </button>
                )}
              </div>
            </div>

            {/* Recharts Degradation Graph */}
            <div className="h-[280px] w-full bg-[#0F172A] rounded-lg p-3 border border-slate-700/80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={degradationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="operatingHours" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    fontFamily="monospace"
                    tickFormatter={(val) => `${val.toLocaleString()}h`} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    fontFamily="monospace"
                    domain={[20, 100]} 
                    tickFormatter={(val) => `${val}%`} 
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}
                    labelFormatter={(label) => `Horómetro: ${label.toLocaleString()} hrs`}
                    formatter={(value: any, name: string) => {
                      if (name === 'actualHealth') return [`${value}%`, 'Salud Real Histórica'];
                      if (name === 'predictedHealth') return [`${value}%`, 'Salud Predicha (RUL)'];
                      if (name === 'upperConfidence') return [`${value}%`, 'Banda Superior 95%'];
                      if (name === 'lowerConfidence') return [`${value}%`, 'Banda Inferior 95%'];
                      return [value, name];
                    }}
                  />
                  <ReferenceLine y={50} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Umbral Crítico (50%)', fill: '#f43f5e', fontSize: 10, position: 'top' }} />
                  <ReferenceLine x={equipment.totalOperatingHours} stroke="#3b82f6" strokeWidth={2} label={{ value: 'Hoy', fill: '#60a5fa', fontSize: 10, position: 'top' }} />
                  
                  {/* Confidence Interval Area */}
                  <Area type="monotone" dataKey="upperConfidence" stroke="transparent" fill="#3b82f6" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="lowerConfidence" stroke="transparent" fill="#0f172a" fillOpacity={1} />
                  
                  {/* Historical vs Predicted Lines */}
                  <Line type="monotone" dataKey="actualHealth" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                  <Line type="monotone" dataKey="predictedHealth" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* RUL Subsystem Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(Object.values(equipment.subsystems) as SubsystemHealth[]).map((sub) => (
                <div 
                  key={sub.id}
                  onClick={() => onSelectSubsystem(sub.id)}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedSubsystem === sub.id ? 'border-blue-400 bg-blue-500/20' : 'border-slate-700 bg-[#0F172A] hover:border-slate-500'
                  }`}
                >
                  <span className="text-[11px] font-mono text-slate-400 line-clamp-1">{sub.name}</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-base font-mono font-bold ${sub.rulHours < 200 ? 'text-rose-400' : 'text-slate-100'}`}>
                      {sub.rulHours}h
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Desgaste: {sub.wearLevel}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Anomaly Detection Panel */}
        {activeAnalysisTab === 'ANOMALIES' && (
          <div id="anomaly-detection-panel" className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Detección No Supervisada de Anomalías Multivariables (Isolation Forest)
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Análisis de residuos espectrales y correlación cruzada de sensores para detección de fallas incipientes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">ANOMALY SCORE:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  anomalyMatrix.overallAnomalyScore > 0.6 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {anomalyMatrix.overallAnomalyScore} / 1.00
                </span>
              </div>
            </div>

            {/* Diagnostic Message Box */}
            <div className={`p-3.5 rounded border flex items-start gap-3 ${
              anomalyMatrix.anomalyDetected ? 'bg-rose-500/10 border-rose-500/50 text-rose-200' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200'
            }`}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-mono font-bold uppercase mb-1">
                  {anomalyMatrix.anomalyDetected ? '⚠️ Anomalía Mecánica Confirmada por el Gemelo Digital' : '✅ Patrón de Telemetría Dentro de Parámetros Normales'}
                </strong>
                <p className="text-xs leading-relaxed opacity-90">{anomalyMatrix.rootCauseDescription}</p>
              </div>
            </div>

            {/* Sensor Pair Correlation Matrix */}
            <div className="space-y-2">
              <h5 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                Matriz de Correlación Cruzada & Residuos Anómalos
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {anomalyMatrix.correlations.map((corr, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded border flex flex-col justify-between ${
                      corr.status === 'ANOMALO' ? 'bg-rose-500/10 border-rose-500/40' : 'bg-[#0F172A] border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold text-slate-200">{corr.sensorPair}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        corr.status === 'ANOMALO' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-emerald-400'
                      }`}>
                        {corr.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-700/60">
                      <span>Coef. Pearson: <strong className="text-slate-200">{corr.correlationCoefficient}</strong></span>
                      <span>Residuo: <strong className={corr.status === 'ANOMALO' ? 'text-rose-400 font-bold' : 'text-slate-200'}>{corr.anomalyResidual}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: What-If Operational Sandbox */}
        {activeAnalysisTab === 'WHAT_IF' && (
          <div id="what-if-sandbox-panel" className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  Simulador de Estrés Operacional "What-If"
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Evalúa el impacto inmediato de cambios en pendiente de rampa, sobrecarga y clima sobre la vida útil remanente (RUL)
                </p>
              </div>
              <button
                id="btn-reset-what-if"
                onClick={() =>
                  setSimulationInput({
                    inclineGradePct: equipment.telemetry.inclineGradePct || 10.2,
                    payloadOverloadPct: 5,
                    ambientTempC: equipment.telemetry.ambientTemp || 24,
                    dustIndexMultiplier: 1.2,
                    shiftLengthHours: 12
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-slate-300 rounded text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RESTABLECER CONDICIONES</span>
              </button>
            </div>

            {/* Slider Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-[#0F172A] rounded-lg border border-slate-700">
              {/* Slider 1: Incline Grade */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">PENDIENTE RAMPA:</span>
                  <span className="font-bold text-amber-400">{simulationInput.inclineGradePct}%</span>
                </div>
                <input
                  id="slider-incline-grade"
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={simulationInput.inclineGradePct}
                  onChange={(e) => setSimulationInput({ ...simulationInput, inclineGradePct: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (Plano)</span>
                  <span>15% (Extremo)</span>
                </div>
              </div>

              {/* Slider 2: Payload Overload */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">SOBRECARGA:</span>
                  <span className="font-bold text-amber-400">+{simulationInput.payloadOverloadPct}%</span>
                </div>
                <input
                  id="slider-payload-overload"
                  type="range"
                  min="-15"
                  max="25"
                  step="1"
                  value={simulationInput.payloadOverloadPct}
                  onChange={(e) => setSimulationInput({ ...simulationInput, payloadOverloadPct: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-15% (Subcarga)</span>
                  <span>+25% (490T)</span>
                </div>
              </div>

              {/* Slider 3: Ambient Temp */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">TEMP AMBIENTE:</span>
                  <span className="font-bold text-amber-400">{simulationInput.ambientTempC}°C</span>
                </div>
                <input
                  id="slider-ambient-temp"
                  type="range"
                  min="-5"
                  max="45"
                  step="1"
                  value={simulationInput.ambientTempC}
                  onChange={(e) => setSimulationInput({ ...simulationInput, ambientTempC: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-5°C (Invierno)</span>
                  <span>45°C (Calor)</span>
                </div>
              </div>

              {/* Slider 4: Dust Multiplier */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">SEVERIDAD POLVO:</span>
                  <span className="font-bold text-amber-400">{simulationInput.dustIndexMultiplier}x</span>
                </div>
                <input
                  id="slider-dust-multiplier"
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={simulationInput.dustIndexMultiplier}
                  onChange={(e) => setSimulationInput({ ...simulationInput, dustIndexMultiplier: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.5x (Regado)</span>
                  <span>3.0x (Crítico)</span>
                </div>
              </div>
            </div>

            {/* Simulation Results Output Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
              <div className="p-3.5 rounded bg-[#0F172A] border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase block">SIMULATED HEALTH SCORE</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-white">{simulationResult.simulatedHealthScore}%</span>
                  <span className={`text-xs font-semibold ${simulationResult.healthScoreDelta <= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {simulationResult.healthScoreDelta > 0 ? `+${simulationResult.healthScoreDelta}` : simulationResult.healthScoreDelta}%
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded bg-[#0F172A] border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase block">SIMULATED RUL PROJECTION</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-amber-400">{simulationResult.simulatedRulHours}h</span>
                  <span className="text-xs text-rose-400 font-semibold">
                    {simulationResult.rulHoursDelta} hrs
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded bg-[#0F172A] border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase block">TIME TO CRITICAL THRESHOLD</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-rose-400">
                    {simulationResult.estimatedTimeToCriticalThresholdHours}h
                  </span>
                  <span className="text-[10px] text-slate-500">(Health &lt; 50%)</span>
                </div>
              </div>

              <div className="p-3.5 rounded bg-[#0F172A] border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase block">OPERATIONAL RISK LEVEL</span>
                <div className="mt-1.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                    simulationResult.riskLevel === 'CRITICO' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : simulationResult.riskLevel === 'ELEVADO' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    RISK {simulationResult.riskLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Prescriptive Operational Mitigations */}
            <div className="p-3.5 rounded bg-[#0F172A] border border-slate-700">
              <h5 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Medidas Operacionales Prescriptivas para Mitigar Desgaste
              </h5>
              <ul className="space-y-1 text-xs text-slate-300 font-mono">
                {simulationResult.prescriptiveMitigations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 4: Mathematical Formula of Health Score */}
        {activeAnalysisTab === 'FORMULA' && (
          <div id="math-formula-panel" className="p-4 sm:p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Formulación Matemática del Health Score Dinámico
            </h4>
            
            <div className="p-4 rounded bg-[#0F172A] border border-slate-700 font-mono text-xs text-slate-300 space-y-3">
              <div className="text-amber-400 font-bold text-xs bg-slate-900/60 p-2.5 rounded border border-slate-800">
                HealthScore = ∑ (w_i · Subsystem_i) - Δ_Ambiental(Altitud, Temp, Pendiente, Polvo)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400 pt-2 border-t border-slate-700/60">
                <div>
                  <strong className="text-slate-200 block mb-1 text-xs uppercase">Ponderaciones por Criticidad FMEA:</strong>
                  <div>• Motor Diésel & Powertrain (w₁ = 0.30)</div>
                  <div>• Sistema Hidráulico & Levante (w₂ = 0.30)</div>
                  <div>• Tren de Rodaje & Suspensión (w₃ = 0.15)</div>
                  <div>• Eléctrico & Control Inverter (w₄ = 0.15)</div>
                  <div>• Chasis Estructural & Tolva (w₅ = 0.10)</div>
                </div>
                <div>
                  <strong className="text-slate-200 block mb-1 text-xs uppercase">Factores de Penalización Dinámicos:</strong>
                  <div>• Altitud &gt; 3,000 msnm: Derate térmico de turbo</div>
                  <div>• Pendiente &gt; 7.0%: Fatiga de convertidor y frenos</div>
                  <div>• Temperatura &gt; 30°C: Saturación de enfriadores</div>
                  <div>• Penalización Ambiental Actual: <span className="text-rose-400 font-bold">-{healthCalculation.environmentalPenaltyPct}%</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
