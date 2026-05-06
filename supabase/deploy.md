# Deploy Edge Function — AGGS Como

## Prerequisiti

- Supabase CLI installato: `npm install -g supabase`
- Account Resend con API key (resend.com)

---

## 1. Login e link al progetto

```bash
supabase login
supabase link --project-ref <TUO_PROJECT_REF>
```

Il `project-ref` si trova in Supabase → Settings → General → Reference ID.

---

## 2. Configurare i secret

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx
```

Le variabili `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sono iniettate automaticamente
da Supabase nell'ambiente della Edge Function — non serve configurarle.

---

## 3. Deploy della funzione

```bash
supabase functions deploy send-email --no-verify-jwt
```

`--no-verify-jwt` è necessario perché la funzione è chiamata dal webhook di Supabase
(non da un utente autenticato).

---

## 4. Configurare il Database Webhook su Supabase

Vai su **Supabase Dashboard → Database → Webhooks → Create a new hook**.

### Webhook 1 — Iscrizione anno associativo

| Campo        | Valore                                                       |
|-------------|--------------------------------------------------------------|
| Name         | `on_insert_soci`                                             |
| Table        | `soci`                                                       |
| Events       | `INSERT`                                                     |
| Type         | Supabase Edge Functions                                      |
| Edge Function| `send-email`                                                 |

### Webhook 2 — Iscrizione attività

| Campo        | Valore                                                       |
|-------------|--------------------------------------------------------------|
| Name         | `on_insert_iscrizione_attivita`                             |
| Table        | `iscrizioni_attivita`                                        |
| Events       | `INSERT`                                                     |
| Type         | Supabase Edge Functions                                      |
| Edge Function| `send-email`                                                 |

---

## 5. Test locale (opzionale)

```bash
supabase functions serve send-email --env-file .env.local
```

File `.env.local` (NON committare):
```
RESEND_API_KEY=re_xxxxxxxxxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Payload di test per `soci`:
```bash
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "soci",
    "schema": "public",
    "record": {
      "nome": "Marco",
      "cognome": "Rossi",
      "email": "tua@email.com",
      "unita": "scout",
      "anno_associativo": "2025-2026",
      "nome_genitore": "Giovanni",
      "cognome_genitore": "Rossi"
    }
  }'
```

Payload di test per `iscrizioni_attivita`:
```bash
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "iscrizioni_attivita",
    "schema": "public",
    "record": {
      "nome": "Marco",
      "cognome": "Rossi",
      "email_contatto": "tua@email.com",
      "attivita_id": "<UUID_ATTIVITA>"
    }
  }'
```

---

## 6. Note Resend (piano free)

- **Senza dominio verificato:** le email arrivano solo all'indirizzo registrato su Resend.
- **Con dominio verificato:** aggiornare il mittente in `index.ts`:
  ```
  from: 'AGGS Como <noreply@aggscomo.it>'
  ```
- Limite piano free: 3.000 email/mese, 100/giorno.
