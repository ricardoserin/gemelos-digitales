import React from 'react';
import { MiningFleetKPIs, Equipment } from '../types';
import { formatUsd } from '../utils/digitalTwinEngine';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Legend, 
  Cell 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  AlertOctagon,
  Percent
} from 'lucide-react';

interface ExecutiveAnalyticsViewProps {
  kpis: MiningFleetKPIs;
  equipmentList: Equipment[];
}

export const ExecutiveAnalyticsView: React.FC<ExecutiveAnalyticsViewProps> = ({
  kpis,
  equipmentList
}) => {
  // Historical 6-month Availability trend
  const availabilityTrendData = [
    { month: 'Sep', physical: 86.2, target: 88.0, oee: 80.1 },
    { month: 'Oct', physical: 87.5, target: 88.0, oee: 81.4 },
    { month: 'Nov', physical: 88.9, target: 88.5, oee: 82.8 },
    { month: 'Dic', physical: 89.4, target: 88.5, oee: 83.5 },
    { month: 'Ene', physical: 89.8, target: 88.5, oee: 84.1 },
    { month: 'Feb (Actual)', physical: kpis.physicalAvailabilityPct, target: 88.5, oee: kpis.oeePct }
  ];

  // Subsystem Pareto Failure Distribution
  const paretoFailureData = [
    { subsystem: 'Hidráulico', events: 18, costUsd: 1420000, fill: '#f43f5e' },
    { subsystem: 'Motor Powertrain', events: 11, costUsd: 2100000, fill: '#f59e0b' },
    { subsystem: 'Tren de Rodaje', events: 9, costUsd: 840000, fill: '#3b82f6' },
    { subsystem: 'Eléctrico & Control', events: 6, costUsd: 490000, fill: '#8b5cf6' },
    { subsystem: 'Estructura Chasis', events: 3, costUsd: 380000, fill: '#10b981' }
  ];

  // Cost Comparison: Traditional vs Digital Twin Prescriptive Maintenance
  const costComparisonData = [
    { category: 'Costo Paradas No Planificadas', tradicional: 9200000, conGemeloDigital: 2720000 },
    { category: 'Costo Repuestos de Emergencia', tradicional: 3800000, conGemeloDigital: 1850000 },
    { category: 'Mantenimiento Preventivo/Prescriptivo', tradicional: 2400000, conGemeloDigital: 2950000 },
    { category: 'Costo Total de Mantenimiento', tradicional: 15400000, conGemeloDigital: 7520000 }
  ];

  return (
    <div id="executive-analytics-view" className="space-y-4">
      {/* Header Bar */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                KPIS EJECUTIVOS & RENDIMIENTO MINERO
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">Dashboard de Confiabilidad y Disponibilidad</h2>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Métricas RAM (Reliability, Availability, Maintainability) • ROI de Mantenimiento Predictivo
            </p>
          </div>
        </div>
      </div>

      {/* Top 5 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Metric 1: Physical Availability */}
        <div className="p-3.5 rounded-lg bg-[#1E293B] border border-slate-700 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>DISP. FÍSICA</span>
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{kpis.physicalAvailabilityPct}%</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">+1.5% vs Meta</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">Meta Mina: 88.5%</div>
        </div>

        {/* Metric 2: OEE */}
        <div className="p-3.5 rounded-lg bg-[#1E293B] border border-slate-700 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>OEE GLOBAL FLOTA</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{kpis.oeePct}%</span>
            <span className="text-xs font-mono text-blue-400 font-semibold">Clase Mundial</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">Disp × Rend × Calidad</div>
        </div>

        {/* Metric 3: MTBF */}
        <div className="p-3.5 rounded-lg bg-[#1E293B] border border-slate-700 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>MTBF (TIEMPO MEDIO FALLA)</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{kpis.mtbfHours}h</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">+18.4h</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">Confiabilidad Operacional</div>
        </div>

        {/* Metric 4: MTTR */}
        <div className="p-3.5 rounded-lg bg-[#1E293B] border border-slate-700 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>MTTR (TIEMPO REPARACIÓN)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{kpis.mttrHours}h</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">-1.1h</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">Mantenibilidad Prescriptiva</div>
        </div>

        {/* Metric 5: Avoided Downtime Cost */}
        <div className="p-3.5 rounded-lg bg-[#1E293B] border border-slate-700 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>AHORRO PARADAS</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">${(kpis.avoidedDowntimeCostUsd / 1000000).toFixed(2)}M</span>
            <span className="text-xs font-mono text-slate-400">USD</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">Basado en &gt;$100k/h parada 797F</div>
        </div>
      </div>

      {/* Charts Section: Availability Trends & Pareto Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Availability vs Target */}
        <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Evolución Semestral de Disponibilidad Física (%) vs Meta
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">OBJETIVO CUMPLIDO</span>
          </div>

          <div className="h-[260px] w-full bg-[#0F172A] rounded p-2 border border-slate-700/80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={availabilityTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[75, 95]} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="physical" name="Disponibilidad Física (%)" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                <Area type="monotone" dataKey="oee" name="OEE Global (%)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="target" name="Meta Contractual (88.5%)" stroke="#f59e0b" strokeDasharray="4 4" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pareto Failures by Subsystem */}
        <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Diagrama de Pareto: Costo de Fallas por Subsistema Crítico (USD)
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">LEY 80/20</span>
          </div>

          <div className="h-[260px] w-full bg-[#0F172A] rounded p-2 border border-slate-700/80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paretoFailureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} fontFamily="monospace" tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
                <YAxis dataKey="subsystem" type="category" stroke="#94a3b8" fontSize={10} width={110} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(val: any) => [`$${(val / 1000).toLocaleString()} USD`, 'Impacto Económico']}
                />
                <Bar dataKey="costUsd" radius={[0, 2, 2, 0]}>
                  {paretoFailureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROI Comparison Table: Traditional vs Digital Twin Prescriptive Maintenance */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Análisis de Retorno de Inversión (ROI): Mantenimiento Tradicional vs Gemelo Digital
        </h3>

        <div className="overflow-x-auto bg-[#0F172A] rounded border border-slate-700">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-mono bg-slate-800/60">
                <th className="py-2.5 px-3">CATEGORÍA DE COSTO OPERATIVO</th>
                <th className="py-2.5 px-3 text-right">ESQUEMA TRADICIONAL (CORRECTIVO/PM)</th>
                <th className="py-2.5 px-3 text-right text-emerald-400">CON GEMELO DIGITAL OPERACIONAL</th>
                <th className="py-2.5 px-3 text-right text-blue-400">AHORRO NETO ANUAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-mono">
              {costComparisonData.map((row, idx) => {
                const diff = row.tradicional - row.conGemeloDigital;
                return (
                  <tr key={idx} className={idx === costComparisonData.length - 1 ? 'bg-slate-900/80 font-bold' : 'hover:bg-slate-800/40'}>
                    <td className="py-2.5 px-3 text-slate-200 font-medium">{row.category}</td>
                    <td className="py-2.5 px-3 text-right text-rose-400">{formatUsd(row.tradicional)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">{formatUsd(row.conGemeloDigital)}</td>
                    <td className="py-2.5 px-3 text-right text-blue-300 font-bold">
                      {diff > 0 ? `+${formatUsd(diff)}` : `-${formatUsd(Math.abs(diff))}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
