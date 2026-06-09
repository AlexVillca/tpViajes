export const environment = {
  // Temporalmente usamos json-server tambien fuera de development
  // para no dejar el build apuntando a un environment vacio.
  apiBaseUrl: 'http://localhost:3000',
  // API publica de cotizaciones (gratuita y sin API key).
  currencyApiUrl: 'https://open.er-api.com/v6/latest',
  // API publica de datos de paises (gratuita y sin API key).
  restCountriesApiUrl: 'https://restcountries.com/v3.1'
};
