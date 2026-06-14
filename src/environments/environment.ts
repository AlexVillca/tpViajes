export const environment = {
  // Temporalmente usamos json-server tambien fuera de development
  // para no dejar el build apuntando a un environment vacio.
  apiBaseUrl: 'http://localhost:3000',
  // API publica de cotizaciones (gratuita y sin API key).
  currencyApiUrl: 'https://open.er-api.com/v6/latest',
  // API de REST Countries v5.
  restCountriesApiUrl: 'https://api.restcountries.com/countries/v5',
  restCountriesApiKey: 'rc_live_c318abbc9f23440ab1e2cf3bb4617ed6'
};
