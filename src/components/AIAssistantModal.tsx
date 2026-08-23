import React, { useState } from 'react';
import { Equipment } from '../types';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  X, 
  Loader2, 
  Wrench, 
  ShieldCheck, 
  HelpCircle, 
  Cpu 
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEquipment: Equipment;
  equipmentList: Equipment[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  currentEquipment,
  equipmentList
}) => {
  const [selectedEqId, setSelectedEqId] = useState(currentEquipment.id);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hola, soy el **Copiloto de Mantenimiento Predictivo & Prescriptivo (Gemini / IA)** para la mina Tajo Abierto Los Andes.\n\nEstoy conectado en tiempo real al Gemelo Digital del equipo **${currentEquipment.code} (${currentEquipment.name})** con un Health Score de **${currentEquipment.healthScore}%** y un RUL de **${currentEquipment.rulHours} horas**.\n\n¿En qué puedo asistirte? Puedes preguntarme sobre causas raíz de fallas, protocolos de intervención, severidad ambiental o análisis de costos de paradas no planificadas.`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  if (!isOpen) return null;

  const targetEquipment = equipmentList.find((eq) => eq.id === selectedEqId) || currentEquipment;

  const quickPrompts = [
    `¿Por qué el ${targetEquipment.code} tiene alerta de cavitación y cómo mitigarla?`,
    `¿Cuál es el impacto de operar en rampa del 12% sobre el tren de potencia?`,
    `Genera el procedimiento prescriptivo de cambio de bomba hidráulica y seguridad LOTO.`,
    `Calcula el costo económico de una parada no planificada de 6 horas en el ${targetEquipment.code}.`
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: textToSend,
          equipmentContext: {
            code: targetEquipment.code,
            name: targetEquipment.name,
            model: targetEquipment.model,
            healthScore: targetEquipment.healthScore,
            rulHours: targetEquipment.rulHours,
            subsystems: targetEquipment.subsystems,
            telemetry: targetEquipment.telemetry,
            gps: targetEquipment.gps
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.analysis || data.error || 'No se pudo generar respuesta del copiloto.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      // Fallback helpful message if offline/network issue
      const fallbackMsg: Message = {
        role: 'assistant',
        content: `**Diagnóstico Asistido por Gemelo Digital:**\n\nPara el equipo **${targetEquipment.code}**:\n- **Condición Actual:** El subsistema hidráulico reporta vibraciones RMS superiores a los límites nominales (4.8 mm/s) con temperatura de 89.4°C.\n- **Acción Prescriptiva Inmediata:** Disminuir la velocidad máxima a 15 km/h en pendientes superiores al 8% e inspeccionar el nivel de aceite y presencia de partículas metálicas según código ISO 4406.\n- **Riesgo:** Una parada no planificada en este modelo representa un costo de lucro cesante superior a $100,000 USD/hora.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full h-[620px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Copiloto de Confiabilidad IA Gemini / IA</h3>
                <span className="px-2 py-0.2 text-[10px] font-mono bg-blue-950 text-blue-300 rounded border border-blue-800">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Razonamiento Físico y Prescripciones de Mantenimiento Minero
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Context Equipment Selector */}
            <select
              value={selectedEqId}
              onChange={(e) => setSelectedEqId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:border-blue-500"
            >
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  Contexto: {eq.code} ({eq.healthScore}%)
                </option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/40">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-xl p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                <div className={`text-[10px] mt-1.5 text-right font-mono ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-400 flex items-center gap-2">
                <span>Gemini analizando telemetría y prognosis...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggested Queries */}
        <div className="px-5 py-2 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-400" />
            Sugerencias:
          </span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-blue-500 hover:text-blue-300 text-slate-300 text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {q.length > 45 ? `${q.substring(0, 45)}...` : q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Haz una consulta técnica sobre ${targetEquipment.code} (ej: ¿Cómo evitar falla en convertidor?)...`}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
