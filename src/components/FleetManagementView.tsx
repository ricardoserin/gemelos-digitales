import React, { useState } from 'react';
import { Equipment, EquipmentType, OperationalStatus } from '../types';
import { MINE_LOCATIONS } from '../data/miningData';
import { 
  Truck, 
  MapPin, 
  Filter, 
  Search, 
  Gauge, 
  Layers, 
  Navigation,
  Compass,
  ArrowUpRight
} from 'lucide-react';

interface FleetManagementViewProps {
  equipmentList: Equipment[];
  selectedEquipment: Equipment;
  onSelectEquipment: (equipment: Equipment) => void;
  onNavigateToDigitalTwin: (equipment: Equipment) => void;
}

export const FleetManagementView: React.FC<FleetManagementViewProps> = ({
  equipmentList,
  selectedEquipment,
  onSelectEquipment,
  onNavigateToDigitalTwin
}) => {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMapLocation, setSelectedMapLocation] = useState<string | null>(null);

  const filteredEquipment = equipmentList.filter((eq) => {
    if (typeFilter !== 'ALL' && eq.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && eq.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        eq.name.toLowerCase().includes(q) ||
        eq.code.toLowerCase().includes(q) ||
        eq.model.toLowerCase().includes(q) ||
        eq.gps.zoneName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: OperationalStatus) => {
    switch (status) {
      case 'OPERATIVO':
        return <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-mono font-bold uppercase">STATUS: OPERATIONAL</span>;
      case 'EN_MANTENIMIENTO':
        return <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded border border-amber-500/20 font-mono font-bold uppercase">STATUS: MAINTENANCE</span>;
      case 'FUERA_DE_SERVICIO':
        return <span className="bg-rose-500/10 text-rose-400 text-[10px] px-2 py-0.5 rounded border border-rose-500/20 font-mono font-bold uppercase">STATUS: OUT OF SERVICE</span>;
      case 'STAND_BY':
        return <span className="bg-slate-700/50 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-600 font-mono uppercase">STATUS: STANDBY</span>;
    }
  };

  const getHealthBadgeClass = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
  };

  return (
    <div id="fleet-management-view" className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-equipment"
              type="text"
              placeholder="Buscar por código (ej: CA-797-04), modelo, ubicación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="ALL">TODOS LOS TIPOS</option>
              <option value="CAMION_EXTRACCION">CAMIONES DE EXTRACCIÓN</option>
              <option value="PALA_ELECTRICA">PALAS ELÉCTRICAS</option>
              <option value="PALA_HIDRAULICA">PALAS HIDRÁULICAS</option>
              <option value="CARGADOR_FRONTAL">CARGADORES FRONTALES</option>
            </select>

            <select
              id="select-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="ALL">TODOS LOS ESTADOS</option>
              <option value="OPERATIVO">OPERATIVO</option>
              <option value="EN_MANTENIMIENTO">EN MANTENIMIENTO</option>
              <option value="FUERA_DE_SERVICIO">FUERA DE SERVICIO</option>
              <option value="STAND_BY">STAND-BY</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">FLEET COUNT:</span>
          <span className="text-slate-100 font-bold font-mono">{filteredEquipment.length} / {equipmentList.length} UNITS</span>
        </div>
      </div>

      {/* Main Grid: Catalog + Interactive Mine Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Equipment Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" />
              Catálogo de Flota Minera [Carguío & Acarreo]
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Click en tarjeta para telemetría</span>
          </div>

          <div className="space-y-3">
            {filteredEquipment.map((eq) => {
              const isSelected = selectedEquipment.id === eq.id;
              return (
                <div
                  key={eq.id}
                  id={`equipment-card-${eq.code.toLowerCase()}`}
                  onClick={() => onSelectEquipment(eq)}
                  className={`p-4 rounded-lg border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E293B] border-blue-500 shadow-md ring-1 ring-blue-500/40'
                      : 'bg-[#1E293B]/70 border-slate-700/80 hover:border-slate-600 hover:bg-[#1E293B]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded border font-mono font-bold text-xs flex flex-col items-center justify-center min-w-[54px] ${getHealthBadgeClass(eq.healthScore)}`}>
                        <span className="text-sm">{eq.healthScore}%</span>
                        <span className="text-[8px] uppercase tracking-tighter text-slate-400">HEALTH</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-blue-500/20 text-blue-400 rounded border border-blue-400/30">
                            {eq.code}
                          </span>
                          <h4 className="text-sm font-bold text-white tracking-tight">{eq.name}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                          <span>MODEL: <strong className="text-slate-300">{eq.model}</strong></span>
                          <span>•</span>
                          <span>HOURS: <strong className="text-slate-200 font-mono">{eq.totalOperatingHours.toLocaleString()}h</strong></span>
                          <span>•</span>
                          <span>RUL: <strong className={`font-mono ${eq.rulHours < 200 ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>{eq.rulHours}h</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {getStatusBadge(eq.status)}
                      <button
                        id={`btn-open-twin-${eq.code.toLowerCase()}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEquipment(eq);
                          onNavigateToDigitalTwin(eq);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold transition-colors cursor-pointer"
                      >
                        <span>TWIN</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subsystems Mini Status Bar / Data Grid Cell */}
                  <div className="mt-3 pt-3 border-t border-slate-700/80 grid grid-cols-5 gap-2 text-center text-[10px]">
                    <div className="p-1.5 rounded bg-[#0F172A] border border-slate-700/80">
                      <div className="text-slate-400 font-mono uppercase text-[9px]">Motor</div>
                      <div className={`font-mono font-bold ${eq.subsystems.MOTOR_DIESEL_POWERTRAIN.healthScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {eq.subsystems.MOTOR_DIESEL_POWERTRAIN.healthScore}%
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-[#0F172A] border border-slate-700/80">
                      <div className="text-slate-400 font-mono uppercase text-[9px]">Hidráulico</div>
                      <div className={`font-mono font-bold ${eq.subsystems.SISTEMA_HIDRAULICO.healthScore >= 80 ? 'text-emerald-400' : eq.subsystems.SISTEMA_HIDRAULICO.healthScore >= 60 ? 'text-amber-400' : 'text-rose-400 animate-pulse'}`}>
                        {eq.subsystems.SISTEMA_HIDRAULICO.healthScore}%
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-[#0F172A] border border-slate-700/80">
                      <div className="text-slate-400 font-mono uppercase text-[9px]">Rodaje</div>
                      <div className="font-mono font-bold text-slate-200">
                        {eq.subsystems.TREN_RODAJE_SUSPENSION.healthScore}%
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-[#0F172A] border border-slate-700/80">
                      <div className="text-slate-400 font-mono uppercase text-[9px]">Eléctrico</div>
                      <div className="font-mono font-bold text-slate-200">
                        {eq.subsystems.SISTEMA_ELECTRICO_CONTROL.healthScore}%
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-[#0F172A] border border-slate-700/80">
                      <div className="text-slate-400 font-mono uppercase text-[9px]">Estructura</div>
                      <div className="font-mono font-bold text-slate-200">
                        {eq.subsystems.ESTRUCTURA_CHASIS_TOLVA.healthScore}%
                      </div>
                    </div>
                  </div>

                  {/* Location & Operator Footer */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                        LOC: {eq.gps.zoneName}
                      </span>
                    </div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      SPEED: <strong className="text-slate-200">{eq.gps.speedKmh} km/h</strong> • PAYLOAD: <strong className="text-slate-200">{eq.telemetry.payloadTons}T</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Open-Pit Mine GPS Map (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
              <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                Mapa Geoespacial Tajo Abierto (Pit Dispatch)
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                GPS RTK ±2cm
              </span>
            </div>

            {/* Mine Pit Visual Map Canvas Simulator */}
            <div className="relative bg-[#0F172A] border border-slate-800 rounded-lg h-[360px] overflow-hidden p-4 flex flex-col justify-between select-none">
              {/* Pit Bench Contour Topography Lines */}
              <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="50%" cy="50%" rx="45%" ry="40%" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
                <ellipse cx="50%" cy="50%" rx="35%" ry="30%" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
                <ellipse cx="50%" cy="50%" rx="24%" ry="20%" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
                <ellipse cx="50%" cy="50%" rx="14%" ry="10%" fill="none" stroke="#10b981" strokeWidth="2" />
                <path d="M 50 20 Q 200 180 350 320" fill="none" stroke="#eab308" strokeWidth="3" strokeDasharray="6 3" />
              </svg>

              {/* Mine Fixed Landmarks */}
              <div className="relative z-10 space-y-2">
                <div className="flex justify-between items-start">
                  <div 
                    onClick={() => setSelectedMapLocation('chancadora-01')}
                    className="p-1.5 rounded bg-[#1E293B]/90 border border-slate-700 text-[10px] text-slate-200 cursor-pointer hover:border-blue-400 font-mono"
                  >
                    <span className="font-bold text-amber-400">🏭 Chancadora Primaria 01</span>
                    <div className="text-slate-400">Cota: 3,510 msnm</div>
                  </div>

                  <div 
                    onClick={() => setSelectedMapLocation('taller-central')}
                    className="p-1.5 rounded bg-[#1E293B]/90 border border-slate-700 text-[10px] text-slate-200 cursor-pointer hover:border-blue-400 font-mono"
                  >
                    <span className="font-bold text-blue-400">🔧 Taller Central Mina</span>
                    <div className="text-slate-400">4 Bahías Activas</div>
                  </div>
                </div>
              </div>

              {/* Equipment Geo Pins in Pit */}
              <div className="relative z-20 flex items-center justify-around">
                {equipmentList.map((eq) => {
                  const isSelected = selectedEquipment.id === eq.id;
                  return (
                    <button
                      key={eq.id}
                      onClick={() => onSelectEquipment(eq)}
                      className={`group relative flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-110 ${
                        isSelected ? 'scale-110' : ''
                      }`}
                    >
                      <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold shadow-md border ${
                        eq.healthScore < 75 
                          ? 'bg-rose-950 border-rose-500 text-rose-200 animate-bounce' 
                          : eq.status === 'EN_MANTENIMIENTO'
                          ? 'bg-amber-950 border-amber-500 text-amber-200'
                          : 'bg-blue-950 border-blue-500 text-blue-200'
                      }`}>
                        {eq.code}
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border-2 border-slate-900 -mt-1"></div>
                      <div className="text-[9px] font-mono text-slate-400 bg-[#0F172A]/90 px-1 rounded mt-0.5 whitespace-nowrap border border-slate-800">
                        {eq.gps.speedKmh} km/h
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pit Benches Bottom Info */}
              <div className="relative z-10 flex justify-between items-end text-[10px] font-mono">
                <div className="p-1.5 rounded bg-[#1E293B]/90 border border-slate-700 text-slate-200">
                  <span className="font-bold text-emerald-400">⛏️ Frente Fase 5 (Mineral)</span>
                  <div className="text-slate-400">Banco 3420 • P&H 4100XPC</div>
                </div>

                <div className="p-1.5 rounded bg-[#1E293B]/90 border border-slate-700 text-slate-200">
                  <span className="font-bold text-slate-300">⛰️ Botadero Este #03</span>
                  <div className="text-slate-400">Cota: 3,580 msnm</div>
                </div>
              </div>
            </div>

            {/* Selected Equipment Quick Telemetry Panel / Data Grid */}
            <div className="mt-4 p-3 bg-[#0F172A] rounded-lg border border-slate-700/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                  UNIT GPS: {selectedEquipment.code}
                </span>
                <span className="text-[10px] font-mono text-blue-400">
                  LAT: {selectedEquipment.gps.lat.toFixed(4)} • LNG: {selectedEquipment.gps.lng.toFixed(4)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-[#1E293B] p-2 rounded border border-slate-700/60">
                  <span className="text-[9px] text-slate-400 uppercase block font-semibold">VELOCIDAD</span>
                  <span className="font-bold text-white text-sm">{selectedEquipment.gps.speedKmh} km/h</span>
                </div>
                <div className="bg-[#1E293B] p-2 rounded border border-slate-700/60">
                  <span className="text-[9px] text-slate-400 uppercase block font-semibold">CARGA ÚTIL</span>
                  <span className="font-bold text-white text-sm">{selectedEquipment.telemetry.payloadTons} Ton</span>
                </div>
                <div className="bg-[#1E293B] p-2 rounded border border-slate-700/60">
                  <span className="text-[9px] text-slate-400 uppercase block font-semibold">ALTITUD PIT</span>
                  <span className="font-bold text-white text-sm">{selectedEquipment.gps.altitude} msnm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fleet Health Heatmap Matrix */}
          <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-amber-400" />
              Subsystem Heatmap [Fleet Matrix]
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-2">EQUIPMENT</th>
                    <th className="py-2 px-1 text-center">MOTOR</th>
                    <th className="py-2 px-1 text-center">HIDRÁULICO</th>
                    <th className="py-2 px-1 text-center">RODAJE</th>
                    <th className="py-2 px-1 text-center">ELÉCTRICO</th>
                    <th className="py-2 px-1 text-center">ESTRUCTURA</th>
                    <th className="py-2 px-2 text-right">GLOBAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-xs">
                  {equipmentList.map((eq) => (
                    <tr 
                      key={eq.id}
                      onClick={() => onSelectEquipment(eq)}
                      className={`hover:bg-slate-800/80 cursor-pointer ${selectedEquipment.id === eq.id ? 'bg-blue-950/40' : ''}`}
                    >
                      <td className="py-2 px-2 font-bold text-white">{eq.code}</td>
                      <td className="py-2 px-1 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${eq.subsystems.MOTOR_DIESEL_POWERTRAIN.healthScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {eq.subsystems.MOTOR_DIESEL_POWERTRAIN.healthScore}%
                        </span>
                      </td>
                      <td className="py-2 px-1 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${eq.subsystems.SISTEMA_HIDRAULICO.healthScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : eq.subsystems.SISTEMA_HIDRAULICO.healthScore >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-extrabold animate-pulse'}`}>
                          {eq.subsystems.SISTEMA_HIDRAULICO.healthScore}%
                        </span>
                      </td>
                      <td className="py-2 px-1 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-300">
                          {eq.subsystems.TREN_RODAJE_SUSPENSION.healthScore}%
                        </span>
                      </td>
                      <td className="py-2 px-1 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-300">
                          {eq.subsystems.SISTEMA_ELECTRICO_CONTROL.healthScore}%
                        </span>
                      </td>
                      <td className="py-2 px-1 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-300">
                          {eq.subsystems.ESTRUCTURA_CHASIS_TOLVA.healthScore}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <strong className={eq.healthScore >= 80 ? 'text-emerald-400' : eq.healthScore >= 70 ? 'text-amber-400' : 'text-rose-400'}>
                          {eq.healthScore}%
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
