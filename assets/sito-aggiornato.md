# Stato del Sito — AGGS Como
**Data aggiornamento:** 08 maggio 2026  
**Progetto:** Sito istituzionale Associazione Guide e Scout Como  
**Repository locale:** `C:\Users\pozzi\OneDrive - IMMAGINAZIONE E LAVORO\Desktop\aggs-como`  
**Status generale:** Funzionante — rifinitura frontend e pannello admin in corso

---

## Stack tecnico

- **HTML / CSS / JS vanilla** — nessun framework, nessun bundler, nessun npm
- **Librerie JS** solo via CDN ESM: `@supabase/supabase-js@2` via `https://esm.sh/`
- **Script sempre**: `<script type="module" src="js/...js">`
- **Credenziali** in `js/config.js`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- **Deploy:** FTP su hosting condiviso — file statici puri

---

## Struttura file completa

```
aggs-como/
├── CLAUDE.md                         Istruzioni progetto per Claude Code
├── index.html                        Home page
├── storia.html                       Chi siamo — storia, valori, galleria
├── calendario.html                   Calendario attività con filtri e vista mese
├── attivita.html                     Dettaglio singola attività + form iscrizione dinamico
├── iscrizione.html                   Form iscrizione anno associativo
├── contatti.html                     Contatti, newsletter, mappa, FAQ
├── admin.html                        Pannello amministrativo (CRUD + impostazioni)
│
├── css/
│   ├── base.css                      Reset, variabili CSS, classi utilità
│   ├── components.css                Bottoni, card, badge, form, modal, alert
│   └── layout.css                   Header, footer, hero, sezioni, grid
│
├── js/
│   ├── config.js                     Credenziali Supabase (URL, ANON KEY, SERVICE KEY)
│   ├── components.js                 Header, footer, skip-link, toast, impostazioni globali
│   ├── home.js                       Carica preview attività e avvisi in home
│   ├── calendario.js                 Lista/griglia attività con filtri e navigazione mese
│   ├── attivita.js                   Pagina dettaglio + form iscrizione dinamico
│   ├── iscrizione.js                 Form iscrizione anno associativo con logica minorenne
│   ├── contatti.js                   Form newsletter / mailing list
│   ├── gallery.js                    Lightbox per foto in storia.html
│   └── admin.js                      Pannello admin: CRUD attività/avvisi/iscrizioni
│
├── assets/
│   ├── logo.svg                      Logo AGGS Como
│   ├── IMG_*.webp                    Foto scout (WebP ottimizzate)
│   ├── _CLP*.webp                    Foto eventi (WebP)
│   ├── campo2015_09.webp             Campo scout 2015
│   ├── PRIVACY.pdf                   Privacy Policy
│   └── sito-aggiornato.md           Questo file
│
└── supabase/
    ├── schema.sql                    Schema PostgreSQL completo
    ├── deploy.md                     Istruzioni deploy Edge Function
    └── functions/
        └── send-email/
            └── index.ts             Edge Function Deno — invio email via Resend
```

---

## Design system

**Font:** DM Sans (Google Fonts)

**Colori (variabili CSS):**
```css
--color-primary: #003985       /* Blu scout */
--color-primary-dark: #002660
--color-primary-light: #e8eef7
--color-accent: #ff751f        /* Arancione CTA */
--color-accent-dark: #e05e0a
--color-bg: #f9f7f4            /* Beige chiaro sfondo pagina */
--color-surface: #ffffff       /* Bianco card/form */
--color-text: #1a1a2e
--color-text-muted: #6b7280
--color-border: #e2e4e9
--color-success: #2d7a47
--color-error: #c0392b
```

**Spaziature:** `--space-xs` (4px) → `--space-2xl` (48px)  
**Border radius:** `--radius-sm` 6px · `--radius-md` 12px · `--radius-lg` 20px  
**Breakpoint mobile-first:** 768px  
**Accessibilità:** WCAG AA — skip-link, focus-visible, semantic HTML, ARIA labels

---

## Pagine HTML — funzionalità

### `index.html` — Home Page
- **Hero:** tagline + CTA "Iscriviti" e "Vedi attività"
- **Chi siamo sintetico:** card Lupetti/Coccinelle e Scout/Guide
- **Perché scegliere gli scout:** 3 punti (Natura, Valori, Crescita)
- **Avvisi:** sezione dinamica, nascosta se non ci sono avvisi attivi
- **Prossime attività:** preview 3 attività future (card grid da Supabase)
- **CTA iscrizione finale**
- **Script:** `components.js` + `home.js`

---

### `storia.html` — Chi siamo
- Storia dell'associazione + blockquote Baden-Powell
- 6 card valori (Natura, Comunità, Crescita, Responsabilità, Avventura, Gioia)
- 2 card reparti: Lupetti/Coccinelle 8-11 anni, Scout/Guide 11-16 anni
- Galleria 9 foto WebP con lightbox (nav prev/next, ESC, frecce tastiera)
- Sezione "I nostri capi" con link contatti
- **Script:** `components.js` + `gallery.js`

---

### `calendario.html` — Calendario Attività
- Filtri per tipo: pill buttons (Tutti / Uscite / Campi / Riunioni / Eventi)
- Toggle vista **Lista** (card orizzontali) / **Griglia** (calendario mensile)
- **Vista Lista:** card con badge tipo, data, quota, descrizione troncata, bottone dettagli
- **Vista Griglia:** griglia 7 colonne Lun-Dom, navigazione mese, pallini evento con titolo
- Fetch da Supabase: `attivita` WHERE `attiva=true` AND `data_inizio >= oggi`
- **Script:** `components.js` + `calendario.js`

---

### `attivita.html` — Dettaglio Attività + Form Iscrizione
- Legge `?id=<uuid>` dall'URL
- Pagina popolata dinamicamente: breadcrumb, badge tipo, h1, meta info (data, quota, unita_target), immagine, descrizione, documenti scaricabili
- **Form iscrizione ha 3 modalità:**
  1. **Form standard** (default): nome, cognome, data_nascita, email, telefono; sezione genitore mostrata se minorenne; note mediche (solo per campi/multi-day); campi extra (jsonb dinamici); consenso privacy
  2. **Form campo minori** (`tipo_modulo='campo_minori'`): dati ragazzo, dati genitore completi (3 telefoni, indirizzo), 3 dichiarazioni checkbox, consenso privacy
  3. **Nota iscrizioni** (`ha_form_iscrizione=false`): alert info con testo `nota_iscrizioni`
- Logica minorenne: listener su `#data_nascita` change → mostra/nasconde sezione genitore
- Campi extra: tipi `testo_breve | numero | data | checkbox | select`
- Submit: INSERT in `iscrizioni_attivita` → success message
- **Script:** `components.js` + `attivita.js`

---

### `iscrizione.html` — Iscrizione Anno Associativo
Form a 7 sezioni per INSERT in tabella `soci`:

1. **Dati ragazzo/a:** cognome, nome, luogo_nascita, data_nascita, codice_fiscale, classe_frequentata, unità (coccinelle/lupetti/guide/scout/clan), anno_associativo (dropdown calcolato)
2. **Dati genitore** (solo se minorenne): nome, cognome, città, CAP, via — mostrato on-change di data_nascita
3. **Contatti:** telefono, email (label dinamico se minorenne: "Telefono del genitore"), cellulare emergenza
4. **Note aggiuntive:** textarea allergie/esigenze
5. **Quota associativa:** info box statico (Nuova €110 / Rinnovo €50)
6. **Dichiarazioni:** tesseramento*, esonero*, mailing list, privacy GDPR*, consenso foto
7. **Causale bonifico:** IBAN Credit Agricole + causale generata dinamicamente da nome/cognome/anno ("Mario Rossi – ACCONTO Tesseramento associativa anno 2025-2026")

- **Script:** `components.js` + `iscrizione.js`

---

### `contatti.html` — Contatti + Newsletter + Mappa
- Layout 2 colonne (desktop): info contatti + form newsletter
- **Colonna sinistra:** email, sede con link Maps, CTA iscrizione
- **Colonna destra:** form mailing list (nome, cognome, nome_ragazzo opzionale, email, privacy) → INSERT in `contatti`; gestisce errore email duplicata (code 23505)
- **Google Maps embed:** Via Monte Rosa 5, Bulgorello (CO) — Oratorio Santi Pietro e Paolo
- **FAQ accordion:** 5 domande frequenti (età, costi, inverno, esigenze, diventare capo)
- **Script:** `components.js` + `contatti.js`

---

### `admin.html` — Pannello Amministrativo
**Accesso:** login con password hardcoded `LupiCocci` in `admin.js`; session storage `aggs_admin_ok=1`

**4 tab:**

**Tab Attività:**
- Tabella CRUD: nome, tipo badge, data, quota, stato form, attiva/disattiva
- Azioni per riga: Modifica | Apri/Chiudi iscrizioni | Attiva/Disattiva
- Modal nuova/modifica attività con:
  - Dati base (nome, tipo, quote, date, immagine URL)
  - Checkbox "Ha form iscrizione" + nota iscrizioni
  - Tipo modulo speciale (es. `campo_minori`)
  - Documenti scaricabili: upload PDF in Supabase Storage (`documenti-attivita` bucket)
  - Costruttore campi extra: UI add/remove domande (label, tipo, opzioni, obbligatorio)

**Tab Iscrizioni:**
- Dropdown seleziona attività → mostra tabella iscrizioni con nome, email, data, stato
- Bottone cambio stato: `in_attesa` → `confermato` → `annullato`
- TODO: export CSV non ancora implementato

**Tab Avvisi:**
- CRUD avvisi: titolo, testo, tipo (info/importante/urgente), data scadenza, attivo
- Modal nuovo/modifica + bottone elimina

**Tab Impostazioni:**
- Toggle "Iscrizioni anno associativo": aperte/chiuse
- Aggiorna `impostazioni` WHERE `chiave='iscrizioni_aperte'`
- Effetto globale: `components.js` nasconde tutti i bottoni "Iscriviti" sul sito

---

## JavaScript — logiche chiave

### `js/components.js`
- Genera header e footer su tutte le pagine via `renderHeader()` / `renderFooter()`
- `window.showToast(msg, type)`: notifica toast auto-dismiss 3.5s (success/error/info)
- Mobile menu: hamburger toggle, chiude su click link
- Skip-to-content link per accessibilità
- All'init: fetch `impostazioni.iscrizioni_aperte` → se false, nasconde tutti i bottoni "Iscriviti"

### `js/home.js`
- `loadPreview()`: fetch 3 attività future attive, popola grid card
- `loadAvvisi()`: fetch avvisi attivi non scaduti, mostra sezione se presenti
- Fallback: messaggio "non disponibili" se Supabase non risponde

### `js/calendario.js`
- State: `tutteLeAttivita`, `tipoFiltro`, `vistaAttiva`, `meseCorrente`
- `renderLista()`: card filtrate per tipo e data futura
- `renderGriglia()`: calendario mensile con navigazione mese
- Event listeners su filtri, toggle vista, frecce mese

### `js/attivita.js`
- `init()`: legge `?id` da URL, fetch da Supabase
- `renderPagina(a)`: costruisce HTML completo pagina
- `buildFormHTML()`: genera form standard con campi_extra dinamici
- `buildFormCampoMinoriHTML()`: genera form speciale per campi minori
- `inviaIscrizione()`: INSERT in `iscrizioni_attivita`, raccoglie `risposte_extra` come jsonb
- Listener su data_nascita per logica minorenne

### `js/iscrizione.js`
- `calcolaAnnoCorrente()`: anno scout (settembre = nuovo anno)
- `aggiornaSezioneMinorenne()`: show/hide sezione genitore + label dinamici
- `aggiornaCausale()`: preview causale bonifico in tempo reale
- `inviaIscrizione()`: INSERT in `soci`

### `js/admin.js` (~500 righe)
- Auth: password check + sessionStorage
- CRUD completo attività con modal, campiExtra state array, upload PDF Storage
- Gestione avvisi con CRUD
- Toggle iscrizioni_aperte in impostazioni
- `SUPABASE_SERVICE_KEY` usata per bypassare RLS

---

## Database Supabase — schema completo

**Progetto Supabase:** `bdwragqrgfkqlupitouw.supabase.co`

### Tabella `attivita`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
nome text NOT NULL
descrizione text
tipo text NOT NULL CHECK (tipo IN ('uscita_giorno','campo','riunione','evento'))
data_inizio date NOT NULL
data_fine date
quota numeric DEFAULT 0
unita_target text
ha_form_iscrizione boolean DEFAULT false
nota_iscrizioni text
campi_extra jsonb DEFAULT '[]'
-- [{"id":"taglia","label":"Taglia maglietta","tipo":"select","opzioni":["S","M","L"],"obbligatorio":true}]
-- Tipi campo: testo_breve | checkbox | select | data | numero
immagine_url text
attiva boolean DEFAULT true
created_at timestamptz DEFAULT now()
documenti jsonb DEFAULT '[]'
-- [{"nome":"Scheda medica","url":"https://..."}]
tipo_modulo text  -- 'campo_minori' per form speciale
```
**RLS:** SELECT pubblico solo se `attiva = true`; admin bypassa con service key

---

### Tabella `soci`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
nome text NOT NULL
cognome text NOT NULL
data_nascita date NOT NULL
codice_fiscale text
unita text NOT NULL CHECK (unita IN ('lupetti','coccinelle','scout','guide','clan','staff'))
anno_associativo text NOT NULL
luogo_nascita text
classe_frequentata text
email text NOT NULL
telefono text
telefono_emergenza text
nome_genitore text
cognome_genitore text
indirizzo_citta text
indirizzo_cap text
indirizzo_via text
consenso_privacy boolean NOT NULL DEFAULT false
consenso_foto boolean NOT NULL DEFAULT false
note text
data_iscrizione timestamptz DEFAULT now()
```
**RLS:** INSERT aperto a tutti; SELECT bloccato

---

### Tabella `iscrizioni_attivita`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
attivita_id uuid NOT NULL REFERENCES attivita(id) ON DELETE CASCADE
nome text NOT NULL
cognome text NOT NULL
data_nascita date NOT NULL
email_contatto text NOT NULL
telefono text
nome_genitore text
note_mediche text
risposte_extra jsonb DEFAULT '{}'
-- es. {"taglia": "M", "vegetariano": true}
stato text DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa','confermato','annullato'))
consenso_privacy boolean NOT NULL DEFAULT false
data_iscrizione timestamptz DEFAULT now()
note text
```
**RLS:** INSERT aperto a tutti; SELECT bloccato

---

### Tabella `avvisi`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
titolo text NOT NULL
testo text NOT NULL
tipo text NOT NULL DEFAULT 'info' CHECK (tipo IN ('info','importante','urgente'))
attivo boolean DEFAULT true
data_scadenza date
created_at timestamptz DEFAULT now()
```
**RLS:** SELECT pubblico se `attivo=true AND (data_scadenza IS NULL OR data_scadenza >= current_date)`

---

### Tabella `contatti` (mailing list)
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
email text UNIQUE NOT NULL
nome text
cognome text
nome_ragazzo text
consenso_privacy boolean NOT NULL DEFAULT false
attivo boolean DEFAULT true
data_iscrizione timestamptz DEFAULT now()
```
**RLS:** INSERT aperto; SELECT bloccato

---

### Tabella `impostazioni`
```sql
chiave text PRIMARY KEY
valore text NOT NULL
updated_at timestamptz DEFAULT now()
-- Riga iniziale: ('iscrizioni_aperte', 'true')
```
**RLS:** SELECT pubblico; UPDATE solo via service_role

---

### Storage Supabase
**Bucket:** `documenti-attivita` — visibility Public  
SELECT: tutti (download libero); INSERT/DELETE: solo service_role

---

## Edge Function — `send-email`

**File:** `supabase/functions/send-email/index.ts`  
**Runtime:** Deno  
**Trigger:** Webhook POST su INSERT nelle tabelle `soci` e `iscrizioni_attivita`

**Logica:**
- Payload webhook: `{ type, table, record }`
- Se `table = 'soci'`: email conferma iscrizione anno, invia a `record.email`
- Se `table = 'iscrizioni_attivita'`: fetch dati attività, email conferma iscrizione attività, invia a `record.email_contatto`
- Invio via **Resend API** (`POST https://api.resend.com/emails`)
- Mittente: `AGGS Como <onboarding@resend.dev>` (da aggiornare con dominio verificato)

**Env variables:**
```
RESEND_API_KEY = re_xxx (configurare via supabase secrets set)
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY = auto-iniettati
```

**Deploy:**
```bash
supabase login
supabase link --project-ref bdwragqrg
supabase secrets set RESEND_API_KEY=re_xxx
supabase functions deploy send-email --no-verify-jwt
# Poi configurare webhooks da Dashboard → Database → Webhooks
```

**Limitazione:** piano free Resend → 3.000 email/mese, senza dominio verificato arrivano solo all'indirizzo registrato

---

## Cosa funziona (completato)

| Area | Stato |
|------|-------|
| 7 pagine HTML complete | ✅ |
| Design system CSS con variabili | ✅ |
| Header/footer dinamici via JS | ✅ |
| Home: preview attività + avvisi | ✅ |
| Calendario: lista + griglia mese + filtri | ✅ |
| Dettaglio attività + form standard | ✅ |
| Form campo minori | ✅ |
| Campi extra dinamici (jsonb) | ✅ |
| Form iscrizione anno associativo | ✅ |
| Logica minorenne (mostra genitore, label dinamici) | ✅ |
| Causale bonifico generata dinamicamente | ✅ |
| Form mailing list / contatti | ✅ |
| Mappa Google Maps embed | ✅ |
| FAQ accordion contatti | ✅ |
| Galleria foto con lightbox | ✅ |
| Pannello admin — CRUD attività | ✅ |
| Pannello admin — costruttore campi extra | ✅ |
| Pannello admin — upload PDF in Storage | ✅ |
| Pannello admin — gestione avvisi | ✅ |
| Pannello admin — gestione iscrizioni (visualizza + cambia stato) | ✅ |
| Pannello admin — toggle iscrizioni aperte/chiuse | ✅ |
| Toast notifications | ✅ |
| Privacy PDF + consenso su tutti i form | ✅ |
| Mobile responsive | ✅ |
| Edge Function send-email (Resend) | ✅ |

---

## Cosa manca o è incompleto (TODO)

### Priorità alta
- **Export CSV iscrizioni** (admin tab Iscrizioni): bottone "Scarica CSV" non ancora implementato
- **Validazione form admin** (modal nuova attività): mancano messaggi di errore inline
- **Verifica dominio Resend**: senza dominio verificato le email arrivano solo all'account owner

### Priorità media
- **Filtri/ordinamento iscrizioni admin**: solo lista plain, mancano filtri per stato
- **Test completo form campo minori**: logica presente ma non testata end-to-end
- **Password admin sicura**: attualmente hardcoded `"LupiCocci"` — passare a hash o Supabase Auth

### Priorità bassa
- **Lazy load immagini galleria**: WebP già ottimizzati, ma no native lazy load su lightbox
- **Social media link** in footer (se associazione ha account)
- **Analytics** (Google Analytics / Matomo)
- **Gestione revoca consenso foto**: raccolto ma admin non ha strumento revoca
- **Rate limiting form**: nessuna protezione anti-spam su submit

### Limitazioni note
- Storage PDF pubblico (no autenticazione download)
- RLS minimalista: INSERT aperto senza autenticazione (by design per sito pubblico)
- Admin protetto solo da password browser, no MFA
- Resend free tier: 3.000 email/mese, 100/giorno

---

## Prossimi step suggeriti

1. Verificare dominio su Resend e aggiornare `from:` in `send-email/index.ts`
2. Implementare export CSV nel tab Iscrizioni di `admin.js`
3. Test end-to-end form campo minori con un'attività reale
4. Deploy FTP su hosting condiviso
5. Configurare webhooks Supabase per trigger email (se non ancora fatto)
