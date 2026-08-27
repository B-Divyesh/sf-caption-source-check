import './style.css';

const year = document.querySelector<HTMLElement>('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

const menu = document.querySelector<HTMLButtonElement>('[data-menu]');
const nav = document.querySelector<HTMLElement>('[data-nav]');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  if (nav) nav.hidden = !open;
});
