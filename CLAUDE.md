# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sito istituzionale per **AGGS Como**. Pubblico target: famiglie. Tono caldo, accessibile.

---

## Stack — REGOLE ASSOLUTE

- **HTML / CSS / JS vanilla** — nessun framework, nessun bundler, nessun npm
- **Librerie JS** solo via CDN: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`
- **Tutti gli script**: `<script type="module" src="js/...js">`
- **Credenziali** in `js/config.js`: `export const SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Deploy frontend via FTP su hosting condiviso — file statici puri

---

## Comandi operativi

```bash
# Deploy Edge Function (dopo ogni modifica a supabase/functions/send-email/index.ts)
supabase functions deploy send-email --project-ref bdwragqrgfkqlupitouw

# Eseguire migrazioni DB: incollare l'ALTER TABLE nel Supabase SQL Editor
# Dashboard: https://supabase.com/dashboard/project/bdwragqrgfkqlupitouw
```

---

## Struttura file

```
css/base.css · components.css · layout.css
js/config.js · supabase-client.js · home.js · calendario.js
   iscrizione.js · attivita.js · contatti.js · admin.js · components.js
index.html · storia.html · calendario.html · iscrizione.html
attivita.html · contatti.html · admin.html
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

**`attivita`**: id, nome, descrizione, tipo (`uscita_giorno|campo|riunione|evento`), data_inizio, data_fine, quota, unita_target, ha_form_iscrizione, nota_iscrizioni, `campi_extra` (jsonb array), `documenti` (jsonb array), immagine_url, attiva

**`soci`**: id, nome, cognome, data_nascita, luogo_nascita, codice_fiscale, classe_frequentata, unita (`lupetti|coccinelle|scout|guide`), anno_associativo, email, telefono, telefono_emergenza, nome_genitore, cognome_genitore, codice_fiscale_genitore, indirizzo_via, indirizzo_citta, indirizzo_cap, iscrizione_mailing_list, consenso_privacy, consenso_foto, note

**`iscrizioni_attivita`**: id, attivita_id (FK), nome, cognome, data_nascita, email_contatto, telefono, nome_genitore, note_mediche, `risposte_extra` (jsonb), stato (`in_attesa|confermato|annullato`), consenso_privacy, note

**`contatti`**: id, email (unique), nome, cognome, nome_ragazzo, consenso_privacy, attivo

**`avvisi`**: id, titolo, testo, tipo (`info|importante|urgente`), attivo, data_scadenza

**`impostazioni`**: chiave (PK), valore — chiave `iscrizioni_aperte` controlla visibilità form iscrizione

**RLS**: INSERT aperto su soci/iscrizioni_attivita/contatti; SELECT pubblico solo su attivita WHERE attiva=true; avvisi e impostazioni SELECT pubblico.

---

## Logiche chiave

**Minorenne** (età < 18 in `iscrizione.js`): mostra la sezione genitore con nome, cognome, codice_fiscale_genitore e indirizzo; email/telefono sono del genitore.

**campi_extra**: array jsonb `[{ id, label, tipo, opzioni?, obbligatorio }]` — tipi: `testo_breve|checkbox|select|data|numero`. Costruito nell'admin, salvato in `attivita.campi_extra`, risposto in `iscrizioni_attivita.risposte_extra`.

**attivita.html**: legge `?id=` dall'URL, fetch da Supabase, popola pagina e costruisce il form dinamicamente dai `campi_extra`.

**admin.html**: login con password in `sessionStorage` (no Supabase Auth); gestisce CRUD attività, costruttore campi_extra, tabella iscrizioni con cambio stato ed export CSV.

**home.js**: carica le prossime 3 attività (`data_inizio >= oggi`) e gli avvisi attivi. Controlla anche il banner 5×1000 con dismiss in sessionStorage.

---

## Edge Function `send-email`

Triggerata da webhook Supabase su INSERT in `soci` e `iscrizioni_attivita`.

**Due PDF distinti**:
- `generateIscrizionePDF` — per INSERT in `soci`: modulo tesseramento annuale con dati ragazzo (nome+CF), dati genitore (nome+CF), reparto, contatti, dichiarazioni e bonifico bancario.
- `generateCampoPDF` — per INSERT in `iscrizioni_attivita` **solo se l'attività è di tipo `campo`**: modulo partecipazione minori con CF ragazzo e genitore letti da `risposte_extra`.

Per attività non-campo, viene inviata solo l'email HTML senza allegato PDF.

L'email è inviata tramite **Resend API** (piano free: 3.000 email/mese).

---

## Regole operative

- Modifica solo le parti necessarie, non riscrivere file interi
- Ogni form: checkbox `consenso_privacy` obbligatoria + link a `privacy.html`
- Dopo modifiche allo schema `soci` o `iscrizioni_attivita`: aggiornare anche `generateIscrizionePDF` / `generateCampoPDF` e rideployare la Edge Function
