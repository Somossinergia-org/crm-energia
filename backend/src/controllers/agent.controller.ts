import { Request, Response } from 'express';
import { chat, ChatMessage } from '../services/agent.service';
import { logger } from '../utils/logger';
import { query } from '../config/database';

export async function agentChat(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.rol;
    const { message, history = [] } = req.body as { message: string; history: ChatMessage[] };

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Limitar historial a últimos 20 mensajes
    const trimmedHistory = (history as ChatMessage[]).slice(-20);

    const response = await chat(userId, userRole, message.trim(), trimmedHistory);

    // Log en agent_logs
    await query(`
      INSERT INTO agent_logs (user_id, accion, input, output, estado)
      VALUES ($1, 'chat', $2, $3, 'ok')
    `, [
      userId,
      JSON.stringify({ message: message.trim(), history_length: trimmedHistory.length }),
      JSON.stringify({ actions: response.actions_taken }),
    ]).catch(() => {});

    return res.json({ success: true, data: response });
  } catch (err: any) {
    logger.error('Error en agent chat:', err);
    return res.status(500).json({ error: 'Error procesando mensaje', details: err.message });
  }
}

export async function getAgentLogs(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const result = await query(`
      SELECT * FROM agent_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50
    `, [userId]);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Error obteniendo logs' });
  }
}
