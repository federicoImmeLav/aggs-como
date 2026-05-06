import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────

function annoAssociativo() {
  const oggi = new Date();
  const anno = oggi.getFullYear();
  // Nuovo anno associativo da settembre
  return (oggi.getMonth() + 1) >= 9
    ? `${anno}-${anno + 1}`
    : `${anno - 1}-${anno}`;
}

function init() {
  document.getElementById('anno_associativo').value = annoAssociativo();

  const dataNascitaEl   = document.getElementById('data_nascita');
  const sezioneGen      = document.getElementById('sezione-genitore');
  const nomeGenEl       = document.getElementById('nome_genitore');
  const cognomeGenEl    = document.getElementById('cognome_genitore');
  const hintContattiEl  = document.getElementById('hint-contatti');

  dataNascitaEl.addEventListener('change', () => {
    const minore = isMinorenne(dataNascitaEl.value);
    sezioneGen.classList.toggle('hidden', !minore);
    sezioneGen.setAttribute('aria-hidden', String(!minore));
    if (nomeGenEl)    nomeGenEl.required    = minore;
    if (cognomeGenEl) cognomeGenEl.required = minore;
    if (hintContattiEl) {
      hintContattiEl.textContent = minore
        ? 'Email e telefono del genitore o tutore legale.'
        : 'Email e telefono del ragazzo/a.';
    }
  });

  document.getElementById('form-iscrizione').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validaForm()) return;
    await inviaIscrizione();
  });
}

function isMinorenne(dataNascita) {
  if (!dataNascita) return false;
  const nascita = new Date(dataNascita + 'T00:00:00');
  const oggi    = new Date();
  let eta = oggi.getFullYear() - nascita.getFullYear();
  const m = oggi.getMonth() - nascita.getMonth();
  if (m < 0 || (m === 0 && oggi.getDate() < nascita.getDate())) eta--;
  return eta < 18;
}

// ──────────────────────────────────────────────
// VALIDAZIONE
// ──────────────────────────────────────────────

function validaForm() {
  let valido = true;

  document.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));

  function segnaErrore(id) {
    const el = document.getElementById(id);
    if (el) el.closest('.form-group')?.classList.add('has-error');
    valido = false;
  }

  if (!document.getElementById('nome')?.value.trim())           segnaErrore('nome');
  if (!document.getElementById('cognome')?.value.trim())        segnaErrore('cognome');
  if (!document.getElementById('data_nascita')?.value)          segnaErrore('data_nascita');
  if (!document.getElementById('unita')?.value)                 segnaErrore('unita');
  if (!document.getElementById('email')?.value.includes('@'))   segnaErrore('email');
  if (!document.getElementById('consenso_privacy')?.checked)    segnaErrore('consenso_privacy');

  const nomeGen    = document.getElementById('nome_genitore');
  const cognomeGen = document.getElementById('cognome_genitore');
  if (nomeGen?.required    && !nomeGen.value.trim())    segnaErrore('nome_genitore');
  if (cognomeGen?.required && !cognomeGen.value.trim()) segnaErrore('cognome_genitore');

  if (!valido) {
    document.querySelector('.form-group.has-error')
      ?.querySelector('input, select, textarea')
      ?.focus();
  }

  return valido;
}

// ──────────────────────────────────────────────
// SUBMIT
// ──────────────────────────────────────────────

async function inviaIscrizione() {
  const btn    = document.getElementById('btn-submit');
  const errBox = document.getElementById('form-error-generale');

  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Invio in corso…';
  errBox.classList.add('hidden');

  const cf = document.getElementById('codice_fiscale').value.trim().toUpperCase();

  const payload = {
    nome:               document.getElementById('nome').value.trim(),
    cognome:            document.getElementById('cognome').value.trim(),
    data_nascita:       document.getElementById('data_nascita').value,
    codice_fiscale:     cf || null,
    unita:              document.getElementById('unita').value,
    anno_associativo:   document.getElementById('anno_associativo').value,
    email:              document.getElementById('email').value.trim(),
    telefono:           document.getElementById('telefono').value.trim() || null,
    telefono_emergenza: document.getElementById('telefono_emergenza').value.trim() || null,
    nome_genitore:      document.getElementById('nome_genitore').value.trim() || null,
    cognome_genitore:   document.getElementById('cognome_genitore').value.trim() || null,
    consenso_privacy:   true,
    consenso_foto:      document.getElementById('consenso_foto').checked,
    note:               document.getElementById('note').value.trim() || null,
  };

  const { error } = await supabase.from('soci').insert(payload);

  if (error) {
    btn.disabled  = false;
    btn.innerHTML = 'Invia iscrizione';
    errBox.textContent = `Si è verificato un errore: ${error.message}. Riprova o contattaci direttamente.`;
    errBox.classList.remove('hidden');
    return;
  }

  document.getElementById('form-fields').classList.add('hidden');
  document.getElementById('form-success').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ──────────────────────────────────────────────
// START
// ──────────────────────────────────────────────

init();
