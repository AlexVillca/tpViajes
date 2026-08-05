# tpViajes

Aplicación web de turismo desarrollada en **Angular 17** que permite explorar países y ciudades, guardar destinos favoritos, comentar, jugar un minijuego de banderas y consultar datos en vivo (clima, cotizaciones y datos de país) a través de APIs externas.

Proyecto realizado como **Trabajo Final Integrador (TFI)** de la Tecnicatura Universitaria en Programación.

---

## ✨ Características

**Núcleo**
- Listado de países con filtro alfabético y búsqueda.
- Ficha de país y de ciudad con información detallada.
- Mapa interactivo (Leaflet / OpenStreetMap).
- Sistema de **comentarios** por ciudad (crear, editar y eliminar los propios).
- **Favoritos**: listas personalizadas de ciudades (crear, renombrar, eliminar).
- **Minijuego** de banderas con ranking histórico de puntajes.

**Seguridad**
- Autenticación con **validación de contraseña en el backend** (bcrypt).
- Contraseñas **hasheadas** (nunca en texto plano ni expuestas en las respuestas).
- Sesión con **JWT** + **HTTP Interceptor** (inyecta el token y maneja 401/403).
- **Guards** de ruta para las secciones privadas.

**Integraciones con APIs externas**
- 💱 **Conversor de moneda** en vivo — [open.er-api.com](https://www.exchangerate-api.com/) (sin API key).
- 🌍 **Datos verificados del país** (población, idiomas, limítrofes, etc.) — [REST Countries](https://restcountries.com/).
- 🌤️ **Clima actual de la ciudad** — [Open-Meteo](https://open-meteo.com/) (sin API key).

**Calidad**
- Manejo de errores HTTP unificado y estados de carga / vacío.
- Feedback al usuario (toasts) y validaciones visibles en formularios.
- Tipado fuerte (sin `any`).
- Tests unitarios (Jasmine/Karma) e integración continua (GitHub Actions).

---

## 🏗️ Arquitectura

- **Frontend:** Angular 17 (componentes *standalone*), RxJS, Leaflet.
- **Backend propio:** Node.js + Express usando `json-server` como capa de datos, con lógica propia de autenticación (bcrypt + JWT). Código en [`db/server.js`](db/server.js).
- **Base de datos:** archivo JSON ([`db/db.json`](db/db.json)) con las colecciones `paises`, `usuarios` y `comentarios`.

> Actualmente todo corre en **local**. El despliegue a un servidor (VPS/Railway) y la externalización de secretos quedan como último paso previo a la entrega.

---

## 🚀 Puesta en marcha

**Requisitos:** Node.js 18+ y npm.

```bash
# 1. Clonar
git clone https://github.com/AlexVillca/tpViajes.git
cd tpViajes

# 2. Instalar dependencias
npm install
```

**Primera vez (o al agregar usuarios nuevos con contraseña en texto plano):** hashear las contraseñas del `db.json`.

```bash
npm run hash-passwords
```

**Levantar el backend** (servidor propio con JWT/bcrypt, en `http://localhost:3000`):

```bash
npm run backend
```

**Levantar el frontend** (en `http://localhost:4200`), en otra terminal:

```bash
npm start
```

---

## 🧪 Testing

```bash
# Interactivo (abre Chrome)
npm test

# Headless, una sola corrida (el que usa la CI)
npm run test:ci
```

La **integración continua** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) corre build + tests en cada push y pull request a `main`.

---

## 📦 Build de producción

```bash
npm run build
```

Genera la aplicación optimizada en `dist/`.

---

## 📂 Estructura relevante

```
src/app/
  components/      # UI (paises, favoritos, comentarios, home, utils, ...)
  core/
    auth/          # login, registro, guard
    interceptors/  # auth.interceptor (JWT)
    service/       # servicios de datos y de APIs externas
  game/            # minijuego de banderas
  models/          # interfaces (Pais, Ciudad, Usuario, ...)
db/
  server.js        # backend propio (Express + json-server + bcrypt + JWT)
  db.json          # base de datos
  hash-passwords.js# migración de contraseñas a hash
```

---

## 🛠️ Tecnologías

Angular 17 · TypeScript · RxJS · Leaflet / OpenStreetMap · Node.js · Express · json-server · bcryptjs · JSON Web Tokens · Jasmine / Karma · GitHub Actions

---

## 👥 Equipo

> Completar con los integrantes del grupo.
