import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

const STORAGE_KEY = 'crm-agent-chat-v1';
const MAX_MESSAGES = 50;
const HISTORY_WINDOW = 10;

const WELCOME_MESSAGE: ChatMessage = {
  role: 'model',
  content:
    '¡Hola! Soy tu asistente de ventas. Puedo ayudarte con tu pipeline, generar emails, ver estadísticas o preparar briefings de llamada. ¿En qué te ayudo?',
  timestamp: new Date(),
};

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(raw) as Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }>;
    const messages: ChatMessage[] = parsed.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
    return messages.length > 0 ? messages : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: new Date() };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      saveMessages(updated);
      return updated;
    });

    setIsLoading(true);

    try {
      const history = messages
        .slice(-HISTORY_WINDOW)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.post<{ data: { reply: string } }>('/agent/chat', {
        message: trimmed,
        history,
      });

      const reply = res.data?.data?.reply ?? res.data as unknown as string;

      const modelMsg: ChatMessage = {
        role: 'model',
        content: typeof reply === 'string' ? reply : JSON.stringify(reply),
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, modelMsg];
        saveMessages(updated);
        return updated;
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const serverMsg = axiosErr?.response?.data?.message;
      const errorMsg: ChatMessage = {
        role: 'model',
        content:
          serverMsg ||
          'Error al conectar con el asistente. ¿Está el servidor iniciado?',
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const updated = [...prev, errorMsg];
        saveMessages(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearChat = useCallback(() => {
    const fresh = [{ ...WELCOME_MESSAGE, timestamp: new Date() }];
    setMessages(fresh);
    saveMessages(fresh);
  }, []);

  return { messages, sendMessage, isLoading, clearChat };
}
