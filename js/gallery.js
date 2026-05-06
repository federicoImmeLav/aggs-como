const items = Array.from(document.querySelectorAll('.gallery-item'));
const lightbox = document.getElementById('gallery-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const btnClose = document.getElementById('lightbox-close');
const btnPrev = document.getElementById('lightbox-prev');
const btnNext = document.getElementById('lightbox-next');

if (!lightbox || !items.length) throw new Error('Gallery elements not found');

let current = 0;
let lastFocused = null;

function showImage() {
  const img = items[current].querySelector('img');
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxCaption.textContent = img.alt;
  btnPrev.disabled = current === 0;
  btnNext.disabled = current === items.length - 1;
}

function openLightbox(index) {
  current = index;
  showImage();
  lastFocused = document.activeElement;
  lightbox.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  btnClose.focus();
}

function closeLightbox() {
  lightbox.setAttribute('hidden', '');
  document.body.style.overflow = '';
  lastFocused?.focus();
}

items.forEach((item, i) => {
  item.addEventListener('click', () => openLightbox(i));
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
  });
});

btnClose.addEventListener('click', closeLightbox);

btnPrev.addEventListener('click', () => {
  if (current > 0) { current--; showImage(); }
});

btnNext.addEventListener('click', () => {
  if (current < items.length - 1) { current++; showImage(); }
});

lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', e => {
  if (lightbox.hasAttribute('hidden')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft' && current > 0) { current--; showImage(); }
  if (e.key === 'ArrowRight' && current < items.length - 1) { current++; showImage(); }
});
