import { google } from 'googleapis';
import { env } from '../config/env';
import { query } from '../config/database';
import { logger } from '../utils/logger';

// ── OAuth2 Client ──────────────────────────────────────────────────────────
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(userId: string): string {
  const oauth2 = createOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: userId,
  });
}

export async function exchangeCode(code: string, userId: string): Promise<string> {
  const oauth2 = createOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);

  // Obtener email de la cuenta
  const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
  const userInfo = await oauth2Api.userinfo.get();
  const gmailAddress = userInfo.data.email!;

  // Guardar en BD
  await query(`
    INSERT INTO email_accounts_gmail (user_id, gmail_address, access_token, refresh_token, token_expiry, activa)
    VALUES ($1, $2, $3, $4, $5, true)
    ON CONFLICT (user_id, gmail_address) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, email_accounts_gmail.refresh_token),
      token_expiry = EXCLUDED.token_expiry,
      activa = true
  `, [
    userId,
    gmailAddress,
    tokens.access_token,
    tokens.refresh_token,
    tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  ]);

  return gmailAddress;
}

async function getClientForAccount(accountId: string) {
  const result = await query(
    'SELECT * FROM email_accounts_gmail WHERE id = $1 AND activa = true',
    [accountId]
  );
  if (!result.rows.length) throw new Error('Cuenta Gmail no encontrada');

  const account = result.rows[0];
  const oauth2 = createOAuth2Client();
  oauth2.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.token_expiry ? new Date(account.token_expiry).getTime() : undefined,
  });

  // Refresh automático
  (oauth2 as any).on('tokens', async (tokens: any) => {
    if (tokens.access_token) {
      await query(
        'UPDATE email_accounts_gmail SET access_token = $1, token_expiry = $2 WHERE id = $3',
        [tokens.access_token, tokens.expiry_date ? new Date(tokens.expiry_date) : null, accountId]
      );
    }
  });

  return oauth2;
}

// ── Extraer texto de partes MIME ───────────────────────────────────────────
function extractBody(payload: any): { texto: string; html: string } {
  let texto = '';
  let html = '';

  function walk(part: any) {
    if (!part) return;
    if (part.mimeType === 'text/plain' && part.body?.data) {
      texto = Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      html = Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.parts) {
      part.parts.forEach(walk);
    }
  }

  walk(payload);
  return { texto, html };
}

function extractAttachments(payload: any): any[] {
  const attachments: any[] = [];
  function walk(part: any) {
    if (!part) return;
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        attachmentId: part.body.attachmentId,
        size: part.body.size,
      });
    }
    if (part.parts) part.parts.forEach(walk);
  }
  walk(payload);
  return attachments;
}

// ── Sync de emails ─────────────────────────────────────────────────────────
export interface SyncResult {
  nuevos: number;
  errores: number;
  accountId: string;
  gmailAddress: string;
}

export async function syncAccount(accountId: string, maxResults = 50): Promise<SyncResult> {
  const auth = await getClientForAccount(accountId);
  const gmail = google.gmail({ version: 'v1', auth });

  const accountResult = await query('SELECT * FROM email_accounts_gmail WHERE id = $1', [accountId]);
  const account = accountResult.rows[0];

  // Buscar emails recientes
  const diasAtras = account.historial_dias || 30;
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: `newer_than:${diasAtras}d -from:me`,
    maxResults,
  });

  const messages = listRes.data.messages || [];
  let nuevos = 0;
  let errores = 0;

  // Obtener IDs ya procesados
  const existentes = await query(
    'SELECT gmail_message_id FROM emails_recibidos WHERE account_id = $1',
    [accountId]
  );
  const existentesSet = new Set(existentes.rows.map((r: any) => r.gmail_message_id));

  for (const msg of messages) {
    if (!msg.id || existentesSet.has(msg.id)) continue;

    try {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = full.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const fromRaw = getHeader('From');
      const fromMatch = fromRaw.match(/^(?:"?(.+?)"?\s)?<?([^>]+)>?$/);
      const deNombre = fromMatch?.[1]?.replace(/"/g, '').trim() || '';
      const deEmail = fromMatch?.[2]?.trim() || fromRaw;

      const asunto = getHeader('Subject');
      const dateStr = getHeader('Date');
      const recibidoAt = dateStr ? new Date(dateStr) : new Date();

      const { texto, html } = extractBody(full.data.payload);
      const adjuntos = extractAttachments(full.data.payload);
      const extracto = texto.slice(0, 300).replace(/\n+/g, ' ').trim();

      // Intentar asociar a un prospecto por email
      const prospectResult = await query(
        'SELECT id FROM prospects WHERE email_principal = $1 OR email_secundario = $1 LIMIT 1',
        [deEmail]
      );
      const prospectId = prospectResult.rows[0]?.id || null;

      await query(`
        INSERT INTO emails_recibidos (
          account_id, prospect_id, gmail_message_id, gmail_thread_id,
          de_email, de_nombre, asunto, extracto, cuerpo_texto, cuerpo_html,
          tiene_adjuntos, adjuntos, leido, recibido_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (account_id, gmail_message_id) DO NOTHING
      `, [
        accountId, prospectId, msg.id, full.data.threadId,
        deEmail, deNombre, asunto, extracto, texto, html,
        adjuntos.length > 0, JSON.stringify(adjuntos),
        (full.data.labelIds || []).includes('UNREAD') === false,
        recibidoAt,
      ]);

      nuevos++;
      // Pequeña pausa anti rate-limit
      await new Promise(r => setTimeout(r, 100));
    } catch (e: any) {
      logger.warn(`Error procesando email ${msg.id}: ${e.message}`);
      errores++;
    }
  }

  // Actualizar última sync
  await query('UPDATE email_accounts_gmail SET ultima_sync = NOW() WHERE id = $1', [accountId]);

  return { nuevos, errores, accountId, gmailAddress: account.gmail_address };
}

// ── Enviar email via Gmail API ─────────────────────────────────────────────
export async function sendViaGmail(
  accountId: string,
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<string> {
  const auth = await getClientForAccount(accountId);
  const gmail = google.gmail({ version: 'v1', auth });

  const accountResult = await query('SELECT gmail_address FROM email_accounts_gmail WHERE id = $1', [accountId]);
  const from = accountResult.rows[0]?.gmail_address;

  const boundary = `boundary_${Date.now()}`;
  const mime = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    '',
    textBody || htmlBody.replace(/<[^>]+>/g, ''),
    '',
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    '',
    htmlBody,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  const encoded = Buffer.from(mime).toString('base64url');
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  });

  return res.data.id || '';
}

// ── Marcar como leído ──────────────────────────────────────────────────────
export async function markAsRead(accountId: string, gmailMessageId: string): Promise<void> {
  const auth = await getClientForAccount(accountId);
  const gmail = google.gmail({ version: 'v1', auth });
  await gmail.users.messages.modify({
    userId: 'me',
    id: gmailMessageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
}
