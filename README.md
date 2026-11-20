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
- Panel de administración: editar el catálogo (países, atracciones e imágenes), ocultar países, revisar imágenes rotas, moderar comentarios y ver el registro de cambios.

Seguridad
- Autenticación con validación de contraseña en el backend (bcrypt).
- Contraseñas hasheadas, nunca en texto plano ni expuestas en las respuestas.
- Sesión con JWT en una cookie httpOnly (el JavaScript de la página no puede leer el token) e interceptor HTTP que manda la cookie y maneja los errores 401/403.
- Guards de ruta para las secciones privadas.
- Cada usuario solo puede ver y modificar su propia cuenta; no hay listados públicos con emails.
- CORS con lista de orígenes permitidos y límite de intentos de inicio de sesión por cuenta.
- La API escucha por defecto solo en la propia máquina.

Integraciones con APIs externas
- Conversor de moneda en vivo (ExchangeRate-API).
- Datos verificados del país: población, idiomas, monedas y países limítrofes (REST Countries).
- Clima actual de la ciudad (Open-Meteo).

Calidad
- Manejo de errores HTTP unificado y estados de carga y vacío.
- Feedback al usuario y validaciones visibles en los formularios.
- Pruebas unitarias con Jasmine y Karma.

## Arquitectura

- Frontend: Angular 17 con componentes standalone, RxJS y Leaflet. Consume la API publicada del proyecto.
- Backend: Node.js con Express; API REST propia con autenticación bcrypt + JWT y persistencia en MySQL (db/server.js), publicada en internet.
- Base de datos: MySQL 8.

## Cómo usar la app

La app consume la API ya publicada del proyecto, así que **no hace falta instalar ni configurar ninguna base de datos**.

Requisitos: Node 20.

1. Clonar el repositorio.
2. Instalar las dependencias:

   ```bash
   npm install
   ```

3. Levantar la app:

   ```bash
   npm start
   ```

Se abre en el navegador (http://localhost:4200) y consume la API publicada en `https://api-deviaje.facuramallo.com.ar`. No hay que levantar base de datos ni backend local.

Cuenta de prueba: usuario **admin**, contraseña **admin**.

## Panel de administración

Las cuentas son de rol `usuario` por defecto. El rol `admin` no se puede pedir desde la app: se asigna con un script, usando la configuración de base de datos del `.env`:

```bash
node db/hacer-admin.js <usuario o email>            # la hace admin
node db/hacer-admin.js <usuario o email> --quitar   # la vuelve usuario común
```

Después de volver a iniciar sesión aparece "Administración" en el menú del usuario (ruta `/admin`). El backend controla el rol en cada pedido, así que sacarle el rol a alguien le quita el acceso en el momento. Cada cambio queda anotado en el registro (quién, qué y cuándo).

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
  server.js     backend / API (Express + MySQL + bcrypt + JWT)
```

## Tecnologías

Angular 17, TypeScript, RxJS, Leaflet / OpenStreetMap, Node.js, Express, MySQL (mysql2), bcrypt, JSON Web Tokens, Docker, Jasmine y Karma.

## Equipo

- Facundo Ramallo
- Andrés Chávez
- Alex Villca
- Manuel Ruggeri
- Gustavo Iñegue
