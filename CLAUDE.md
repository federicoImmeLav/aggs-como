# CLAUDE.md — Sito Scout AGGS Como

Sito istituzionale per **AGGS Como**. Pubblico target: famiglie. Tono caldo, accessibile.
**Sviluppo completato** — siamo in fase di rifinitura frontend e admin.

---

## Stack — REGOLE ASSOLUTE

- **HTML / CSS / JS vanilla** — nessun framework, nessun bundler, nessun npm
- **Librerie JS** solo via CDN: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`
- **Tutti gli script**: `<script type="module" src="js/...js">`
- **Credenziali** in `js/config.js`: `export const SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Deploy via FTP su hosting condiviso — file statici puri

---

## Struttura file

```
css/base.css · components.css · layout.css
js/supabase-client.js · calendario.js · iscrizione.js · attivita.js · contatti.js · admin.js
index.html · storia.html · calendario.html · iscrizione.html · attivita.html · contatti.html · admin.html
supabase/schema.sql · functions/send-email/index.ts
```

---

## Design system

- Font: **DM Sans** (Google Fonts)
- `--color-primary: #003985` · `--color-accent: #ff751f`
- `--color-bg: #f9f7f4` · `--color-surface: #ffffff` · `--color-text: #1a1a2e`
- Mobile-first, breakpoint `768px`, contrasto AA, focus visibile

---

## Database (Supabase PostgreSQL)

**`attivita`**: id, nome, descrizione, tipo (`uscita_giorno|campo|riunione|evento`), data_inizio, data_fine, quota, unita_target, ha_form_iscrizione, `campi_extra` (jsonb array), immagine_url, attiva

**`soci`**: id, nome, cognome, data_nascita, codice_fiscale, unita (`lupetti|coccinelle|scout|guide|clan|staff`), anno_associativo, email, telefono, telefono_emergenza, nome_genitore, cognome_genitore, consenso_privacy, consenso_foto, note

**`iscrizioni_attivita`**: id, attivita_id (FK), nome, cognome, data_nascita, email_contatto, telefono, nome_genitore, note_mediche, `risposte_extra` (jsonb), stato (`in_attesa|confermato|annullato`), consenso_privacy, note

**`contatti`**: id, email (unique), nome, tipo (`genitore|interessato|ex-scout`), consenso_privacy, attivo

**RLS**: INSERT aperto su soci/iscrizioni_attivita/contatti; SELECT pubblico solo su attivita WHERE attiva=true.

---

## Logiche chiave

**Minorenne** (età < 18): mostra campi nome_genitore/cognome_genitore; email/telefono sono del genitore.

**campi_extra**: array jsonb `[{ id, label, tipo, opzioni?, obbligatorio }]` — tipi: `testo_breve|checkbox|select|data|numero`

**attivita.html**: legge `?id=` dall'URL, fetch da Supabase, popola pagina e form dinamico.

**admin.html**: login con password in sessionStorage; gestisce CRUD attività, costruttore campi_extra, tabella iscrizioni con cambio stato ed export CSV.

**Email**: Edge Function `send-email` triggerata da webhook su INSERT in soci/iscrizioni_attivita → Resend API.

---

## Regole operative

- Modifica solo le parti necessarie, non riscrivere file interi
- Codice sempre completo e funzionante, mai pseudocodice nei file finali
- Ogni form: checkbox `consenso_privacy` obbligatoria + link a `privacy.html`