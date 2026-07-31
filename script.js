const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const header = document.querySelector('.site-header');

const setTheme = (theme) => {
  document.body.classList.toggle('dark', theme === 'dark');
  const icon = themeToggle?.querySelector('.theme-toggle__icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☾' : '☀︎';
  }
  localStorage.setItem('medsimplify-theme', theme);
};

const savedTheme = localStorage.getItem('medsimplify-theme');
if (savedTheme) {
  setTheme(savedTheme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  setTheme('dark');
} else {
  setTheme('light');
}

themeToggle?.addEventListener('click', () => {
  const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
  setTheme(nextTheme);
});

const onScroll = () => {
  header?.classList.toggle('scrolled', window.scrollY > 8);
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
