import React, { useState } from 'react';
import { WorkOrder, WorkOrderType, WorkOrderStatus, PriorityLevel, SparePartItem, Equipment, SubsystemType } from '../types';
import { formatUsd } from '../utils/digitalTwinEngine';
import { 
  Wrench, 
  Plus, 
  Calendar, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  UserCheck, 
  ShieldCheck, 
  FileSpreadsheet,
  Layers,
  ArrowRight
} from 'lucide-react';

interface CMMSMaintenanceViewProps {
  workOrders: WorkOrder[];
  spareParts: SparePartItem[];
  equipmentList: Equipment[];
  onCreateWorkOrder: (newOT: WorkOrder) => void;
  onUpdateWorkOrderStatus: (otId: string, newStatus: WorkOrderStatus) => void;
}

export const CMMSMaintenanceView: React.FC<CMMSMaintenanceViewProps> = ({
  workOrders,
  spareParts,
  equipmentList,
  onCreateWorkOrder,
  onUpdateWorkOrderStatus
}) => {
  const [activeTab, setActiveTab] = useState<'KANBAN' | 'GANTT' | 'INVENTORY'>('KANBAN');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOT, setSelectedOT] = useState<WorkOrder | null>(null);

  // New OT Form Modal State
  const [isCreatingOT, setIsCreatingOT] = useState(false);
  const [formEquipmentId, setFormEquipmentId] = useState(equipmentList[0]?.id || '');
  const [formSubsystem, setFormSubsystem] = useState<SubsystemType>('SISTEMA_HIDRAULICO');
  const [formType, setFormType] = useState<WorkOrderType>('PRESCRIPTIVO');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('CRITICA_URGENTE');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLeadTech, setFormLeadTech] = useState('Ing. Rodrigo Alarcón (Esp. Hidráulico CAT)');
  const [formDuration, setFormDuration] = useState(6.0);
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>(['part-01']);

  const filteredOTs = workOrders.filter((ot) => {
    if (statusFilter !== 'ALL' && ot.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && ot.type !== typeFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        ot.code.toLowerCase().includes(q) ||
        ot.equipmentCode.toLowerCase().includes(q) ||
        ot.title.toLowerCase().includes(q) ||
        ot.assignedLeadTech.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEquipment = equipmentList.find((eq) => eq.id === formEquipmentId) || equipmentList[0];

    const requiredParts = selectedPartIds.map((pid) => {
      const p = spareParts.find((part) => part.id === pid)!;
      return {
        partId: p.id,
        partNumber: p.partNumber,
        description: p.description,
        quantity: 1,
        unitCostUsd: p.unitCostUsd
      };
    });

    const totalCost = requiredParts.reduce((sum, item) => sum + item.quantity * item.unitCostUsd, 0);

    const newOT: WorkOrder = {
      id: `ot-${Date.now()}`,
      code: `OT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      equipmentId: targetEquipment.id,
      equipmentCode: targetEquipment.code,
      subsystem: formSubsystem,
      type: formType,
      status: 'PLANIFICADA',
      priority: formPriority,
      title: formTitle || `Intervención Prescriptiva en ${formSubsystem} (${targetEquipment.code})`,
      description: formDescription || 'Orden generada a partir de los límites de alarma del Gemelo Digital Operacional.',
      iso14224Mechanism: 'Desgaste por Cavitación / Degradación de Fluido según ISO 14224',
      iso14224FailureMode: 'Pérdida de Presión y Fuga Interna en Circuito Principal',
      createdAt: new Date().toISOString(),
      scheduledStartDate: new Date(Date.now() + 86400000).toISOString(),
      estimatedDurationHours: formDuration,
      assignedLeadTech: formLeadTech,
      techniciansTeam: ['Téc. Fernando Ruiz', 'Téc. Javier Ccama'],
      requiredParts,
      totalEstimatedCostUsd: totalCost,
      triggerSource: 'ALERTA_GEMELO_DIGITAL',
      prescriptiveRecommendations: [
        'Aislamiento y bloqueo LOTO de energía motriz e hidráulica.',
        'Sustitución de componentes e inspección de filtros de 10 micras.',
        'Prueba de rampa de presión y verificación de flujo telemétrico.'
      ],
      safetyChecklist: [
        { task: 'Verificación de Energía Cero LOTO', completed: false },
        { task: 'Instalación de Traba de Tolva / Caballetes', completed: false },
        { task: 'Bandeja Antiderrame para fluidos', completed: false }
      ]
    };

    onCreateWorkOrder(newOT);
    setIsCreatingOT(false);
    setSelectedOT(newOT);
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'CRITICA_URGENTE':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono animate-pulse">CRÍTICA URGENTE</span>;
      case 'ALTA':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">ALTA</span>;
      case 'MEDIA':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">MEDIA</span>;
      case 'BAJA':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-700 text-slate-300 font-mono">BAJA</span>;
    }
  };

  const getTypeBadge = (type: WorkOrderType) => {
    switch (type) {
      case 'PRESCRIPTIVO':
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">PRESCRIPTIVO IA</span>;
      case 'PREDICTIVO':
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">PREDICTIVO</span>;
      case 'PREVENTIVO':
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">PREVENTIVO (PM)</span>;
      case 'CORRECTIVO':
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">CORRECTIVO</span>;
    }
  };

  return (
    <div id="cmms-maintenance-view" className="space-y-4">
      {/* Header Bar */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 rounded bg-purple-500/20 border border-purple-500/30 text-purple-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                CMMS MINERO INTEGRADO
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">Gestión de Mantenimiento & Órdenes de Trabajo</h2>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Clasificación ISO 14224 • Programación Gantt • Reserva de Repuestos OEM en Almacén
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-create-work-order-modal"
            onClick={() => setIsCreatingOT(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition-colors cursor-pointer border border-blue-500"
          >
            <Plus className="w-4 h-4" />
            <span>NUEVA ORDEN (OT)</span>
          </button>
        </div>
      </div>

      {/* Subnavigation: Kanban / Gantt / Spare Parts Inventory */}
      <div className="flex border-b border-slate-700 bg-[#1E293B] rounded-t-lg px-2 overflow-x-auto">
        <button
          id="btn-tab-ot-kanban"
          onClick={() => setActiveTab('KANBAN')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'KANBAN'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>GESTIÓN DE OTS (KANBAN / LISTA)</span>
        </button>

        <button
          id="btn-tab-ot-gantt"
          onClick={() => setActiveTab('GANTT')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'GANTT'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>CRONOGRAMA GANTT</span>
        </button>

        <button
          id="btn-tab-ot-inventory"
          onClick={() => setActiveTab('INVENTORY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'INVENTORY'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>CATÁLOGO DE REPUESTOS OEM</span>
        </button>
      </div>

      {/* Tab 1: Kanban / List View */}
      {activeTab === 'KANBAN' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-search-ot"
                  type="text"
                  placeholder="Buscar por código OT, equipo, título..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs font-mono"
                />
              </div>

              <select
                id="select-ot-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PLANIFICADA">Planificada</option>
                <option value="EN_EJECUCION">En Ejecución</option>
                <option value="EN_REVISION">En Revisión</option>
                <option value="COMPLETADA">Completada</option>
              </select>

              <select
                id="select-ot-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="PRESCRIPTIVO">Prescriptivo (IA)</option>
                <option value="PREDICTIVO">Predictivo</option>
                <option value="PREVENTIVO">Preventivo</option>
                <option value="CORRECTIVO">Correctivo</option>
              </select>
            </div>

            <span className="text-slate-400 font-mono text-[11px]">
              {filteredOTs.length} OTs encontradas
            </span>
          </div>

          {/* OTs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredOTs.map((ot) => (
              <div
                key={ot.id}
                id={`card-ot-${ot.code.toLowerCase()}`}
                onClick={() => setSelectedOT(ot)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg p-3.5 hover:border-slate-500 cursor-pointer transition-all space-y-2.5 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#0F172A] text-purple-400 border border-purple-500/30 rounded">
                        {ot.code}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-mono font-bold bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded">
                        {ot.equipmentCode}
                      </span>
                      {getPriorityBadge(ot.priority)}
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">{ot.title}</h4>
                  </div>
                  {getTypeBadge(ot.type)}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{ot.description}</p>

                {/* ISO 14224 Tagging */}
                <div className="bg-[#0F172A] p-2 rounded border border-slate-700/80 text-[11px] font-mono space-y-0.5">
                  <div className="text-slate-300">
                    <span className="text-slate-500">Mecanismo ISO: </span>
                    <span className="text-amber-300">{ot.iso14224Mechanism}</span>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">Modo de Falla: </span>
                    <span className="text-slate-200">{ot.iso14224FailureMode}</span>
                  </div>
                </div>

                {/* Footer with Lead Tech, Cost & Status */}
                <div className="pt-2 border-t border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-slate-400 font-mono text-[11px]">
                    Líder: <strong className="text-slate-200 font-sans">{ot.assignedLeadTech}</strong>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-emerald-400 font-bold">{formatUsd(ot.totalEstimatedCostUsd)}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F172A] text-slate-300 border border-slate-700">
                      {ot.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Gantt Schedule View */}
      {activeTab === 'GANTT' && (
        <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Cronograma Gantt de Ventanas de Mantenimiento (Próximas 72 Horas)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Escala: 6 Horas por bloque</span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[700px] space-y-3">
              {/* Gantt Header Time Ruler */}
              <div className="grid grid-cols-12 gap-1 text-[10px] font-mono text-slate-400 border-b border-slate-700 pb-2">
                <div className="col-span-4 font-bold text-slate-300 uppercase">Equipo & Tarea OT</div>
                <div className="col-span-2 text-center bg-[#0F172A] py-1 rounded border border-slate-700/60">Hoy (08:00 - 20:00)</div>
                <div className="col-span-2 text-center bg-[#0F172A] py-1 rounded border border-slate-700/60">Noche (20:00 - 08:00)</div>
                <div className="col-span-2 text-center bg-[#0F172A] py-1 rounded border border-slate-700/60">Día +1 (08:00 - 20:00)</div>
                <div className="col-span-2 text-center bg-[#0F172A] py-1 rounded border border-slate-700/60">Día +2 (08:00 - 20:00)</div>
              </div>

              {/* Gantt Rows */}
              {workOrders.map((ot, idx) => (
                <div key={ot.id} className="grid grid-cols-12 gap-1 items-center text-xs py-2 border-b border-slate-700/50">
                  <div className="col-span-4 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-blue-400">{ot.equipmentCode}</span>
                      <span className="text-slate-300 font-mono text-xs">{ot.code}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{ot.title}</div>
                  </div>

                  <div className="col-span-8 relative h-7 bg-[#0F172A] rounded p-1 border border-slate-700/80">
                    <div
                      style={{
                        left: idx === 0 ? '25%' : idx === 1 ? '5%' : '60%',
                        width: idx === 0 ? '35%' : idx === 1 ? '40%' : '30%'
                      }}
                      className={`absolute top-0.5 bottom-0.5 rounded px-2 flex items-center justify-between text-[10px] font-mono font-bold text-white shadow-md ${
                        ot.type === 'PRESCRIPTIVO'
                          ? 'bg-purple-600 border border-purple-400'
                          : ot.type === 'PREVENTIVO'
                          ? 'bg-emerald-600 border border-emerald-400'
                          : 'bg-blue-600 border border-blue-400'
                      }`}
                    >
                      <span className="truncate">{ot.estimatedDurationHours}h • {ot.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Spare Parts & Inventory Catalog */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              Inventario de Repuestos Críticos en Almacén Mina
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Reserva automática vinculada al Gemelo Digital</span>
          </div>

          <div className="overflow-x-auto border border-slate-700 rounded">
            <table className="w-full text-xs text-left bg-[#0F172A]">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-mono text-[10px] uppercase bg-slate-800/40">
                  <th className="py-2.5 px-3">N° Parte OEM</th>
                  <th className="py-2.5 px-3">Descripción Componente</th>
                  <th className="py-2.5 px-2">Categoría</th>
                  <th className="py-2.5 px-2 text-right">Costo Unit. (USD)</th>
                  <th className="py-2.5 px-2 text-center">Disponible</th>
                  <th className="py-2.5 px-2 text-center">Reservado</th>
                  <th className="py-2.5 px-2 text-center">Lead Time</th>
                  <th className="py-2.5 px-3">Ubicación Almacén</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-mono text-[11px]">
                {spareParts.map((part) => (
                  <tr key={part.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-blue-400">{part.partNumber}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-200">{part.description}</td>
                    <td className="py-2.5 px-2 text-slate-400">{part.category}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-emerald-400">{formatUsd(part.unitCostUsd)}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold ${part.stockAvailable <= 2 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-200'}`}>
                        {part.stockAvailable}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center text-amber-400 font-bold">{part.stockReserved}</td>
                    <td className="py-2.5 px-2 text-center text-slate-400">{part.leadTimeDays} d</td>
                    <td className="py-2.5 px-3 font-sans text-slate-300 text-[11px]">{part.warehouseLocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected OT Detailed Inspection Modal / Drawer */}
      {selectedOT && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-700 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#0F172A] text-purple-400 border border-purple-500/30 rounded">
                    {selectedOT.code}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                    {selectedOT.equipmentCode}
                  </span>
                  {getPriorityBadge(selectedOT.priority)}
                </div>
                <h3 className="text-base font-bold text-white mt-1">{selectedOT.title}</h3>
              </div>
              <button
                onClick={() => setSelectedOT(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold mb-1 uppercase font-mono text-[10px]">Alcance del Trabajo (Scope of Work):</span>
                <p className="text-slate-300 leading-relaxed bg-[#0F172A] p-3 rounded border border-slate-700 font-mono text-xs">
                  {selectedOT.description}
                </p>
              </div>

              {/* Prescriptive Steps */}
              <div>
                <span className="text-slate-400 block font-semibold mb-1 uppercase font-mono text-[10px]">Protocolo Prescriptivo de Ejecución:</span>
                <ul className="space-y-1 bg-[#0F172A] p-3 rounded border border-slate-700">
                  {selectedOT.prescriptiveRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Safety Checklist */}
              <div>
                <span className="text-slate-400 block font-semibold mb-1 uppercase font-mono text-[10px]">Checklist de Seguridad Minera & LOTO:</span>
                <div className="space-y-1.5 bg-[#0F172A] p-3 rounded border border-slate-700">
                  {selectedOT.safetyChecklist.map((task, i) => (
                    <label key={i} className="flex items-center gap-2 text-slate-300 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {
                          const updated = { ...selectedOT };
                          updated.safetyChecklist[i].completed = !updated.safetyChecklist[i].completed;
                          setSelectedOT(updated);
                        }}
                        className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
                      />
                      <span>{task.task}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Required Spare Parts Table */}
              <div>
                <span className="text-slate-400 block font-semibold mb-1 uppercase font-mono text-[10px]">Repuestos Requeridos:</span>
                <div className="bg-[#0F172A] rounded border border-slate-700 overflow-hidden font-mono">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 text-[10px] uppercase bg-slate-800/40">
                        <th className="py-2 px-3">Parte</th>
                        <th className="py-2 px-3">Descripción</th>
                        <th className="py-2 px-2 text-center">Cant.</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50 text-[11px]">
                      {selectedOT.requiredParts.map((p, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 text-blue-400 font-bold">{p.partNumber}</td>
                          <td className="py-2 px-3 text-slate-300 font-sans">{p.description}</td>
                          <td className="py-2 px-2 text-center text-slate-200">{p.quantity}</td>
                          <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatUsd(p.quantity * p.unitCostUsd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
              <div className="text-xs font-mono text-slate-400">
                Costo Total: <strong className="text-emerald-400 font-bold text-sm">{formatUsd(selectedOT.totalEstimatedCostUsd)}</strong>
              </div>
              <div className="flex items-center gap-2 font-mono">
                {selectedOT.status === 'PLANIFICADA' && (
                  <button
                    onClick={() => {
                      onUpdateWorkOrderStatus(selectedOT.id, 'EN_EJECUCION');
                      setSelectedOT({ ...selectedOT, status: 'EN_EJECUCION' });
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors cursor-pointer border border-blue-500"
                  >
                    INICIAR EJECUCIÓN
                  </button>
                )}
                {selectedOT.status === 'EN_EJECUCION' && (
                  <button
                    onClick={() => {
                      onUpdateWorkOrderStatus(selectedOT.id, 'COMPLETADA');
                      setSelectedOT({ ...selectedOT, status: 'COMPLETADA' });
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors cursor-pointer border border-emerald-500"
                  >
                    MARCAR COMPLETADA
                  </button>
                )}
                <button
                  onClick={() => setSelectedOT(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium cursor-pointer border border-slate-700"
                >
                  CERRAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New OT Form Modal */}
      {isCreatingOT && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="bg-[#1E293B] border border-slate-700 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Plus className="w-4 h-4 text-blue-400" />
                Crear Nueva Orden de Trabajo (CMMS)
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingOT(false)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Equipo Objetivo:</label>
                  <select
                    value={formEquipmentId}
                    onChange={(e) => setFormEquipmentId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs font-mono focus:border-blue-500"
                  >
                    {equipmentList.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.code} — {eq.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Subsistema:</label>
                  <select
                    value={formSubsystem}
                    onChange={(e) => setFormSubsystem(e.target.value as SubsystemType)}
                    className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs font-mono focus:border-blue-500"
                  >
                    <option value="MOTOR_DIESEL_POWERTRAIN">Motor Diésel & Powertrain</option>
                    <option value="SISTEMA_HIDRAULICO">Sistema Hidráulico & Levante</option>
                    <option value="TREN_RODAJE_SUSPENSION">Tren de Rodaje & Suspensión</option>
                    <option value="SISTEMA_ELECTRICO_CONTROL">Sistema Eléctrico & Control</option>
                    <option value="ESTRUCTURA_CHASIS_TOLVA">Estructura & Tolva</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Tipo de Mantenimiento:</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as WorkOrderType)}
                    className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs font-mono focus:border-blue-500"
                  >
                    <option value="PRESCRIPTIVO">Prescriptivo (IA)</option>
                    <option value="PREDICTIVO">Predictivo</option>
                    <option value="PREVENTIVO">Preventivo (PM)</option>
                    <option value="CORRECTIVO">Correctivo</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Prioridad Operacional:</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs font-mono focus:border-blue-500"
                  >
                    <option value="CRITICA_URGENTE">Crítica Urgente</option>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Título de la Intervención:</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Reemplazo Prescriptivo de Bomba de Pistones Axiales"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Alcance y Descripción:</label>
                <textarea
                  rows={2}
                  placeholder="Detalles técnicos de la intervención..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Líder Técnico:</label>
                  <input
                    type="text"
                    value={formLeadTech}
                    onChange={(e) => setFormLeadTech(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Duración Estimada (Horas):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded text-slate-100 text-xs focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700 flex items-center justify-end gap-2 font-mono">
              <button
                type="button"
                onClick={() => setIsCreatingOT(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium cursor-pointer border border-slate-700"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer border border-blue-500"
              >
                CREAR Y PLANIFICAR OT
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
