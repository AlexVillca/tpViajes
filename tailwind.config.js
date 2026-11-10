/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif']
      },
      colors: {
        // Textos
        tinta: {
          DEFAULT: '#123a53',
          media: '#365c70',
          suave: '#416277',
          tenue: '#527183',
          placeholder: '#647e8d'
        },
        // Azul principal de la marca
        marca: {
          DEFAULT: '#1685a8',
          oscuro: '#126b9b',
          profundo: '#0d577e',
          foco: '#087d9b',
          texto: '#176c8d',
          logo: '#1E85BB'
        },
        // Turquesa de acento
        acento: {
          DEFAULT: '#14b8b3',
          medio: '#149eae',
          claro: '#5eead4'
        },
        // Fondos y bordes claros de paneles, tarjetas y campos
        superficie: {
          DEFAULT: '#f0fafb',
          clara: '#e7f6f8',
          turquesa: '#d9f2f5',
          hover: '#d5eff2',
          spinner: '#d5ebf1',
          linea: '#d9eaf0',
          borde: '#cce4ec',
          resalte: '#b8e3e6'
        },
        // Degradado del fondo general cuando no hay video
        cielo: {
          DEFAULT: '#9bc9d8',
          claro: '#b4d9e5',
          oscuro: '#75b6c2'
        },
        exito: {
          DEFAULT: '#1f7a1f',
          vivo: '#28a745'
        },
        peligro: {
          DEFAULT: '#b42318',
          oscuro: '#9d291f',
          vivo: '#dc3545',
          fondo: '#fff4f2',
          borde: '#f3c7c2'
        }
      },
      keyframes: {
        aparecer: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          // Termina sin transform para no alterar elementos fijos internos (modales).
          '100%': { opacity: '1', transform: 'none' }
        }
      },
      animation: {
        aparecer: 'aparecer 0.6s ease-out both'
      }
    }
  },
  plugins: []
};
