import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { getAuthUrl, exchangeCode, syncAccount } from '../services/gmail.service';
import { env } from '../config/env';

// ── OAuth: iniciar flujo ───────────────────────────────────────────────────
export async function startOAuth(req: Request, res: Response) {
  try {
    if (!env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ error: 'Google OAuth no configurado. Añade GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET al .env' });
    }
    const userId = (req as any).user.id;
    const url = getAuthUrl(userId);
    return res.json({ url });
  } catch (err) {
    logger.error('Error iniciando OAuth:', err);
    return res.status(500).json({ error: 'Error iniciando OAuth' });
  }
}

// ── OAuth: callback de Google ──────────────────────────────────────────────
export async function oauthCallback(req: Request, res: Response) {
  try {
    const { code, state: userId, error } = req.query as Record<string, string>;

    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/configuracion?gmail_error=${encodeURIComponent(error)}`);
    }
    if (!code || !userId) {
      return res.redirect(`${env.FRONTEND_URL}/configuracion?gmail_error=invalid_callback`);
    }

    const gmailAddress = await exchangeCode(code, userId);
    return res.redirect(`${env.FRONTEND_URL}/configuracion?gmail_ok=${encodeURIComponent(gmailAddress)}`);
  } catch (err: any) {
    logger.error('Error en OAuth callback:', err);
    return res.redirect(`${env.FRONTEND_URL}/configuracion?gmail_error=${encodeURIComponent(err.message)}`);
  }
}

// ── Listar cuentas vinculadas ──────────────────────────────────────────────
export async function getAccounts(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const result = await query(
      'SELECT id, gmail_address, activa, ultima_sync, historial_dias, created_at FROM email_accounts_gmail WHERE user_id = $1 ORDER BY created_at',
      [userId]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('Error listando cuentas Gmail:', err);
    return res.status(500).json({ error: 'Error listando cuentas' });
  }
}

// ── Desconectar cuenta ─────────────────────────────────────────────────────
export async function disconnectAccount(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    await query(
      'UPDATE email_accounts_gmail SET activa = false WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return res.json({ success: true });
  } catch (err) {
    logger.error('Error desconectando cuenta:', err);
    return res.status(500).json({ error: 'Error desconectando' });
  }
}

// ── Sincronizar emails ─────────────────────────────────────────────────────
export async function syncEmails(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { account_id } = req.body;

    let accountIds: string[];

    if (account_id) {
      accountIds = [account_id];
    } else {
      const result = await query(
        'SELECT id FROM email_accounts_gmail WHERE user_id = $1 AND activa = true',
        [userId]
      );
      accountIds = result.rows.map((r: any) => r.id);
    }

    if (!accountIds.length) {
      return res.status(400).json({ error: 'No hay cuentas Gmail vinculadas' });
    }

    const results = await Promise.allSettled(
      accountIds.map(id => syncAccount(id, 50))
    );

    const resumen = results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { accountId: accountIds[i], error: (r as any).reason?.message }
    );

    return res.json({ success: true, data: resumen });
  } catch (err) {
    logger.error('Error sincronizando emails:', err);
    return res.status(500).json({ error: 'Error sincronizando' });
  }
}

// ── Inbox ──────────────────────────────────────────────────────────────────
export async function getInbox(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const offset = (page - 1) * limit;
    const soloNoLeidos = req.query.no_leidos === 'true';
    const prospectId = req.query.prospect_id as string;

    let whereExtra = '';
    const params: any[] = [userId];

    if (soloNoLeidos) {
      whereExtra += ` AND er.leido = false`;
    }
    if (prospectId) {
      params.push(prospectId);
      whereExtra += ` AND er.prospect_id = $${params.length}`;
    }

    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM emails_recibidos er
      JOIN email_accounts_gmail eg ON eg.id = er.account_id
      WHERE eg.user_id = $1 AND er.archivado = false ${whereExtra}
    `, params);

    params.push(limit, offset);
    const result = await query(`
      SELECT er.*, eg.gmail_address,
             p.nombre_negocio as prospect_nombre
      FROM emails_recibidos er
      JOIN email_accounts_gmail eg ON eg.id = er.account_id
      LEFT JOIN prospects p ON p.id = er.prospect_id
      WHERE eg.user_id = $1 AND er.archivado = false ${whereExtra}
      ORDER BY er.recibido_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    return res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      pages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
    });
  } catch (err) {
    logger.error('Error obteniendo inbox:', err);
    return res.status(500).json({ error: 'Error obteniendo inbox' });
  }
}

// ── Hilo de conversación de un prospecto ──────────────────────────────────
export async function getProspectThread(req: Request, res: Response) {
  try {
    const { prospectId } = req.params;
    const userId = (req as any).user.id;

    // Emails recibidos
    const recibidos = await query(`
      SELECT er.id, er.gmail_message_id, er.asunto, er.extracto, er.cuerpo_texto,
             er.de_email, er.de_nombre, er.recibido_at, er.leido, er.tiene_adjuntos,
             er.adjuntos, 'recibido' as direccion
      FROM emails_recibidos er
      JOIN email_accounts_gmail eg ON eg.id = er.account_id
      WHERE er.prospect_id = $1 AND eg.user_id = $2
      ORDER BY er.recibido_at DESC
      LIMIT 50
    `, [prospectId, userId]);

    // Emails enviados (de la tabla existente)
    const enviados = await query(`
      SELECT ee.id, null as gmail_message_id, ee.asunto,
             LEFT(ee.cuerpo_texto, 200) as extracto, ee.cuerpo_texto,
             ea.smtp_user as de_email, 'Yo' as de_nombre,
             ee.enviado_en as recibido_at, true as leido, false as tiene_adjuntos,
             '[]'::jsonb as adjuntos, 'enviado' as direccion
      FROM emails_enviados ee
      LEFT JOIN email_accounts ea ON ea.id = ee.account_id
      WHERE ee.prospect_id = $1
      ORDER BY ee.enviado_en DESC
      LIMIT 50
    `, [prospectId]).catch(() => ({ rows: [] }));

    // Combinar y ordenar por fecha
    const todos = [...recibidos.rows, ...enviados.rows].sort(
      (a: any, b: any) => new Date(b.recibido_at).getTime() - new Date(a.recibido_at).getTime()
    );

    return res.json({ success: true, data: todos });
  } catch (err) {
    logger.error('Error obteniendo hilo:', err);
    return res.status(500).json({ error: 'Error obteniendo conversación' });
  }
}

// ── Marcar como leído ──────────────────────────────────────────────────────
export async function markRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await query('UPDATE emails_recibidos SET leido = true WHERE id = $1', [id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Error' });
  }
}

// ── Unsubscribe público (sin auth) ─────────────────────────────────────────
export async function publicUnsubscribe(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const result = await query(
      'SELECT * FROM email_unsubscribes WHERE token = $1',
      [token]
    );
    if (!result.rows.length) {
      return res.status(404).send('<h1>Enlace no válido</h1>');
    }
    // Marcar como dado de baja (si no lo estaba ya)
    await query(
      'UPDATE email_unsubscribes SET unsubscribed_at = NOW() WHERE token = $1',
      [token]
    );
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><title>Baja confirmada</title>
      <style>body{font-family:sans-serif;max-width:400px;margin:80px auto;text-align:center;color:#374151}</style>
      </head>
      <body>
        <h2>Baja registrada</h2>
        <p>Tu dirección ha sido eliminada de nuestra lista de comunicaciones.</p>
        <p style="color:#9ca3af;font-size:14px">Somos Sinergia · CRM Energía</p>
      </body></html>
    `);
  } catch (err) {
    return res.status(500).send('<h1>Error procesando solicitud</h1>');
  }
}

// ── Stats del inbox ────────────────────────────────────────────────────────
export async function getInboxStats(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const result = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE er.leido = false) as no_leidos,
        COUNT(DISTINCT er.prospect_id) FILTER (WHERE er.prospect_id IS NOT NULL) as prospectos_con_email,
        MAX(er.recibido_at) as ultimo_recibido
      FROM emails_recibidos er
      JOIN email_accounts_gmail eg ON eg.id = er.account_id
      WHERE eg.user_id = $1 AND er.archivado = false
    `, [userId]);

    const accounts = await query(
      'SELECT COUNT(*) as total FROM email_accounts_gmail WHERE user_id = $1 AND activa = true',
      [userId]
    );

    return res.json({
      success: true,
      data: {
        ...result.rows[0],
        cuentas_vinculadas: parseInt(accounts.rows[0].total),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error obteniendo stats' });
  }
}
