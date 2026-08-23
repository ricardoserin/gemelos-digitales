import React, { useState } from 'react';
import { Equipment, MiningFleetKPIs, WorkOrder } from '../types';
import { formatUsd } from '../utils/digitalTwinEngine';
import { 
  FileText, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  FileCheck, 
  Sparkles, 
  Calendar, 
  Truck, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface ReportsGeneratorViewProps {
  equipmentList: Equipment[];
  kpis: MiningFleetKPIs;
  workOrders: WorkOrder[];
}

export const ReportsGeneratorView: React.FC<ReportsGeneratorViewProps> = ({
  equipmentList,
  kpis,
  workOrders
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'DOCX' | 'XLSX'>('PDF');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('ALL');
  const [includeAiPrescriptions, setIncludeAiPrescriptions] = useState(true);
  const [reportTitle, setReportTitle] = useState('Informe Ejecutivo de Confiabilidad y Gemelo Digital - Guardia Día');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const handleTriggerExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      if (selectedFormat === 'PDF') {
        window.print();
        setExportSuccessMsg('Informe PDF preparado para impresión o exportación vectorial.');
      } else if (selectedFormat === 'XLSX') {
        // Trigger CSV download
        const headers = 'Codigo,Nombre,Modelo,HealthScore,RUL_Horas,Horometro,Estado,Zona_Mina\n';
        const rows = equipmentList.map(eq => `${eq.code},"${eq.name}",${eq.model},${eq.healthScore},${eq.rulHours},${eq.totalOperatingHours},${eq.status},"${eq.gps.zoneName}"`).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Reporte_Telemetria_GemeloDigital_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportSuccessMsg('Dataset CSV/XLSX exportado exitosamente para análisis en Excel o SAP PM.');
      } else {
        // DOCX download format
        const docContent = `INFORME TECNICO DE MANTENIMIENTO PREDICTIVO\nMinera Tajo Abierto Los Andes\nGenerado: ${new Date().toLocaleString()}\n\nDisponibilidad Flota: ${kpis.physicalAvailabilityPct}%\nHealth Score Promedio: ${kpis.fleetHealthAvg}%\nAhorro Paradas No Planificadas: $${(kpis.avoidedDowntimeCostUsd/1000000).toFixed(2)}M USD\n\nRESUMEN DE FLOTA:\n` +
          equipmentList.map(eq => `- ${eq.code} (${eq.name}): Health ${eq.healthScore}%, RUL ${eq.rulHours}h, Estado ${eq.status}`).join('\n');
        const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Dossier_Tecnico_GemeloDigital_${new Date().toISOString().slice(0,10)}.doc`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportSuccessMsg('Documento técnico .DOCX exportado para edición en Microsoft Word.');
      }
    }, 600);
  };

  return (
    <div id="reports-generator-view" className="space-y-4">
      {/* Header Bar */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                GENERADOR MULTIFORMATO
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">Dossiers & Reportes de Mantenimiento</h2>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Exportación en formatos PDF (ReportLab), Word DOCX y Planillas Excel XLSX para Auditoría Minera
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Config Controls (1 col) */}
        <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md space-y-3 font-mono">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-700">
            <Download className="w-4 h-4 text-blue-400" />
            Parámetros del Informe
          </h3>

          {/* Format Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-slate-400 block font-bold">Formato de Exportación:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedFormat('PDF')}
                className={`p-2 rounded border text-center text-xs font-bold transition-all cursor-pointer ${
                  selectedFormat === 'PDF'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                    : 'bg-[#0F172A] border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Printer className="w-3.5 h-3.5 mx-auto mb-1" />
                <span className="text-[10px]">PDF DOSSIER</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('DOCX')}
                className={`p-2 rounded border text-center text-xs font-bold transition-all cursor-pointer ${
                  selectedFormat === 'DOCX'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/50'
                    : 'bg-[#0F172A] border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <FileText className="w-3.5 h-3.5 mx-auto mb-1" />
                <span className="text-[10px]">WORD (.DOCX)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('XLSX')}
                className={`p-2 rounded border text-center text-xs font-bold transition-all cursor-pointer ${
                  selectedFormat === 'XLSX'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                    : 'bg-[#0F172A] border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mx-auto mb-1" />
                <span className="text-[10px]">EXCEL (.XLSX)</span>
              </button>
            </div>
          </div>

          {/* Scope selection */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-400 block font-bold">Alcance del Reporte:</label>
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs focus:border-blue-500"
            >
              <option value="ALL">Toda la Flota de Carguío (5 Unidades)</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.code} — {eq.name}
                </option>
              ))}
            </select>
          </div>

          {/* Report Title */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-400 block font-bold">Título del Documento:</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs focus:border-blue-500 font-sans"
            />
          </div>

          {/* AI Checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1 font-sans">
            <input
              type="checkbox"
              checked={includeAiPrescriptions}
              onChange={(e) => setIncludeAiPrescriptions(e.target.checked)}
              className="rounded bg-[#0F172A] border-slate-700 text-blue-500 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Incluir Prescripciones IA de Gemini / IA
            </span>
          </label>

          {/* Export Button */}
          <button
            id="btn-generate-export-report"
            onClick={handleTriggerExport}
            disabled={isExporting}
            className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-blue-500"
          >
            {isExporting ? (
              <span>GENERANDO DOCUMENTO...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>GENERAR & DESCARGAR ({selectedFormat})</span>
              </>
            )}
          </button>

          {exportSuccessMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="font-sans">{exportSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Live Printable Preview (2 cols) */}
        <div className="lg:col-span-2 bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Vista Previa del Documento Oficial de Mantenimiento
            </h3>
            <span className="text-[10px] font-mono bg-[#0F172A] border border-slate-700 px-2 py-0.5 rounded text-slate-400">
              FORMATO ISO 14224 / RAMS
            </span>
          </div>

          {/* Formal Report Sheet (Simulates printed A4 dossier) */}
          <div className="bg-[#0F172A] border border-slate-700 rounded-lg p-5 text-slate-200 space-y-4 text-xs font-sans">
            {/* Header with Mining Logo & Meta */}
            <div className="flex justify-between items-start border-b border-slate-700 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-white tracking-wide font-mono">
                  MINERA TAJO ABIERTO LOS ANDES S.A.
                </h4>
                <div className="text-[11px] text-slate-400">Gerencia de Mantenimiento Mina & Confiabilidad</div>
                <div className="text-[10px] font-mono text-blue-400 mt-0.5">Ref: DOC-GDM-2026-0882 • Rev. 02</div>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-400">
                <div>Fecha: {new Date().toLocaleDateString()}</div>
                <div>Turno: Guardia Día (07:00 - 19:00)</div>
              </div>
            </div>

            {/* Document Title */}
            <div>
              <h5 className="text-sm font-bold text-white">{reportTitle}</h5>
              <p className="text-slate-400 text-xs mt-0.5">
                Evaluación probabilística de salud estructural, diagnóstico de telemetría y programación de órdenes de trabajo.
              </p>
            </div>

            {/* Executive KPI Summary Table */}
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="bg-[#1E293B] p-2 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Health Promedio</span>
                <span className="text-sm font-bold text-emerald-400">{kpis.fleetHealthAvg}%</span>
              </div>
              <div className="bg-[#1E293B] p-2 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Disp. Física</span>
                <span className="text-sm font-bold text-white">{kpis.physicalAvailabilityPct}%</span>
              </div>
              <div className="bg-[#1E293B] p-2 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">MTBF</span>
                <span className="text-sm font-bold text-amber-400">{kpis.mtbfHours}h</span>
              </div>
              <div className="bg-[#1E293B] p-2 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Ahorro Paradas</span>
                <span className="text-sm font-bold text-emerald-400">${(kpis.avoidedDowntimeCostUsd / 1000000).toFixed(2)}M</span>
              </div>
            </div>

            {/* Equipment Fleet Status Table */}
            <div className="overflow-x-auto bg-[#1E293B] rounded border border-slate-700">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-mono bg-slate-800/50">
                    <th className="py-2 px-2">CÓDIGO</th>
                    <th className="py-2 px-2">MODELO</th>
                    <th className="py-2 px-2 text-center">HEALTH SCORE</th>
                    <th className="py-2 px-2 text-center">RUL (HORAS)</th>
                    <th className="py-2 px-2 text-right">HORÓMETRO</th>
                    <th className="py-2 px-2 text-center">ESTADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono">
                  {equipmentList.map((eq) => (
                    <tr key={eq.id}>
                      <td className="py-2 px-2 font-bold text-blue-400">{eq.code}</td>
                      <td className="py-2 px-2 font-sans text-slate-300">{eq.model}</td>
                      <td className="py-2 px-2 text-center font-bold text-white">{eq.healthScore}%</td>
                      <td className={`py-2 px-2 text-center font-bold ${eq.rulHours < 200 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {eq.rulHours}h
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">{eq.totalOperatingHours.toLocaleString()}h</td>
                      <td className="py-2 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#0F172A] border border-slate-700 text-slate-300">
                          {eq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Prescriptions Section */}
            {includeAiPrescriptions && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded space-y-1 font-sans">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300 font-mono uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Prescripciones Operacionales Clave (Gemelo Digital IA):</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  1. Intervención prioritaria en camión <strong>CA-797-04</strong> por cavitación de bomba hidráulica (RUL: 184h).
                  2. Reducir velocidad máxima a 15 km/h en rampa de Banco 3420 para mitigar derate térmico.
                  3. Programar sustitución de filtros en ventana de cambio de guardia (19:00 hrs).
                </p>
              </div>
            )}

            {/* Signatures Block */}
            <div className="pt-4 border-t border-slate-700 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-400 font-mono">
              <div>
                <div className="border-b border-slate-600 pb-1 mb-1 font-semibold text-slate-200">
                  Ing. Rodrigo Alarcón C.
                </div>
                <div>Superintendente de Confiabilidad Mina</div>
                <div className="text-slate-500">CIP: 184920</div>
              </div>
              <div>
                <div className="border-b border-slate-600 pb-1 mb-1 font-semibold text-slate-200">
                  Ing. Carlos Mendoza V.
                </div>
                <div>Gerente de Operaciones y Mantenimiento</div>
                <div className="text-slate-500">CIP: 142091</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
