import React from 'react';
import { MiningFleetKPIs } from '../types';
import { 
  Cpu, 
  Activity, 
  Truck, 
  Wrench, 
  Bell, 
  BarChart3, 
  FileText, 
  Code2, 
  Sparkles,
  Radio
} from 'lucide-react';

export type ActiveTab = 
  | 'FLEET_MANAGEMENT'
  | 'DIGITAL_TWIN_CORE'
  | 'TELEMETRY_STREAM'
  | 'CMMS_MAINTENANCE'
  | 'ALERTS_CENTER'
  | 'EXECUTIVE_ANALYTICS'
  | 'REPORTS_GENERATOR'
  | 'TECHNICAL_SPECS';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  kpis: MiningFleetKPIs;
  onOpenAiCopilot: () => void;
  isLiveStreaming: boolean;
  onToggleStreaming: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  kpis,
  onOpenAiCopilot,
  isLiveStreaming,
  onToggleStreaming
}) => {
  const tabs = [
    { id: 'FLEET_MANAGEMENT' as ActiveTab, label: 'Gestión de Flota', icon: Truck },
    { id: 'DIGITAL_TWIN_CORE' as ActiveTab, label: 'Gemelo Digital Core', icon: Cpu },
    { id: 'TELEMETRY_STREAM' as ActiveTab, label: 'IoT & Telemetría', icon: Activity },
    { id: 'CMMS_MAINTENANCE' as ActiveTab, label: 'Mantenimiento CMMS', icon: Wrench },
    { id: 'ALERTS_CENTER' as ActiveTab, label: 'Alertas & Auditoría', icon: Bell, badge: kpis.openCriticalAlertsCount },
    { id: 'EXECUTIVE_ANALYTICS' as ActiveTab, label: 'Dashboard KPIs', icon: BarChart3 },
    { id: 'REPORTS_GENERATOR' as ActiveTab, label: 'Reportes Multiformato', icon: FileText },
    { id: 'TECHNICAL_SPECS' as ActiveTab, label: 'Especificación & Código', icon: Code2 },
  ];

  return (
    <header id="main-application-header" className="bg-[#1E293B] border-b border-slate-700 sticky top-0 z-40">
      {/* Top Navigation Bar / Technical System Status Bar */}
      <div className="px-4 py-2.5 bg-[#1E293B] border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Brand & Unit Identifier */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-white italic font-mono shadow-sm">
            TT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono">
                TERRA-TWIN <span className="text-blue-400">/ OP-TWIN-G3</span>
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono bg-blue-500/20 border border-blue-400/40 text-blue-300 rounded">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Gestión Integral de Mantenimiento Predictivo & Prescriptivo
            </p>
          </div>
        </div>

        {/* Technical Status & Synchronization Telemetry */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">SYSTEM STATUS</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              CONNECTED
            </span>
          </div>

          <div className="flex flex-col items-end border-l border-slate-700 pl-4 hidden md:flex">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">FLEET HEALTH</span>
            <span className="text-emerald-400 font-bold text-[11px]">{kpis.fleetHealthAvg}%</span>
          </div>

          <div className="flex flex-col items-end border-l border-slate-700 pl-4 hidden sm:flex">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">LAST SYNC</span>
            <span className="text-slate-200 text-[11px]">2026-08-23 13:27:15.842</span>
          </div>

          {/* Stream Toggle & AI Prescriptive Action */}
          <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
            <button
              id="btn-toggle-telemetry-stream"
              onClick={onToggleStreaming}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer border ${
                isLiveStreaming
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveStreaming ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>{isLiveStreaming ? 'IoT LIVE' : 'PAUSED'}</span>
            </button>

            <button
              id="btn-open-gemini-copilot"
              onClick={onOpenAiCopilot}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded text-xs font-semibold font-mono tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>COPILOT AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation Bar */}
      <nav className="px-4 bg-[#111827] flex items-center gap-1 overflow-x-auto border-t border-slate-800 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id.toLowerCase()}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'border-blue-500 text-white bg-slate-800/80 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold font-mono bg-rose-600 text-white rounded">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
