import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY          = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL            = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

// ────────────────────────────────────────────────────────────
// Email: iscrizione anno associativo (tabella soci)
// ────────────────────────────────────────────────────────────

function sociEmail(record: Record<string, unknown>): { subject: string; html: string; text: string } {
  const nome           = `${record.nome} ${record.cognome}`;
  const unita          = capitalize(String(record.unita ?? ''));
  const anno           = String(record.anno_associativo ?? '');
  const genitore       = record.nome_genitore
    ? `${record.nome_genitore} ${record.cognome_genitore ?? ''}`.trim()
    : null;
  const destinatario   = genitore ? `Caro/a ${genitore},` : `Caro/a ${record.nome},`;
  const subject        = `Conferma iscrizione ${anno} — AGGS Como`;

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f9f7f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);max-width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#003985;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.3px;">AGGS Como</p>
            <p style="margin:8px 0 0;color:#a8c4e8;font-size:14px;">Associazione Guide e Scout Como</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#1a1a2e;">
              ${destinatario}
            </p>
            <p style="margin:0 0 16px;font-size:16px;color:#1a1a2e;line-height:1.6;">
              Siamo felici di confermarti l'iscrizione di <strong>${nome}</strong> per l'anno associativo <strong>${anno}</strong>.
            </p>

            <!-- Riepilogo -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8eef7;border-radius:8px;margin:24px 0;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#003985;text-transform:uppercase;letter-spacing:0.8px;">Riepilogo iscrizione</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;width:140px;">Scout/Guida</td>
                      <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:500;">${nome}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;">Unità</td>
                      <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:500;">${unita}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;">Anno associativo</td>
                      <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:500;">${anno}</td>
                    </tr>
                    ${genitore ? `
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;">Genitore</td>
                      <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:500;">${genitore}</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:16px;color:#1a1a2e;line-height:1.6;">
              I capi dell'unità ti contatteranno presto con tutte le informazioni sulle prossime attività.
            </p>
            <p style="margin:0;font-size:16px;color:#1a1a2e;line-height:1.6;">
              Buona caccia e buona strada! 🏕️
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid #e2e4e9;margin:0;">
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#6b7280;">
              AGGS Como — <a href="mailto:aggscomo@gmail.com" style="color:#003985;text-decoration:none;">aggscomo@gmail.com</a>
            </p>
            <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">
              Hai ricevuto questa email perché hai effettuato un'iscrizione tramite il sito AGGS Como.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${destinatario}

Siamo felici di confermarti l'iscrizione di ${nome} per l'anno associativo ${anno}.

RIEPILOGO ISCRIZIONE
Scout/Guida: ${nome}
Unità: ${unita}
Anno associativo: ${anno}${genitore ? `\nGenitore: ${genitore}` : ''}

I capi dell'unità ti contatteranno presto con tutte le informazioni sulle prossime attività.

Buona caccia e buona strada!

AGGS Como
aggscomo@gmail.com`;

  return { subject, html, text };
}

// ────────────────────────────────────────────────────────────
// Email: iscrizione attività (tabella iscrizioni_attivita)
// ────────────────────────────────────────────────────────────

function attivitaEmail(
  record: Record<string, unknown>,
  nomeAttivita: string,
  dataAttivita: string,
): { subject: string; html: string; text: string } {
  const nome         = `${record.nome} ${record.cognome}`;
  const genitore     = record.nome_genitore ? String(record.nome_genitore) : null;
  const destinatario = genitore ? `Caro/a ${genitore},` : `Caro/a ${record.nome},`;
  const subject      = `Conferma iscrizione: ${nomeAttivita} — AGGS Como`;

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f9f7f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);max-width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#003985;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.3px;">AGGS Como</p>
            <p style="margin:8px 0 0;color:#a8c4e8;font-size:14px;">Associazione Guide e Scout Como</p>
          </td>
        </tr>

        <!-- Accent bar -->
        <tr>
          <td style="background:#ff751f;padding:12px 40px;">
            <p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;">Iscrizione attività confermata ✓</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#1a1a2e;">
              ${destinatario}
            </p>
            <p style="margin:0 0 16px;font-size:16px;color:#1a1a2e;line-height:1.6;">
              Abbiamo ricevuto l'iscrizione di <strong>${nome}</strong> all'attività <strong>${nomeAttivita}</strong>${dataAttivita ? ` del <strong>${dataAttivita}</strong>` : ''}.
            </p>

            <!-- Riepilogo -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8eef7;border-radius:8px;margin:24px 0;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#003985;text-transform:uppercase;letter-spacing:0.8px;">Riepilogo iscrizione</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;width:140px;">Partecipante</td>
                      <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:500;">${nome}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;">Attività</td>
                      <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:500;">${nomeAttivita}</td>
                    </tr>
                    ${dataAttivita ? `
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;">Data</td>
                      <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:500;">${dataAttivita}</td>
                    </tr>` : ''}
                    ${genitore ? `
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;">Genitore</td>
                      <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:500;">${genitore}</td>
                    </tr>` : ''}
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;">Stato</td>
                      <td style="padding:6px 0;font-size:14px;color:#1a1a2e;">
                        <span style="background:#fff3e0;color:#e05e0a;padding:2px 10px;border-radius:20px;font-size:13px;font-weight:600;">In attesa di conferma</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:16px;color:#1a1a2e;line-height:1.6;">
              L'iscrizione è attualmente <strong>in attesa di conferma</strong>. Riceverai una comunicazione dai capi appena verrà processata.
            </p>
            <p style="margin:0;font-size:16px;color:#1a1a2e;line-height:1.6;">
              Per qualsiasi domanda puoi scriverci a <a href="mailto:aggscomo@gmail.com" style="color:#003985;">aggscomo@gmail.com</a>.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid #e2e4e9;margin:0;">
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#6b7280;">
              AGGS Como — <a href="mailto:aggscomo@gmail.com" style="color:#003985;text-decoration:none;">aggscomo@gmail.com</a>
            </p>
            <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">
              Hai ricevuto questa email perché hai effettuato un'iscrizione tramite il sito AGGS Como.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${destinatario}

Abbiamo ricevuto l'iscrizione di ${nome} all'attività "${nomeAttivita}"${dataAttivita ? ` del ${dataAttivita}` : ''}.

RIEPILOGO ISCRIZIONE
Partecipante: ${nome}
Attività: ${nomeAttivita}${dataAttivita ? `\nData: ${dataAttivita}` : ''}${genitore ? `\nGenitore: ${genitore}` : ''}
Stato: In attesa di conferma

L'iscrizione è attualmente in attesa di conferma. Riceverai una comunicazione dai capi appena verrà processata.

Per qualsiasi domanda puoi scriverci a aggscomo@gmail.com.

AGGS Como
aggscomo@gmail.com`;

  return { subject, html, text };
}

// ────────────────────────────────────────────────────────────
// Handler principale
// ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Supabase webhook invia sempre POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: { type: string; table: string; record: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { type, table, record } = payload;

  // Gestiamo solo INSERT
  if (type !== 'INSERT') {
    return new Response(JSON.stringify({ skipped: true, reason: 'not INSERT' }), { status: 200 });
  }

  let to: string;
  let emailPayload: { subject: string; html: string; text: string };

  if (table === 'soci') {
    to = String(record.email ?? '');
    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing email in soci record' }), { status: 400 });
    }
    emailPayload = sociEmail(record);

  } else if (table === 'iscrizioni_attivita') {
    to = String(record.email_contatto ?? '');
    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing email_contatto in iscrizioni_attivita record' }), { status: 400 });
    }

    // Fetch dati attività per subject e corpo email
    let nomeAttivita = 'attività';
    let dataAttivita = '';

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && record.attivita_id) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data } = await supabase
          .from('attivita')
          .select('nome, data_inizio, data_fine')
          .eq('id', record.attivita_id)
          .single();

        if (data) {
          nomeAttivita = data.nome;
          dataAttivita = formatDate(data.data_inizio as string);
          if (data.data_fine && data.data_fine !== data.data_inizio) {
            dataAttivita += ` – ${formatDate(data.data_fine as string)}`;
          }
        }
      } catch (err) {
        console.error('Supabase fetch error:', err);
        // Non bloccare: inviamo l'email con info generiche
      }
    }

    emailPayload = attivitaEmail(record, nomeAttivita, dataAttivita);

  } else {
    // Tabella non gestita (es. contatti — nessuna email di conferma necessaria)
    return new Response(JSON.stringify({ skipped: true, reason: `table ${table} not handled` }), { status: 200 });
  }

  // Invio tramite Resend
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 });
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AGGS Como <onboarding@resend.dev>',
      to: [to],
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    console.error('Resend error:', errText);
    return new Response(JSON.stringify({ error: errText }), { status: 500 });
  }

  const resendData = await resendRes.json() as { id: string };
  console.log(`Email sent to ${to}, Resend id: ${resendData.id}`);

  return new Response(
    JSON.stringify({ success: true, emailId: resendData.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
