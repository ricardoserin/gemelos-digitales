import React from 'react';
import { SubsystemType, Equipment } from '../types';
import { Activity, Flame, ShieldAlert, Cpu, Wrench } from 'lucide-react';

interface EquipmentSchematicProps {
  equipment: Equipment;
  selectedSubsystem: SubsystemType;
  onSelectSubsystem: (subsystem: SubsystemType) => void;
}

export const EquipmentSchematic: React.FC<EquipmentSchematicProps> = ({
  equipment,
  selectedSubsystem,
  onSelectSubsystem
}) => {
  const subsystems = equipment.subsystems;

  const getStatusColor = (health: number, isSelected: boolean) => {
    if (isSelected) return 'ring-1 ring-blue-400 bg-blue-500/20 border-blue-400 text-white';
    if (health >= 85) return 'bg-[#0F172A] border-slate-700/80 text-emerald-300 hover:border-slate-500';
    if (health >= 70) return 'bg-[#0F172A] border-amber-500/40 text-amber-300 hover:border-amber-400';
    return 'bg-[#0F172A] border-rose-500/60 text-rose-300 animate-pulse hover:border-rose-400';
  };

  const getBadgeColor = (health: number) => {
    if (health >= 85) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (health >= 70) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    return 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold';
  };

  return (
    <div id="equipment-schematic-container" className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 sm:p-5 shadow-md relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-blue-400 font-bold text-xs uppercase">UNIT ID:</span>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-blue-500/20 text-white rounded border border-blue-400/40">
              {equipment.code}
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">{equipment.name}</h3>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Subsystem Heatmap [Layer 0] • Model {equipment.model}
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#0F172A] px-3 py-1.5 rounded border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase">HOURS:</span>
            <span className="font-mono font-bold text-slate-100">{equipment.totalOperatingHours.toLocaleString()}h</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#0F172A] px-3 py-1.5 rounded border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase">HEALTH:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${getBadgeColor(equipment.healthScore)}`}>
              {equipment.healthScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Visual Subsystem Representation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {/* 1. MOTOR DIESEL */}
        <button
          id="btn-subsystem-motor"
          onClick={() => onSelectSubsystem('MOTOR_DIESEL_POWERTRAIN')}
          className={`text-left p-3.5 rounded border transition-colors cursor-pointer flex flex-col justify-between relative group ${getStatusColor(
            subsystems.MOTOR_DIESEL_POWERTRAIN.healthScore,
            selectedSubsystem === 'MOTOR_DIESEL_POWERTRAIN'
          )}`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded bg-slate-800 text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${getBadgeColor(subsystems.MOTOR_DIESEL_POWERTRAIN.healthScore)}`}>
                {subsystems.MOTOR_DIESEL_POWERTRAIN.healthScore}%
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 uppercase block">Engine</span>
            <h4 className="text-xs font-bold text-white line-clamp-1">Motor & Powertrain</h4>
            <p className="text-[11px] font-mono text-slate-400 mt-1 line-clamp-1">
              {subsystems.MOTOR_DIESEL_POWERTRAIN.primaryMetricName}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] text-slate-400 uppercase">RUL:</span>
            <span className="text-slate-200 font-semibold">{subsystems.MOTOR_DIESEL_POWERTRAIN.rulHours}h</span>
          </div>
        </button>

        {/* 2. SISTEMA HIDRAULICO */}
        <button
          id="btn-subsystem-hidraulico"
          onClick={() => onSelectSubsystem('SISTEMA_HIDRAULICO')}
          className={`text-left p-3.5 rounded border transition-colors cursor-pointer flex flex-col justify-between relative group ${getStatusColor(
            subsystems.SISTEMA_HIDRAULICO.healthScore,
            selectedSubsystem === 'SISTEMA_HIDRAULICO'
          )}`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded bg-slate-800 text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${getBadgeColor(subsystems.SISTEMA_HIDRAULICO.healthScore)}`}>
                {subsystems.SISTEMA_HIDRAULICO.healthScore}%
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 uppercase block">Hydraulic</span>
            <h4 className="text-xs font-bold text-white line-clamp-1">Sistema Hidráulico</h4>
            <p className="text-[11px] font-mono text-slate-400 mt-1 line-clamp-1">
              {subsystems.SISTEMA_HIDRAULICO.primaryMetricName}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] text-slate-400 uppercase">RUL:</span>
            <span className={`font-semibold ${subsystems.SISTEMA_HIDRAULICO.rulHours < 200 ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
              {subsystems.SISTEMA_HIDRAULICO.rulHours}h
            </span>
          </div>
        </button>

        {/* 3. TREN DE RODAJE */}
        <button
          id="btn-subsystem-rodaje"
          onClick={() => onSelectSubsystem('TREN_RODAJE_SUSPENSION')}
          className={`text-left p-3.5 rounded border transition-colors cursor-pointer flex flex-col justify-between relative group ${getStatusColor(
            subsystems.TREN_RODAJE_SUSPENSION.healthScore,
            selectedSubsystem === 'TREN_RODAJE_SUSPENSION'
          )}`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded bg-slate-800 text-orange-400">
                <Wrench className="w-4 h-4" />
              </div>
              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${getBadgeColor(subsystems.TREN_RODAJE_SUSPENSION.healthScore)}`}>
                {subsystems.TREN_RODAJE_SUSPENSION.healthScore}%
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 uppercase block">Chassis L/R</span>
            <h4 className="text-xs font-bold text-white line-clamp-1">Tren Rodaje & Suspensión</h4>
            <p className="text-[11px] font-mono text-slate-400 mt-1 line-clamp-1">
              {subsystems.TREN_RODAJE_SUSPENSION.primaryMetricName}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] text-slate-400 uppercase">RUL:</span>
            <span className="text-slate-200 font-semibold">{subsystems.TREN_RODAJE_SUSPENSION.rulHours}h</span>
          </div>
        </button>

        {/* 4. SISTEMA ELECTRICO & CONTROL */}
        <button
          id="btn-subsystem-electrico"
          onClick={() => onSelectSubsystem('SISTEMA_ELECTRICO_CONTROL')}
          className={`text-left p-3.5 rounded border transition-colors cursor-pointer flex flex-col justify-between relative group ${getStatusColor(
            subsystems.SISTEMA_ELECTRICO_CONTROL.healthScore,
            selectedSubsystem === 'SISTEMA_ELECTRICO_CONTROL'
          )}`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded bg-slate-800 text-blue-400">
                <Cpu className="w-4 h-4" />
              </div>
              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${getBadgeColor(subsystems.SISTEMA_ELECTRICO_CONTROL.healthScore)}`}>
                {subsystems.SISTEMA_ELECTRICO_CONTROL.healthScore}%
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 uppercase block">ECM & Telemetry</span>
            <h4 className="text-xs font-bold text-white line-clamp-1">Eléctrico & Control</h4>
            <p className="text-[11px] font-mono text-slate-400 mt-1 line-clamp-1">
              {subsystems.SISTEMA_ELECTRICO_CONTROL.primaryMetricName}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] text-slate-400 uppercase">RUL:</span>
            <span className="text-slate-200 font-semibold">{subsystems.SISTEMA_ELECTRICO_CONTROL.rulHours}h</span>
          </div>
        </button>

        {/* 5. CHASIS & TOLVA */}
        <button
          id="btn-subsystem-chasis"
          onClick={() => onSelectSubsystem('ESTRUCTURA_CHASIS_TOLVA')}
          className={`text-left p-3.5 rounded border transition-colors cursor-pointer flex flex-col justify-between relative group ${getStatusColor(
            subsystems.ESTRUCTURA_CHASIS_TOLVA.healthScore,
            selectedSubsystem === 'ESTRUCTURA_CHASIS_TOLVA'
          )}`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded bg-slate-800 text-emerald-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${getBadgeColor(subsystems.ESTRUCTURA_CHASIS_TOLVA.healthScore)}`}>
                {subsystems.ESTRUCTURA_CHASIS_TOLVA.healthScore}%
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 uppercase block">Structure</span>
            <h4 className="text-xs font-bold text-white line-clamp-1">Estructura & Tolva</h4>
            <p className="text-[11px] font-mono text-slate-400 mt-1 line-clamp-1">
              {subsystems.ESTRUCTURA_CHASIS_TOLVA.primaryMetricName}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] text-slate-400 uppercase">RUL:</span>
            <span className="text-slate-200 font-semibold">{subsystems.ESTRUCTURA_CHASIS_TOLVA.rulHours}h</span>
          </div>
        </button>
      </div>

      {/* Detailed Selected Subsystem Inspector / Sensor Mesh */}
      {subsystems[selectedSubsystem] && (
        <div id="selected-subsystem-drilldown" className="bg-[#0F172A] border border-slate-700 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Sensor Mesh (IoT) — {subsystems[selectedSubsystem].name}
              </h4>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-400">
                STATUS: <span className="font-semibold text-white uppercase">{subsystems[selectedSubsystem].status}</span>
              </span>
              <span className="text-slate-400">
                WEAR LEVEL: <span className="font-semibold text-amber-400">{subsystems[selectedSubsystem].wearLevel}%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {subsystems[selectedSubsystem].sensors.map((sensor, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border flex flex-col justify-between font-mono ${
                  sensor.currentStatus === 'CRITICO'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                    : sensor.currentStatus === 'ALTO'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-[#1E293B] border-slate-700/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 uppercase truncate max-w-[140px]" title={sensor.name}>{sensor.name}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    sensor.currentStatus === 'CRITICO'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : sensor.currentStatus === 'ALTO'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {sensor.currentStatus}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between font-mono">
                  <span className="text-lg font-bold text-white">
                    {sensor.value} <span className="text-xs font-normal text-slate-400">{sensor.unit}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    NOM: {sensor.nominalMin}-{sensor.nominalMax}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
