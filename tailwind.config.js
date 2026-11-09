/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  corePlugins: {
    // Conserva los estilos actuales del navegador y de los componentes, sin normalización adicional.
    preflight: false
  },
  theme: {
    extend: {}
  },
  plugins: []
};