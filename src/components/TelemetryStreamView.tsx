import React, { useState, useEffect } from 'react';
import { Equipment } from '../types';
import { api } from '../api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Activity, 
  Radio, 
  Database, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Terminal,
  Clock
} from 'lucide-react';

interface TelemetryStreamViewProps {
  equipment: Equipment;
  equipmentList: Equipment[];
  onSelectEquipment: (equipment: Equipment) => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
}

interface TelemetryPoint {
  time: string;
  engineTemp: number;
  hydraulicTemp: number;
  hydraulicPressure: number;
  vibrationRms: number;
  fuelRate: number;
  payloadTons: number;
}

export const TelemetryStreamView: React.FC<TelemetryStreamViewProps> = ({
  equipment,
  equipmentList,
  onSelectEquipment,
  isStreaming,
  onToggleStreaming
}) => {
  const [historyPoints, setHistoryPoints] = useState<TelemetryPoint[]>([]);

  const toPoint = (telemetry: Equipment['telemetry'], timestamp?: string): TelemetryPoint => ({
    time: new Date(timestamp || telemetry.timestamp || Date.now()).toLocaleTimeString(),
    engineTemp: telemetry.engineTemp,
    hydraulicTemp: telemetry.hydraulicTemp,
    hydraulicPressure: telemetry.hydraulicPressure,
    vibrationRms: telemetry.vibrationRms,
    fuelRate: telemetry.fuelRate,
    payloadTons: telemetry.payloadTons
  });

  // Load persisted PostgreSQL history whenever the selected equipment changes.
  useEffect(() => {
    let cancelled = false;
    api.getTelemetryHistory(equipment.id, 30)
      .then((items) => {
        if (cancelled) return;
        const points = items
          .slice()
          .reverse()
          .map((item) => toPoint(item.telemetry, item.capturedAt));
        setHistoryPoints(points.length > 0 ? points : [toPoint(equipment.telemetry)]);
      })
      .catch((error) => {
        console.error('Telemetry history load failed:', error);
        if (!cancelled) setHistoryPoints([toPoint(equipment.telemetry)]);
      });
    return () => { cancelled = true; };
  }, [equipment.id]);

  // The current point is produced by FastAPI and already persisted in PostgreSQL.
  useEffect(() => {
    if (!isStreaming) return;
    setHistoryPoints((prev) => [...prev.slice(-29), toPoint(equipment.telemetry)]);
  }, [equipment.telemetry.timestamp, isStreaming]);


  return (
    <div id="telemetry-stream-view" className="space-y-4">
      {/* Telemetry Ingestion Architecture & Status Bar */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase">
                FASTAPI TELEMETRY PIPELINE
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">Telemetría Operacional Persistente</h2>
            </div>
            <p className="text-xs font-mono text-slate-400">
              FastAPI normaliza snapshots y PostgreSQL conserva el estado actual y el histórico de telemetría.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            id="select-telemetry-equipment"
            value={equipment.id}
            onChange={(e) => {
              const selected = equipmentList.find((eq) => eq.id === e.target.value);
              if (selected) onSelectEquipment(selected);
            }}
            className="px-3 py-1.5 text-xs font-mono bg-[#0F172A] border border-slate-700 rounded text-slate-100 font-medium focus:outline-none focus:border-blue-500"
          >
            {equipmentList.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.code} — {eq.name}
              </option>
            ))}
          </select>

          <button
            id="btn-telemetry-stream-toggle"
            onClick={onToggleStreaming}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer border ${
              isStreaming
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
          >
            {isStreaming ? 'PAUSE STREAM' : 'RESUME STREAM'}
          </button>
        </div>
      </div>

      {/* Stream Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="p-3 bg-[#1E293B] border border-slate-700 rounded">
          <span className="text-slate-400 text-[10px] uppercase block">TEMP. MOTOR</span>
          <span className="text-base font-bold text-white">{equipment.telemetry.engineTemp}°C</span>
        </div>
        <div className="p-3 bg-[#1E293B] border border-slate-700 rounded">
          <span className="text-slate-400 text-[10px] uppercase block">TEMP. ACEITE HIDR.</span>
          <span className={`text-base font-bold ${equipment.telemetry.hydraulicTemp > 90 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
            {equipment.telemetry.hydraulicTemp}°C
          </span>
        </div>
        <div className="p-3 bg-[#1E293B] border border-slate-700 rounded">
          <span className="text-slate-400 text-[10px] uppercase block">PRESIÓN HIDRÁULICA</span>
          <span className="text-base font-bold text-white">{equipment.telemetry.hydraulicPressure} bar</span>
        </div>
        <div className="p-3 bg-[#1E293B] border border-slate-700 rounded">
          <span className="text-slate-400 text-[10px] uppercase block">VIBRACIÓN BOMBA RMS</span>
          <span className={`text-base font-bold ${equipment.telemetry.vibrationRms > 4.5 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
            {equipment.telemetry.vibrationRms} mm/s
          </span>
        </div>
        <div className="p-3 bg-[#1E293B] border border-slate-700 rounded">
          <span className="text-slate-400 text-[10px] uppercase block">CONSUMO COMBUSTIBLE</span>
          <span className="text-base font-bold text-amber-400">{equipment.telemetry.fuelRate} L/h</span>
        </div>
        <div className="p-3 bg-[#1E293B] border border-slate-700 rounded">
          <span className="text-slate-400 text-[10px] uppercase block">CÓDIGO ISO 4406</span>
          <span className="text-base font-bold text-cyan-400">{equipment.telemetry.isoOilContamination}</span>
        </div>
      </div>

      {/* Multi-Channel Time Series Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Temperatures & Pressures */}
        <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Series Temporales: Temperaturas (°C) vs. Presión (bar)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">BUFFER: 30s</span>
          </div>

          <div className="h-[240px] w-full bg-[#0F172A] rounded p-2 border border-slate-700/80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#94a3b8" fontSize={10} fontFamily="monospace" domain={[40, 360]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="hydraulicPressure" name="Presión Hidráulica (bar)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="hydraulicTemp" name="Temp. Hidráulica (°C)" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="engineTemp" name="Temp. Motor (°C)" stroke="#eab308" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Vibration RMS & Fuel Burn */}
        <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Vibración Espectral (mm/s RMS) & Combustible (L/h)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">ISO 10816-3</span>
          </div>

          <div className="h-[240px] w-full bg-[#0F172A] rounded p-2 border border-slate-700/80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} fontFamily="monospace" />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} fontFamily="monospace" domain={[0, 15]} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} fontFamily="monospace" domain={[100, 450]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="vibrationRms" name="Vibración RMS (mm/s)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="fuelRate" name="Consumo Combustible (L/h)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Industrial IoT Connector Specs & Live Raw JSON Packet Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#1E293B] border border-slate-700 space-y-3">
          <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            Persistencia PostgreSQL
          </h4>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400 uppercase text-[10px]">Tabla histórica:</span>
              <span className="text-white">telemetry_history</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400 uppercase text-[10px]">Motor SQL:</span>
              <span className="text-white">PostgreSQL 16</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400 uppercase text-[10px]">Modo de ingesta:</span>
              <span className="text-emerald-400 font-bold">Snapshot / API</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400 uppercase text-[10px]">Histórico:</span>
              <span className="text-white">JSONB por equipo</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 uppercase text-[10px]">Retención:</span>
              <span className="text-white">Persistente en volumen Docker</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#1E293B] border border-slate-700 space-y-3">
          <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Conectores Industriales (Roadmap)
          </h4>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400 uppercase text-[10px]">CAT VIMS 3G (CAN J1939):</span>
              <span className="text-emerald-400">SIMULADO / NO CONECTADO</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400 uppercase text-[10px]">Komatsu KOMTRAX Plus:</span>
              <span className="text-emerald-400">SIMULADO / NO CONECTADO</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400 uppercase text-[10px]">OPC-UA Server (P&H):</span>
              <span className="text-emerald-400">NO CONFIGURADO</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400 uppercase text-[10px]">Vibration Accelerometers:</span>
              <span className="text-emerald-400">FUENTE SIMULADA</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 uppercase text-[10px]">Latencia Red Mina (Mesh):</span>
              <span className="text-blue-400">N/D — entorno demo</span>
            </div>
          </div>
        </div>

        {/* Live Raw JSON Inspector */}
        <div className="p-4 rounded-lg bg-[#1E293B] border border-slate-700 space-y-2">
          <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            Payload Normalizado (Último Snapshot)
          </h4>
          <pre className="text-[10px] font-mono text-emerald-400 bg-[#0F172A] p-2.5 rounded overflow-x-auto h-[130px] border border-slate-700 leading-relaxed">
            {JSON.stringify({
              source: 'fastapi/postgresql',
              timestamp: new Date().toISOString(),
              unit_code: equipment.code,
              sensors: {
                engine_temp_c: equipment.telemetry.engineTemp,
                hyd_temp_c: equipment.telemetry.hydraulicTemp,
                hyd_press_bar: equipment.telemetry.hydraulicPressure,
                vib_rms_mms: equipment.telemetry.vibrationRms,
                fuel_rate_lph: equipment.telemetry.fuelRate,
                payload_ton: equipment.telemetry.payloadTons,
                gps: [equipment.gps.lat, equipment.gps.lng, equipment.gps.altitude]
              }
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
