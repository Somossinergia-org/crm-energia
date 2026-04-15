import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HiOutlineLightningBolt,
  HiOutlineMicrophone,
  HiOutlinePaperAirplane,
  HiOutlineX,
  HiOutlineTrash,
} from 'react-icons/hi';
import { useAgentChat } from '../hooks/useAgentChat';

// ─── Speech API types (not in all TS DOM versions) ─────────────────────────────

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

// ─── Quick actions ──────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: '📋 Briefing', message: '¿Cuál es mi briefing del día? Dame un resumen de prospectos urgentes y visitas.' },
  { label: '🎯 Oportunidades', message: '¿Cuáles son mis mejores oportunidades ahora mismo?' },
  { label: '📧 Inbox', message: '¿Cuántos emails tengo sin leer? Dame un resumen del inbox.' },
  { label: '📊 Pipeline', message: '¿Cómo está mi pipeline esta semana?' },
];

// ─── Typing indicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <HiOutlineLightningBolt className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function AgentPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const prevMsgCountRef = useRef(0);

  const { messages, sendMessage, isLoading, clearChat } = useAgentChat();

  // Check speech support
  useEffect(() => {
    setSpeechSupported(!!getSpeechRecognition());
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Track unread messages when panel is closed
  useEffect(() => {
    if (!isOpen && messages.length > prevMsgCountRef.current) {
      const modelNewMsgs = messages
        .slice(prevMsgCountRef.current)
        .filter((m) => m.role === 'model').length;
      if (modelNewMsgs > 0) {
        setUnreadCount((c) => c + modelNewMsgs);
      }
    }
    if (isOpen) {
      setUnreadCount(0);
      prevMsgCountRef.current = messages.length;
    }
  }, [messages, isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    await sendMessage(text);
  }, [inputValue, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (message: string) => {
    setInputValue('');
    sendMessage(message);
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
        setInputValue(transcript);
        setIsListening(false);
        setTimeout(() => {
          setInputValue('');
          sendMessage(transcript);
        }, 300);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* ── Panel ── */}
      {isOpen && (
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ width: 380, height: 520 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <HiOutlineLightningBolt className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">Asistente Sinergia</p>
                <p className="text-xs text-blue-100">Gemini 2.0 • En línea</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Limpiar chat"
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar"
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end gap-2 mb-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <HiOutlineLightningBolt className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
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
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="flex gap-1.5 px-3 py-2 bg-white border-t border-gray-100 overflow-x-auto flex-shrink-0">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.message)}
                disabled={isLoading}
                className="flex-shrink-0 text-xs px-2.5 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 bg-white border-t border-gray-200 flex-shrink-0">
            {speechSupported && (
              <button
                onClick={handleMic}
                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={isListening ? 'Escuchando...' : 'Voz'}
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
              className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              title="Enviar"
            >
              <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>
      )}

      {/* ── Toggle button ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        title="Asistente Sinergia"
      >
        {isOpen ? (
          <HiOutlineX className="w-6 h-6" />
        ) : (
          <HiOutlineLightningBolt className="w-6 h-6" />
        )}

        {/* Unread badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Pulse ring (only when closed) */}
      {!isOpen && (
        <span
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-30 animate-ping pointer-events-none"
          style={{ animationDuration: '2.5s' }}
        />
      )}
    </div>
  );
}
