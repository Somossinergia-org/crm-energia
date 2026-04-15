import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  HiOutlineMail,
  HiOutlinePaperClip,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface GmailThread {
  id: string;
  gmail_message_id: string;
  asunto: string;
  extracto: string;
  cuerpo_html: string | null;
  cuerpo_texto: string | null;
  fecha: string;
  direccion: 'enviado' | 'recibido';
  remitente_nombre: string;
  remitente_email: string;
  tiene_adjuntos: boolean;
  leido: boolean;
}

interface ThreadsResponse {
  success: boolean;
  data: GmailThread[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDay === 0) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDay === 1) return 'Ayer';
  if (diffDay < 7) return `hace ${diffDay} dias`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Email Bubble ─────────────────────────────────────────────────────────────

function EmailBubble({ email }: { email: GmailThread }) {
  const [expanded, setExpanded] = useState(false);
  const isSent = email.direccion === 'enviado';

  const body =
    email.cuerpo_html ||
    email.cuerpo_texto?.replace(/\n/g, '<br/>') ||
    '<p class="text-gray-400 text-xs">Sin contenido</p>';

  return (
    <div className={`flex flex-col max-w-[75%] ${isSent ? 'self-end items-end' : 'self-start items-start'}`}>
      {/* Sender label */}
      <span className="text-xs text-gray-400 mb-1 px-1">
        {isSent ? 'Tu' : (email.remitente_nombre || email.remitente_email)} · {formatDate(email.fecha)}
      </span>

      {/* Bubble */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`text-left w-full rounded-2xl px-4 py-3 shadow-sm transition-all ${
          isSent
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {/* Subject */}
        <p className={`text-sm font-medium mb-1 ${isSent ? 'text-blue-100' : 'text-gray-500'}`}>
          {email.asunto || '(sin asunto)'}
        </p>

        {/* Preview / Expanded body */}
        {!expanded ? (
          <p className={`text-sm line-clamp-2 ${isSent ? 'text-white/90' : 'text-gray-700'}`}>
            {email.extracto}
          </p>
        ) : (
          <div
            className={`text-sm mt-2 ${isSent ? 'text-white/90' : 'text-gray-700'} prose prose-sm max-w-none`}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}

        {/* Footer */}
        <div className={`flex items-center justify-between mt-2 ${isSent ? 'text-blue-200' : 'text-gray-400'}`}>
          <div className="flex items-center gap-2">
            {email.tiene_adjuntos && (
              <span className="flex items-center gap-0.5 text-xs">
                <HiOutlinePaperClip className="w-3.5 h-3.5" />
                Adjunto
              </span>
            )}
          </div>
          <span className="flex items-center gap-0.5 text-xs">
            {expanded ? (
              <>
                <HiOutlineChevronUp className="w-3.5 h-3.5" />
                Contraer
              </>
            ) : (
              <>
                <HiOutlineChevronDown className="w-3.5 h-3.5" />
                Ver completo
              </>
            )}
          </span>
        </div>
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ConversacionTabProps {
  prospectId: string;
}

export default function ConversacionTab({ prospectId }: ConversacionTabProps) {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery<ThreadsResponse>({
    queryKey: ['gmail', 'threads', prospectId],
    queryFn: async () => {
      const res = await api.get<ThreadsResponse>(`/gmail/threads/${prospectId}`);
      return res.data;
    },
    enabled: !!prospectId,
    retry: 1,
  });

  const emails = data?.data ?? [];

  // Sort by date ascending so conversation flows naturally
  const sorted = [...emails].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <div className="animate-pulse bg-gray-200 rounded-2xl h-16 w-64" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <HiOutlineMail className="w-4 h-4 text-gray-400" />
          Hilo de conversacion email
          {emails.length > 0 && (
            <span className="text-xs text-gray-400">({emails.length})</span>
          )}
        </h3>
        <button
          onClick={() => navigate('/emails')}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
        >
          <HiOutlineMail className="w-3.5 h-3.5" />
          Redactar email
        </button>
      </div>

      {/* Error or no Gmail */}
      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm text-amber-700">
            No se pudo cargar la conversacion. Asegurate de tener Gmail conectado en Configuracion.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!error && !isLoading && emails.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <HiOutlineMail className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 font-medium mb-1">
            No hay emails en la conversacion con este prospecto
          </p>
          <p className="text-xs text-gray-400">
            Cuando envies o recibas emails apareceran aqui.
          </p>
        </div>
      )}

      {/* Conversation thread */}
      {sorted.length > 0 && (
        <div className="flex flex-col gap-3 py-2">
          {sorted.map((email) => (
            <EmailBubble key={email.id} email={email} />
          ))}
        </div>
      )}
    </div>
  );
}
