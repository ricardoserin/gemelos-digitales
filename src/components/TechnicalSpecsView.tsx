import React, { useState } from 'react';
import { Check, Code2, Copy, Database, FileCode2, Server, Boxes, Activity, Layers } from 'lucide-react';

type CodeTab = 'FASTAPI_MAIN' | 'MODELS' | 'POSTGRES' | 'TELEMETRY' | 'DOCKER';

export const TechnicalSpecsView: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('FASTAPI_MAIN');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const snippets: Record<CodeTab, string> = {
    FASTAPI_MAIN: `# backend/app/main.py\nfrom fastapi import FastAPI, Depends\nfrom sqlalchemy.orm import Session\n\napp = FastAPI(\n    title="Gemelo Digital Operacional de Carguío Minero API",\n    version="3.0.0"\n)\n\n@app.get("/api/health")\ndef health(db: Session = Depends(get_db)):\n    db.execute(text("SELECT 1"))\n    return {\n        "status": "ok",\n        "dataMode": "POSTGRESQL_PERSISTENT",\n        "postgresqlStatus": "CONNECTED"\n    }\n\n@app.get("/api/fleet")\ndef get_fleet(db: Session = Depends(get_db)):\n    return [equipment_to_dict(row) for row in db.scalars(select(EquipmentRow)).all()]`,

    MODELS: `# backend/app/models.py\nclass EquipmentRow(Base):\n    __tablename__ = "equipment"\n    id = mapped_column(String(80), primary_key=True)\n    code = mapped_column(String(50), unique=True, index=True)\n    status = mapped_column(String(50), index=True)\n    health_score = mapped_column(Float)\n    rul_hours = mapped_column(Integer)\n    data = mapped_column(JSONB, nullable=False)\n\nclass WorkOrderRow(Base):\n    __tablename__ = "work_orders"\n    id = mapped_column(String(80), primary_key=True)\n    code = mapped_column(String(80), unique=True, index=True)\n    equipment_id = mapped_column(ForeignKey("equipment.id"))\n    status = mapped_column(String(40), index=True)\n    data = mapped_column(JSONB, nullable=False)`,

    POSTGRES: `-- Esquema creado automáticamente por SQLAlchemy\n-- Tablas persistentes principales\nSELECT tablename\nFROM pg_tables\nWHERE schemaname = 'public';\n\n-- equipment\n-- spare_parts\n-- alerts\n-- work_orders\n-- telemetry_history\n\n-- Ejemplo: últimas muestras de telemetría\nSELECT equipment_id, captured_at, payload\nFROM telemetry_history\nORDER BY captured_at DESC\nLIMIT 50;`,

    TELEMETRY: `# Ingesta real disponible para sensores/integraciones futuras\nPOST /api/telemetry/{equipment_id}\nContent-Type: application/json\n\n{\n  "engineTemp": 94.2,\n  "hydraulicTemp": 98.4,\n  "hydraulicPressure": 338.0,\n  "vibrationRms": 6.82,\n  "fuelRate": 342.0,\n  "payloadTons": 398.5\n}\n\n# Histórico persistido\nGET /api/telemetry/{equipment_id}/history?limit=100\n\n# Demo: FastAPI genera un snapshot y lo persiste\nPOST /api/telemetry/simulate`,

    DOCKER: `services:\n  postgres:\n    image: postgres:16-alpine\n    ports:\n      - "5436:5432"\n    volumes:\n      - mining_postgres_data:/var/lib/postgresql/data\n\n  backend:\n    build:\n      context: .\n      dockerfile: backend/Dockerfile\n    environment:\n      DATABASE_URL: postgresql+psycopg://mining:***@postgres:5432/mining_twin\n    depends_on:\n      postgres:\n        condition: service_healthy\n\n  frontend:\n    build:\n      context: .\n      dockerfile: Dockerfile\n    ports:\n      - "3000:3000"\n    depends_on:\n      backend:\n        condition: service_healthy`,
  };

  const tabs: { id: CodeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'FASTAPI_MAIN', label: 'FastAPI API', icon: <FileCode2 className="w-3.5 h-3.5" /> },
    { id: 'MODELS', label: 'SQLAlchemy Models', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'POSTGRES', label: 'PostgreSQL', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'TELEMETRY', label: 'Telemetry API', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'DOCKER', label: 'Docker Compose', icon: <Boxes className="w-3.5 h-3.5" /> },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippets[activeCodeTab]);
    setCopiedKey(activeCodeTab);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  return (
    <div id="technical-specs-view" className="space-y-4">
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-violet-500/20 border border-violet-500/30 text-violet-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-400/30">
                ARQUITECTURA IMPLEMENTADA
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">React + FastAPI + PostgreSQL</h2>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Frontend servido por Nginx • API REST FastAPI • SQLAlchemy + PostgreSQL JSONB • Docker Compose
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-lg bg-[#1E293B] border border-slate-700 shadow-md">
          <div className="flex items-center gap-2 text-blue-400 font-bold font-mono uppercase text-[11px] mb-2">
            <Server className="w-4 h-4" /> Frontend
          </div>
          <p className="text-slate-300 leading-relaxed">React/Vite se compila como contenido estático. Nginx sirve la SPA y enruta <code className="text-cyan-300">/api</code> hacia FastAPI.</p>
        </div>
        <div className="p-4 rounded-lg bg-[#1E293B] border border-slate-700 shadow-md">
          <div className="flex items-center gap-2 text-violet-400 font-bold font-mono uppercase text-[11px] mb-2">
            <Code2 className="w-4 h-4" /> Backend
          </div>
          <p className="text-slate-300 leading-relaxed">FastAPI centraliza flota, alertas, CMMS, KPIs, telemetría, histórico y el copiloto IA opcional.</p>
        </div>
        <div className="p-4 rounded-lg bg-[#1E293B] border border-slate-700 shadow-md">
          <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono uppercase text-[11px] mb-2">
            <Database className="w-4 h-4" /> Persistencia
          </div>
          <p className="text-slate-300 leading-relaxed">PostgreSQL 16 conserva equipos, órdenes, alertas, repuestos y snapshots históricos de telemetría en un volumen Docker.</p>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden shadow-md">
        <div className="flex items-center justify-between bg-[#0F172A] border-b border-slate-700 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCodeTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeCodeTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
          <button onClick={handleCopy} className="mx-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 hover:text-white whitespace-nowrap">
            {copiedKey === activeCodeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedKey === activeCodeTab ? 'COPIADO' : 'COPIAR'}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-emerald-300 bg-[#020617] min-h-[330px]">
          <code>{snippets[activeCodeTab]}</code>
        </pre>
      </div>

      <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-800/50 text-xs text-slate-300">
        <span className="font-bold text-blue-300">Evolución recomendada:</span> MQTT/OPC-UA, TimescaleDB, Redis y modelos predictivos especializados pueden añadirse después; no se reportan como servicios activos en esta versión.
      </div>
    </div>
  );
};
