const targets = document.querySelectorAll([
  '.section-header',
  '.card',
  '.gallery-item',
  '.faq-item',
  'fieldset.form-section',
  '.section > .container > h2',
  '.section > .container > p',
  '.section > .container > figure',
  '.section > .container > [class*="mt-"]',
  '.section > .container > div:not(.section-header):not(.cards-grid):not(.gallery-grid)',
].join(','));

targets.forEach(el => {
  el.classList.add('reveal');

  // stagger per figli di una griglia
  const grid = el.closest('.cards-grid, .gallery-grid, .faq-list');
  if (grid) {
    const idx = [...grid.children].indexOf(el);
    el.style.transitionDelay = `${idx * 0.1}s`;
  }
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    entry.target.style.transitionDelay = entry.target.style.transitionDelay; // mantieni delay
    observer.unobserve(entry.target);
  });
}, { threshold: 0.1 });

targets.forEach(el => observer.observe(el));
