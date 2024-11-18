# tpViajes

Proyecto desarrollado en Angular que ayudará al usuario a recopilar información importante acerca de destinos turisticos, utilizando servicios como la API de OpenStreetMaps para mostrar información geográfica, además de usar una base de datos propia.

## Características

- **Búsqueda de países y ciudades:** Información detallada sobre lugares turísticos.
- **Integración de mapas:** Uso de OpenStreetMap para visualizar ubicaciones.
- **Sistema de comentarios:** Los usuarios pueden agregar y leer comentarios sobre ciudades.
- **Favoritos:** Gestión de listas de ciudades favoritas.
- **Interfaz amigable:** Diseño enfocado en la usabilidad y simplicidad.

## Instalación

1. Clona el repositorio:
  
git clone https://github.com/AlexVillca/tpViajes.git

2. Posicionarse en el directorio del proyecto

cd tpViajes

3. Instalación de dependencia

npm install (nodemodules)
npm install leaflet (integracion OpenStreetMaps)

4. Iniciar json-server local

json-server --watch db/db.json

5. Iniciar 

ng serve -o

## Uso

Ver lista de países: Filtrar por letra y entrar a la ficha del país.
Ver información de un país: Conocer detalles del mismo y acceder a distintas ciudades.
Ver información de una ciudad: Conocer detalles de la ciudad y dejar un comentario.
Dejar un comentario: Los usuarios registrados tienen la opción de agregar un comentario a la ficha de una ciudad.
Guardar en listas personalizadas: Los usuarios registrados tienen la opción de agregar una ciudad a una lista de "Favoritos".
Minijuego: Los usuarios registrados o no pueden acceder a un minijuego de banderas.

## Tecnologías

Frontend: Angular

Mapas: OpenStreetMap 

Backend: JSON Server para persistencia de datos
