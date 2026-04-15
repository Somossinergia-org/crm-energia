import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  HiOutlineRefresh,
  HiOutlinePaperClip,
  HiOutlineMail,
  HiOutlineMailOpen,
  HiOutlineX,
  HiOutlineExternalLink,
} from 'react-icons/hi';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface GmailEmail {
  id: string;
  gmail_message_id: string;
  remitente_nombre: string;
  remitente_email: string;
  asunto: string;
  extracto: string;
  cuerpo_html: string | null;
  cuerpo_texto: string | null;
  fecha: string;
  leido: boolean;
  tiene_adjuntos: boolean;
  prospecto_id: string | null;
  prospecto_nombre: string | null;
  etiquetas: string[];
}

interface InboxStats {
  total: number;
  no_leidos: number;
  con_prospecto: number;
}

interface InboxResponse {
  success: boolean;
  data: GmailEmail[];
}

interface StatsResponse {
  success: boolean;
  data: InboxStats;
}

interface GmailAuthResponse {
  success: boolean;
  data: { url: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'ahora mismo';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHour < 24) return `hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  if (diffDay === 1) return 'ayer';
  if (diffDay < 7) return `hace ${diffDay} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function getAvatarColor(hasProspect: boolean): string {
  return hasProspect ? 'bg-blue-500' : 'bg-gray-400';
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function EmailSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-48" />
        <div className="h-3 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}

// ─── Email Panel (detalle) ────────────────────────────────────────────────────

function EmailPanel({
  email,
  onClose,
}: {
  email: GmailEmail;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const body = email.cuerpo_html || email.cuerpo_texto?.replace(/\n/g, '<br/>') || '<p class="text-gray-400">Sin contenido</p>';

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header del panel */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-base font-semibold text-gray-900 truncate">{email.asunto || '(sin asunto)'}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            De: <span className="text-gray-700">{email.remitente_nombre || email.remitente_email}</span>
            {email.remitente_nombre && (
              <span className="text-gray-400 ml-1">{'<'}{email.remitente_email}{'>'}</span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(email.fecha).toLocaleString('es-ES', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {email.prospecto_id && (
            <button
              onClick={() => navigate(`/pipeline/${email.prospecto_id}`)}
              className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-full transition-colors"
            >
              <HiOutlineExternalLink className="w-3.5 h-3.5" />
              {email.prospecto_nombre}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Adjuntos badge */}
      {email.tiene_adjuntos && (
        <div className="flex items-center gap-2 px-5 py-2 bg-amber-50 border-b border-amber-100">
          <HiOutlinePaperClip className="w-4 h-4 text-amber-600" />
          <span className="text-xs text-amber-700 font-medium">Este email tiene adjuntos</span>
        </div>
      )}

      {/* Cuerpo */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div
          className="prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </div>
    </div>
  );
}

// ─── Email Row ────────────────────────────────────────────────────────────────

function EmailRow({
  email,
  isSelected,
  onClick,
}: {
  email: GmailEmail;
  isSelected: boolean;
  onClick: () => void;
}) {
  const navigate = useNavigate();
  const initial = (email.remitente_nombre || email.remitente_email || '?').charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
      } ${!email.leido ? 'bg-white' : 'bg-gray-50/50'}`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${getAvatarColor(!!email.prospecto_id)}`}
      >
        {initial}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${!email.leido ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
            {email.remitente_nombre || email.remitente_email}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">{formatRelativeDate(email.fecha)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {!email.leido && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
          <span className={`text-sm truncate ${!email.leido ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
            {email.asunto || '(sin asunto)'}
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{email.extracto}</p>

        {/* Badges */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {email.tiene_adjuntos && (
            <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
              <HiOutlinePaperClip className="w-3.5 h-3.5" />
            </span>
          )}
          {email.prospecto_nombre && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/pipeline/${email.prospecto_id}`);
              }}
              className="inline-flex items-center text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors"
            >
              {email.prospecto_nombre}
            </button>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type FilterType = 'todos' | 'no_leidos' | 'con_prospecto';

export default function Inbox() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('todos');
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);

  // Fetch inbox
  const {
    data: inboxData,
    isLoading,
    error,
  } = useQuery<InboxResponse>({
    queryKey: ['gmail', 'inbox'],
    queryFn: async () => {
      const res = await api.get<InboxResponse>('/gmail/inbox');
      return res.data;
    },
    retry: 1,
  });

  // Fetch stats
  const { data: statsData } = useQuery<StatsResponse>({
    queryKey: ['gmail', 'stats'],
    queryFn: async () => {
      const res = await api.get<StatsResponse>('/gmail/inbox/stats');
      return res.data;
    },
    retry: 1,
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/gmail/inbox/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmail'] });
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => api.post('/gmail/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmail'] });
    },
  });

  // Gmail auth
  const handleConnectGmail = async () => {
    try {
      const res = await api.get<GmailAuthResponse>('/gmail/auth');
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      }
    } catch {
      // silently fail
    }
  };

  const emails = inboxData?.data ?? [];
  const stats = statsData?.data;

  // Determine if no gmail accounts linked (401 or empty with specific error)
  const isNoAccounts = !!error;

  // Filter emails
  const filteredEmails = emails.filter((e) => {
    if (filter === 'no_leidos') return !e.leido;
    if (filter === 'con_prospecto') return !!e.prospecto_id;
    return true;
  });

  const handleSelectEmail = (email: GmailEmail) => {
    setSelectedEmail(email);
    if (!email.leido) {
      markReadMutation.mutate(email.id);
    }
  };

  const filterBtnClass = (f: FilterType) =>
    `w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      filter === f
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bandeja de entrada</h1>
            <p className="text-sm text-gray-500 mt-0.5">Emails de Gmail sincronizados con el CRM</p>
          </div>
          {stats && stats.no_leidos > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full">
              {stats.no_leidos > 99 ? '99+' : stats.no_leidos}
            </span>
          )}
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          <HiOutlineRefresh className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>

      {/* No accounts state */}
      {isNoAccounts && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <HiOutlineMail className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Conecta tu cuenta de Gmail
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Para ver tu bandeja de entrada aqui, conecta tu cuenta de Gmail. Los emails se sincronizaran automaticamente con los prospectos del CRM.
            </p>
            <button
              onClick={handleConnectGmail}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <HiOutlineMail className="w-4 h-4" />
              Conectar Gmail
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      {!isNoAccounts && (
        <div className="flex flex-1 gap-4 min-h-0">
          {/* Sidebar filtros */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">
                Filtros
              </p>
              <button onClick={() => setFilter('todos')} className={filterBtnClass('todos')}>
                <span className="flex items-center justify-between">
                  <span>Todos</span>
                  {stats && (
                    <span className="text-xs text-gray-400">{stats.total}</span>
                  )}
                </span>
              </button>
              <button onClick={() => setFilter('no_leidos')} className={filterBtnClass('no_leidos')}>
                <span className="flex items-center justify-between">
                  <span>No leidos</span>
                  {stats && stats.no_leidos > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded-full">{stats.no_leidos}</span>
                  )}
                </span>
              </button>
              <button onClick={() => setFilter('con_prospecto')} className={filterBtnClass('con_prospecto')}>
                <span className="flex items-center justify-between">
                  <span>Con prospecto</span>
                  {stats && (
                    <span className="text-xs text-gray-400">{stats.con_prospecto}</span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Email list + panel */}
          <div className="flex flex-1 min-w-0 gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* List */}
            <div
              className={`flex flex-col border-r border-gray-100 overflow-y-auto ${
                selectedEmail ? 'w-2/5' : 'w-full'
              }`}
            >
              {isLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <EmailSkeleton key={i} />
                  ))}
                </>
              ) : filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-16 px-4">
                  <HiOutlineMailOpen className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">
                    {filter === 'no_leidos'
                      ? 'No hay emails sin leer'
                      : filter === 'con_prospecto'
                      ? 'No hay emails con prospecto asignado'
                      : 'No hay emails en la bandeja'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Haz clic en Sincronizar para actualizar
                  </p>
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    isSelected={selectedEmail?.id === email.id}
                    onClick={() => handleSelectEmail(email)}
                  />
                ))
              )}
            </div>

            {/* Detail panel */}
            {selectedEmail && (
              <div className="flex-1 min-w-0">
                <EmailPanel
                  email={selectedEmail}
                  onClose={() => setSelectedEmail(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
