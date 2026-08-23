import React, { useState } from 'react';
import { AlertNotification, AlertSeverity } from '../types';
import { 
  Bell, 
  CheckCircle2, 
  Search, 
  Wrench, 
  Volume2, 
  VolumeX,
  AlertTriangle,
  Info,
  Flame
} from 'lucide-react';

interface AlertsCenterViewProps {
  alerts: AlertNotification[];
  onAcknowledgeAlert: (alertId: string, user: string, notes: string) => void;
  onCreateOTFromAlert: (alert: AlertNotification) => void;
}

export const AlertsCenterView: React.FC<AlertsCenterViewProps> = ({
  alerts,
  onAcknowledgeAlert,
  onCreateOTFromAlert
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedAlertForAck, setSelectedAlertForAck] = useState<AlertNotification | null>(null);
  const [ackNotes, setAckNotes] = useState('');
  const [ackUser, setAckUser] = useState('Ing. Mantenimiento - Guardia Día');

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== 'ALL' && alert.severity !== severityFilter) return false;
    if (statusFilter === 'OPEN' && alert.acknowledged) return false;
    if (statusFilter === 'ACK' && !alert.acknowledged) return false;
    if (statusFilter === 'RESOLVED' && !alert.resolved) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        alert.equipmentCode.toLowerCase().includes(q) ||
        alert.title.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        alert.prescriptiveAction.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertForAck) return;
    onAcknowledgeAlert(selectedAlertForAck.id, ackUser, ackNotes || 'Reconocida en centro de monitoreo.');
    setSelectedAlertForAck(null);
    setAckNotes('');
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'EMERGENCIA':
      case 'CRITICA':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1">
            <Flame className="w-3 h-3" />
            CRÍTICA
          </span>
        );
      case 'ADVERTENCIA':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            ADVERTENCIA
          </span>
        );
      case 'INFORMATIVA':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
    }
  };

  return (
    <div id="alerts-center-view" className="space-y-4">
      {/* Header Bar */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 rounded bg-rose-500/20 border border-rose-500/30 text-rose-400">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30">
                CENTRO DE ALERTAS & AUDITORÍA
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">Monitoreo de Anomalías & Límites Críticos</h2>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Notificaciones en Tiempo Real • Trazabilidad Operacional • Protocolo de Reconocimiento y Derivación a CMMS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <button
            id="btn-toggle-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#0F172A] border-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'ALARMA SONORA ON' : 'ALARMA SONORA OFF'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-alerts"
              type="text"
              placeholder="Buscar alertas por código, equipo o prescripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs font-mono"
            />
          </div>

          <select
            id="select-alert-severity-filter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
          >
            <option value="ALL">Todas las Severidades</option>
            <option value="CRITICA">Crítica</option>
            <option value="ADVERTENCIA">Advertencia</option>
            <option value="INFORMATIVA">Informativa</option>
          </select>

          <select
            id="select-alert-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="OPEN">Abiertas (Sin Reconocer)</option>
            <option value="ACK">Reconocidas</option>
            <option value="RESOLVED">Resueltas</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          <span>{filteredAlerts.length} alertas registradas</span>
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            id={`alert-card-${alert.id}`}
            className={`p-3.5 rounded-lg border transition-all ${
              !alert.acknowledged && (alert.severity === 'CRITICA' || alert.severity === 'EMERGENCIA')
                ? 'bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/5'
                : alert.acknowledged
                ? 'bg-[#1E293B] border-slate-700 opacity-90'
                : 'bg-[#1E293B] border-slate-700'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                    {alert.equipmentCode}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-mono bg-[#0F172A] text-slate-300 border border-slate-700 rounded">
                    {alert.iso14224Code}
                  </span>
                  {getSeverityBadge(alert.severity)}
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(alert.detectedAt).toLocaleString()}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{alert.description}</p>

                {/* Telemetry Trigger Box */}
                <div className="mt-2 p-2.5 bg-[#0F172A] rounded border border-slate-700/80 text-xs text-slate-300 font-mono flex flex-wrap gap-4">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px]">Sensor:</span>{' '}
                    <span className="text-amber-400 font-bold">{alert.telemetryTrigger.sensor}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px]">Valor:</span>{' '}
                    <span className="text-rose-400 font-bold">{alert.telemetryTrigger.observedValue}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px]">Umbral:</span>{' '}
                    <span className="text-slate-300">{alert.telemetryTrigger.threshold}</span>
                  </div>
                </div>

                {/* Prescriptive Action */}
                <div className="mt-1 p-2 bg-blue-500/10 rounded border border-blue-500/30 text-xs text-blue-200">
                  <strong className="text-blue-400 font-mono uppercase text-[10px]">Acción Prescriptiva: </strong>
                  {alert.prescriptiveAction}
                </div>

                {/* Audit Trail Note if Acknowledged */}
                {alert.acknowledgedBy && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      Reconocida por <strong className="text-slate-200">{alert.acknowledgedBy}</strong> a las{' '}
                      {alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleTimeString() : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0 font-mono">
                {!alert.acknowledged && (
                  <button
                    id={`btn-ack-alert-${alert.id}`}
                    onClick={() => setSelectedAlertForAck(alert)}
                    className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>RECONOCER</span>
                  </button>
                )}

                <button
                  id={`btn-create-ot-from-alert-${alert.id}`}
                  onClick={() => onCreateOTFromAlert(alert)}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-blue-500"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>DERIVAR A OT</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Acknowledgment Modal */}
      {selectedAlertForAck && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAckSubmit} className="bg-[#1E293B] border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h3 className="text-xs font-mono font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                Reconocer Alarma ({selectedAlertForAck.equipmentCode})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAlertForAck(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Operador / Ingeniero Responsable:</label>
                <input
                  type="text"
                  required
                  value={ackUser}
                  onChange={(e) => setAckUser(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs font-mono focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Notas de Control / Medida Inmediata:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="ej: Notificado a despacho mina para reducir velocidad y preparar ingreso a taller..."
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs font-mono focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700 flex justify-end gap-2 font-mono">
              <button
                type="button"
                onClick={() => setSelectedAlertForAck(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer border border-slate-700"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold cursor-pointer"
              >
                CONFIRMAR
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
