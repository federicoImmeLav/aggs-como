import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SHEET_ID = Deno.env.get('GOOGLE_SHEET_ID')!;
const SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!;
const PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')!.replace(/\\n/g, '\n');

async function getGoogleAccessToken(): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const headerB64 = encode(header);
  const claimB64 = encode(claim);
  const signingInput = `${headerB64}.${claimB64}`;

  const pemContents = PRIVATE_KEY
    .replace('-----BEGIN RSA PRIVATE KEY-----', '')
    .replace('-----END RSA PRIVATE KEY-----', '')
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signingInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signingInput}.${signatureB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function getExistingEmails(token: string): Promise<string[]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!data.values) return [];
  return data.values.flat().map((e: string) => e.toLowerCase().trim());
}

async function appendRow(token: string, row: string[]): Promise<void> {
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A:F:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { table, record } = payload;

    let email: string;
    let nome: string;
    let cognome: string;
    let unita: string;
    let fonte: string;

    if (table === 'soci') {
      email = record.email?.toLowerCase().trim();
      nome = record.nome ?? '';
      cognome = record.cognome ?? '';
      unita = record.unita ?? '';
      fonte = 'socio';
    } else if (table === 'contatti') {
      email = record.email?.toLowerCase().trim();
      nome = record.nome ?? '';
      cognome = record.cognome ?? '';
      unita = record.unita ?? '';
      fonte = 'newsletter';
    } else {
      return new Response('Tabella non gestita', { status: 200 });
    }

    if (!email) {
      return new Response('Email mancante', { status: 200 });
    }

    const token = await getGoogleAccessToken();
    const existingEmails = await getExistingEmails(token);

    if (existingEmails.includes(email)) {
      console.log(`Email già presente: ${email}`);
      return new Response('Duplicato ignorato', { status: 200 });
    }

    const dataAggiunta = new Date().toISOString().split('T')[0];
    await appendRow(token, [email, nome, cognome, unita, fonte, dataAggiunta]);

    console.log(`Aggiunto: ${email} (${fonte})`);
    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error(err);
    return new Response('Errore interno', { status: 500 });
  }
});
