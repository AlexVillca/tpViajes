# tpViajes

Aplicación web de turismo desarrollada en Angular 17 que permite explorar países y ciudades, guardar destinos favoritos, comentar, jugar un minijuego de banderas y consultar datos en vivo (clima, cotizaciones y datos de país) a través de APIs externas.

Proyecto realizado como Trabajo Final Integrador (TFI) de la Tecnicatura Universitaria en Programación.

## Características

Núcleo
- Listado de países con filtro alfabético y búsqueda.
- Ficha de país y de ciudad con información detallada.
- Mapa interactivo (Leaflet / OpenStreetMap).
- Sistema de comentarios por ciudad (crear, editar y eliminar los propios).
- Favoritos: listas personalizadas de ciudades (crear, renombrar, eliminar).
- Minijuego de banderas con ranking histórico de puntajes.

Seguridad
- Autenticación con validación de contraseña en el backend (bcrypt).
- Contraseñas hasheadas, nunca en texto plano ni expuestas en las respuestas.
- Sesión con JWT e interceptor HTTP que inyecta el token y maneja los errores 401/403.
- Guards de ruta para las secciones privadas.

Integraciones con APIs externas
- Conversor de moneda en vivo (ExchangeRate-API).
- Datos verificados del país: población, idiomas, monedas y países limítrofes (REST Countries).
- Clima actual de la ciudad (Open-Meteo).

Calidad
- Manejo de errores HTTP unificado y estados de carga y vacío.
- Feedback al usuario y validaciones visibles en los formularios.
- Pruebas unitarias con Jasmine y Karma.

## Arquitectura

- Frontend: Angular 17 con componentes standalone, RxJS y Leaflet.
- Backend: Node.js con Express, que utiliza json-server como capa de datos e implementa la autenticación con bcrypt y JWT (db/server.js).
- Base de datos: archivo JSON (db/db.json) con las colecciones paises, usuarios y comentarios.

## Testing

El proyecto cuenta con pruebas unitarias de los servicios y componentes principales, realizadas con Jasmine y Karma. Para ejecutarlas:

```bash
npm test
```

## Estructura del proyecto

```
src/app/
  components/   Interfaz (paises, favoritos, comentarios, home, ...)
  core/
    auth/         login, registro y guard
    interceptors/ interceptor de autenticación
    service/      servicios de datos y de APIs externas
  game/         minijuego de banderas
  models/       interfaces (Pais, Ciudad, Usuario, ...)
db/
  server.js     backend (Express + json-server + bcrypt + JWT)
  db.json       base de datos
```

## Tecnologías

Angular 17, TypeScript, RxJS, Leaflet / OpenStreetMap, Node.js, Express, json-server, bcrypt, JSON Web Tokens, Jasmine y Karma.

## Equipo

- Facundo Ramallo
- Andrés Chávez
- Alex Villca
- Manuel Ruggeri
- Gustavo Iñegue
