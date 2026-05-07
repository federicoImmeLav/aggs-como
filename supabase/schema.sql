-- ============================================================
-- AGGS Como — Schema database completo
-- Eseguire nell'ordine nel Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABELLE
-- ============================================================

create table if not exists attivita (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  descrizione      text,
  tipo             text not null check (tipo in ('uscita_giorno','campo','riunione','evento')),
  data_inizio      date not null,
  data_fine        date,
  quota            numeric default 0,
  unita_target     text,            -- es. "scout,guide" o "tutti"
  ha_form_iscrizione boolean default false,
  nota_iscrizioni  text,             -- messaggio visibile quando ha_form_iscrizione = false
  campi_extra      jsonb default '[]'::jsonb,
  -- campi_extra: array di oggetti
  -- [{ "id": "taglia", "label": "Taglia maglietta", "tipo": "select",
  --    "opzioni": ["S","M","L","XL"], "obbligatorio": true }]
  -- Tipi supportati: testo_breve | checkbox | select | data | numero
  immagine_url     text,
  attiva           boolean default true,
  created_at       timestamptz default now()
);

create table if not exists soci (
  id                   uuid primary key default gen_random_uuid(),
  -- Dati del ragazzo/a
  nome                 text not null,
  cognome              text not null,
  data_nascita         date not null,
  codice_fiscale       text,
  unita                text not null check (unita in ('lupetti','coccinelle','scout','guide')),
  anno_associativo     text not null,  -- es. "2025-2026"
  -- Contatti (propri se maggiorenne, del genitore se minorenne)
  email                text not null,
  telefono             text,
  telefono_emergenza   text,
  -- Dati genitore (compilati solo se minorenne)
  nome_genitore        text,
  cognome_genitore     text,
  -- Consensi GDPR
  consenso_privacy     boolean not null default false,
  consenso_foto        boolean not null default false,
  note                 text,
  data_iscrizione      timestamptz default now()
);

create table if not exists iscrizioni_attivita (
  id                uuid primary key default gen_random_uuid(),
  attivita_id       uuid not null references attivita(id) on delete cascade,
  -- Dati base
  nome              text not null,
  cognome           text not null,
  data_nascita      date not null,
  email_contatto    text not null,
  telefono          text,
  -- Dati genitore (per minorenni)
  nome_genitore     text,
  -- Campi specifici per campi/uscite multi-giorno
  note_mediche      text,
  -- Risposte ai campi_extra dell'attività
  risposte_extra    jsonb default '{}'::jsonb,
  -- es. {"taglia": "M", "vegetariano": true}
  -- Gestione
  stato             text default 'in_attesa' check (stato in ('in_attesa','confermato','annullato')),
  consenso_privacy  boolean not null default false,
  data_iscrizione   timestamptz default now(),
  note              text
);

create table if not exists contatti (
  id               uuid primary key default gen_random_uuid(),
  email            text unique not null,
  nome             text,
  cognome          text,
  nome_ragazzo     text,
  consenso_privacy boolean not null default false,
  attivo           boolean default true,
  data_iscrizione  timestamptz default now()
);

-- ============================================================
-- INDICI
-- ============================================================

create index if not exists idx_attivita_data_inizio on attivita(data_inizio);
create index if not exists idx_attivita_tipo        on attivita(tipo);
create index if not exists idx_attivita_attiva      on attivita(attiva);

create index if not exists idx_soci_anno            on soci(anno_associativo);
create index if not exists idx_soci_unita           on soci(unita);

create index if not exists idx_iscrizioni_attivita  on iscrizioni_attivita(attivita_id);
create index if not exists idx_iscrizioni_stato     on iscrizioni_attivita(stato);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table attivita          enable row level security;
alter table soci              enable row level security;
alter table iscrizioni_attivita enable row level security;
alter table contatti          enable row level security;

-- attivita: lettura pubblica solo per le attive, nessuna scrittura pubblica
create policy "Lettura pubblica attivita attive"
  on attivita for select
  using (attiva = true);

-- soci: chiunque può inserire (iscrizione aperta), nessuna lettura pubblica
create policy "Chiunque può iscriversi"
  on soci for insert
  with check (true);

-- iscrizioni_attivita: chiunque può inserire
create policy "Chiunque può iscriversi ad attività"
  on iscrizioni_attivita for insert
  with check (true);

-- contatti: chiunque può iscriversi alla mailing list
create policy "Chiunque può iscriversi alla mailing list"
  on contatti for insert
  with check (true);

create table if not exists avvisi (
  id            uuid primary key default gen_random_uuid(),
  titolo        text not null,
  testo         text not null,
  tipo          text not null default 'info'
                check (tipo in ('info','importante','urgente')),
  attivo        boolean default true,
  data_scadenza date,
  created_at    timestamptz default now()
);

create index if not exists idx_avvisi_attivo on avvisi(attivo);

alter table avvisi enable row level security;

-- Lettura pubblica: solo avvisi attivi e non scaduti
create policy "Lettura pubblica avvisi attivi"
  on avvisi for select
  using (attivo = true and (data_scadenza is null or data_scadenza >= current_date));

-- ============================================================
-- MIGRATION — eseguire solo su database già esistente
-- ============================================================

-- alter table attivita add column if not exists nota_iscrizioni text;
alter table attivita add column if not exists documenti jsonb default '[]'::jsonb;
-- documenti: array di oggetti [{ "nome": "Scheda medica", "url": "https://..." }]

-- ============================================================
-- STORAGE — eseguire dal dashboard Supabase → Storage
-- ============================================================
-- 1. Crea bucket: nome = "documenti-attivita", Public = true
-- 2. In bucket Policies aggiungi:
--    - SELECT: public (tutti possono scaricare)
--    - INSERT/DELETE: solo service_role (solo admin può caricare)

-- ============================================================
-- NOTA ADMIN
-- Il pannello admin usa la service_role key (lato server /
-- Edge Function) o bypassa RLS via header Authorization.
-- Non abilitare policy SELECT/UPDATE/DELETE pubbliche sulle
-- tabelle soci, iscrizioni_attivita e contatti.
-- ============================================================

-- ============================================================
-- IMPOSTAZIONI — configurazioni globali del sito
-- ============================================================

create table if not exists impostazioni (
  chiave     text primary key,
  valore     text not null,
  updated_at timestamptz default now()
);

-- Valore di default: iscrizioni aperte
insert into impostazioni (chiave, valore)
  values ('iscrizioni_aperte', 'true')
  on conflict (chiave) do nothing;

alter table impostazioni enable row level security;

-- Chiunque può leggere le impostazioni pubbliche
create policy "Lettura pubblica impostazioni"
  on impostazioni for select
  using (true);
-- UPDATE solo via service_role key (bypasssa RLS)
