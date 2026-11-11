/** Reemplaza una imagen que no cargó por la imagen "no disponible". Usar en el evento (error) de un <img>. */
export function imagenPorDefecto(event: Event): void {
  (event.target as HTMLImageElement).src = 'assets/imagennodisponible.png';
}
