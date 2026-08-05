export const environment = {
  // En desarrollo seguimos usando json-server local.
  apiBaseUrl: 'http://localhost:3000',
  // API publica de cotizaciones (gratuita y sin API key).
  currencyApiUrl: 'https://open.er-api.com/v6/latest',
  // API de REST Countries v5.
  restCountriesApiUrl: 'https://api.restcountries.com/countries/v5',
  restCountriesApiKey: 'rc_live_c318abbc9f23440ab1e2cf3bb4617ed6',
  // Open-Meteo: clima y geocoding, gratuitos y sin API key.
  weatherApiUrl: 'https://api.open-meteo.com/v1/forecast',
  geocodingApiUrl: 'https://geocoding-api.open-meteo.com/v1/search'
};
