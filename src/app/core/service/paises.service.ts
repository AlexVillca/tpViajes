import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, shareReplay } from 'rxjs';
import { Pais } from '../../models/interface/pais.interface';
import { environment } from '../../../environments/environment';
import { buildHttpError } from '../utils/http-error.util';

/** Foto guardada en la app para una atracción: ruta local y archivo de origen en Wikimedia Commons. */
interface ImagenLocal {
  imagen: string;
  /** Archivo de Wikimedia Commons de donde salió la foto (el crédito es la página del archivo). */
  archivoCommons?: string | null;
  /** Fotos de otras fuentes (Flickr): las licencias CC BY y CC BY-SA obligan a nombrar autor y licencia. */
  credito?: { autor: string | null; licencia: string; fuente: string | null };
  /** Lo que tenía la base cuando se descargó la foto. Si un admin lo cambia después, gana lo de la base. */
  urlOriginal?: string;
}

/** Texto del crédito: "Autor · Licencia", o solo la licencia si no hay autor. */
const textoCredito = (c: NonNullable<ImagenLocal['credito']>): string =>
  c.autor ? `${c.autor} · ${c.licencia}` : c.licencia;

/** Un valor que no es un link (vacío o texto de relleno como "url_imagen_x.jpg"). */
const sinImagenReal = (valor: string | undefined): boolean =>
  !valor || (!valor.includes('://') && !valor.startsWith('assets/'));

/** Clave del índice de imágenes: id del país, ciudad y atracción. */
export const claveImagen = (paisId: string | undefined, ciudad: string, atraccion: string): string =>
  `${paisId}|${ciudad}|${atraccion}`;

@Injectable({
  providedIn: 'root'
})
export class PaisesService {
  private apiUrl = `${environment.apiBaseUrl}/paises`;

  // Las fotos de las atracciones se guardan en la app (assets) porque muchos links externos dejaron de
  // funcionar o bloquean el uso desde otro sitio. Si el índice no carga, se usan las de la API.
  private readonly imagenesLocales$ = this.http
    .get<Record<string, ImagenLocal>>('assets/img/atracciones/indice.json')
    .pipe(catchError(() => of({} as Record<string, ImagenLocal>)), shareReplay(1));

  constructor(private http: HttpClient) { }

  /**
   * Países del catálogo. La API pública devuelve solo los visibles; el panel de administración pide
   * también los ocultos (incluirOcultos) por la ruta de admin, que exige ese rol.
   */
  getPaises(opciones: { incluirOcultos?: boolean } = {}): Observable<Pais[]> {
    const url = opciones.incluirOcultos ? `${environment.apiBaseUrl}/admin/paises` : this.apiUrl;
    const paises$ = this.http.get<Pais[]>(url).pipe(
      catchError(error => buildHttpError(error, 'mensajes.cargarPaises'))
    );
    return forkJoin([paises$, this.imagenesLocales$]).pipe(
      map(([paises, imagenes]) => paises.map(pais => this.conImagenesLocales(pais, imagenes)))
    );
  }

  /** Un país por su id. Sirve para rearmar la página al recargar o abrir un link compartido. */
  getPaisPorId(id: string): Observable<Pais | undefined> {
    return this.getPaises().pipe(map(paises => paises.find(p => p.id === id)));
  }

  private conImagenesLocales(pais: Pais, imagenes: Record<string, ImagenLocal>): Pais {
    if (!pais.ciudades?.length) return pais;
    return {
      ...pais,
      ciudades: pais.ciudades.map(ciudad => ({
        ...ciudad,
        atracciones: ciudad.atracciones?.map(atraccion => {
          const local = imagenes[claveImagen(pais.id, ciudad.nombre, atraccion.nombre)];
          if (!local || !(sinImagenReal(atraccion.imagen) || atraccion.imagen === local.urlOriginal)) return atraccion;
          return {
            ...atraccion,
            imagen: local.imagen,
            fuenteImagen: local.archivoCommons
              ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(local.archivoCommons)}`
              : local.credito?.fuente ?? undefined,
            creditoImagen: local.credito ? textoCredito(local.credito) : undefined
          };
        })
      }))
    };
  }
}
