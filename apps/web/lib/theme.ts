export const themeInitScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      var initialTheme = theme || systemTheme;
      document.documentElement.setAttribute('data-theme', initialTheme);
    } catch (e) {}
  })();
`
