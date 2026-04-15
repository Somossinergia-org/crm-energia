import { useEffect, useRef, useState } from 'react';
import {
  HiOutlineLightningBolt,
  HiOutlineMicrophone,
  HiOutlinePaperAirplane,
  HiOutlineTrash,
  HiOutlineRefresh,
} from 'react-icons/hi';
import api from '../services/api';
import { useAgentChat } from '../hooks/useAgentChat';

// ─── Speech API types ──────────────────────────────────────────────────────────

interface ISpeechRecognitionResult {
  readonly 0: { transcript: string };
}
interface ISpeechRecognitionResultList {
  readonly 0: ISpeechRecognitionResult;
}
interface ISpeechRecognitionEvent extends Event {
  readonly results: ISpeechRecognitionResultList;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

function getSpeechRecognition(): ISpeechRecognitionConstructor | undefined {
  const w = window as typeof window & {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

// ─── Markdown renderer ─────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-pink-600 rounded px-1 text-xs font-mono">$1</code>');

  html = html
    .split('\n')
    .map((line) => {
      if (/^[-•]\s+/.test(line)) {
        return `<li class="ml-4 list-disc">${line.replace(/^[-•]\s+/, '')}</li>`;
      }
      return line;
    })
    .join('\n');

  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (match) => `<ul class="my-1 space-y-0.5">${match}</ul>`);
  html = html.replace(/\n/g, '<br/>');
  return html;
}

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BriefingOpportunity {
  id: string;
  nombre?: string;
  empresa?: string;
  valor_estimado?: number;
  etapa?: string;
  score?: number;
}

interface AgentLog {
  id: string;
  action?: string;
  description?: string;
  created_at?: string;
  timestamp?: string;
}

// ─── Quick actions ──────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: '📋 Briefing del día', message: '¿Cuál es mi briefing del día? Dame un resumen de prospectos urgentes y visitas.' },
  { label: '🎯 Oportunidades', message: '¿Cuáles son mis mejores oportunidades ahora mismo?' },
  { label: '📧 Inbox', message: '¿Cuántos emails tengo sin leer? Dame un resumen del inbox.' },
  { label: '📊 Pipeline', message: '¿Cómo está mi pipeline esta semana?' },
];

// ─── Typing indicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <HiOutlineLightningBolt className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-5">
          <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Context Panel ──────────────────────────────────────────────────────────────

function ContextPanel() {
  const [opportunities, setOpportunities] = useState<BriefingOpportunity[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loadingOpp, setLoadingOpp] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const loadData = async () => {
    setLoadingOpp(true);
    setLoadingLogs(true);

    try {
      const res = await api.get<{
        data: { opportunities?: BriefingOpportunity[]; prospectos?: BriefingOpportunity[] };
      }>('/ai/briefing');
      const data = res.data?.data;
      const opps = data?.opportunities ?? data?.prospectos ?? [];
      setOpportunities(opps.slice(0, 5));
    } catch {
      setOpportunities([]);
    } finally {
      setLoadingOpp(false);
    }

    try {
      const res = await api.get<{ data: AgentLog[] | { logs?: AgentLog[] } }>('/agent/logs');
      const raw = res.data?.data;
      const logsArr = Array.isArray(raw) ? raw : (raw as { logs?: AgentLog[] })?.logs ?? [];
      setLogs(logsArr.slice(0, 8));
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-700">Contexto</h2>
        <button
          onClick={loadData}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Actualizar"
        >
          <HiOutlineRefresh className="w-4 h-4" />
        </button>
      </div>

      {/* Top Opportunities */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <span className="text-base">🎯</span>
          <h3 className="text-sm font-semibold text-gray-700">Top Oportunidades</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {loadingOpp ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Cargando...</div>
          ) : opportunities.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No hay datos disponibles</div>
          ) : (
            opportunities.map((opp, i) => (
              <div key={opp.id ?? i} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {opp.nombre ?? opp.empresa ?? `Oportunidad ${i + 1}`}
                    </p>
                    {opp.empresa && opp.nombre && (
                      <p className="text-xs text-gray-500 truncate">{opp.empresa}</p>
                    )}
                    {opp.etapa && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                        {opp.etapa}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 gap-1">
                    {opp.valor_estimado != null && (
                      <span className="text-xs font-semibold text-green-600">
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                          maximumFractionDigits: 0,
                        }).format(opp.valor_estimado)}
                      </span>
                    )}
                    {opp.score != null && (
                      <span className="text-xs text-gray-400">Score: {opp.score}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Agent Logs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <span className="text-base">⚡</span>
          <h3 className="text-sm font-semibold text-gray-700">Últimas acciones</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {loadingLogs ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Cargando...</div>
          ) : logs.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Sin actividad reciente</div>
          ) : (
            logs.map((log, i) => {
              const ts = log.created_at ?? log.timestamp;
              return (
                <div key={log.id ?? i} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <p className="text-sm text-gray-700 truncate">
                    {log.description ?? log.action ?? 'Acción del agente'}
                  </p>
                  {ts && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(ts).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function AgentPage() {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const { messages, sendMessage, isLoading, clearChat } = useAgentChat();

  useEffect(() => {
    setSpeechSupported(!!getSpeechRecognition());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMic = () => {
    if (!speechSupported) return;
    const SRClass = getSpeechRecognition();
    if (!SRClass) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    try {
      const recognition = new SRClass();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setTimeout(() => {
          setInputValue('');
          sendMessage(transcript);
        }, 200);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
      {/* ── Chat column ── */}
      <div className="flex-1 lg:w-[60%] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <HiOutlineLightningBolt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Asistente Sinergia</h1>
              <p className="text-xs text-blue-100">Gemini 2.0 Flash • En línea</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            title="Limpiar conversación"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs transition-colors"
          >
            <HiOutlineTrash className="w-4 h-4" />
            Limpiar
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-end gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'model' && (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <HiOutlineLightningBolt className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[72%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.role === 'model' ? (
                  <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  msg.content
                )}
                <p
                  className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-blue-100 text-right' : 'text-gray-400'}`}
                >
                  {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 px-4 py-2.5 bg-white border-t border-gray-100 overflow-x-auto flex-shrink-0">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setInputValue('');
                sendMessage(action.message);
              }}
              disabled={isLoading}
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
          {speechSupported && (
            <button
              onClick={handleMic}
              className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={isListening ? 'Escuchando...' : 'Voz (es-ES)'}
            >
              <HiOutlineMicrophone className="w-5 h-5" />
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            disabled={isLoading}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 placeholder-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            title="Enviar"
          >
            <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
          </button>
        </div>
      </div>

      {/* ── Context column ── */}
      <div className="lg:w-[40%] flex-shrink-0">
        <ContextPanel />
      </div>
    </div>
  );
}
