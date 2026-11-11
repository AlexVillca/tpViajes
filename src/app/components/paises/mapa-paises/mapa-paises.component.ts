import { Component, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { Pais } from '../../../models/interface/pais.interface';
import { IdiomaService } from '../../../core/i18n/idioma.service';

const COLOR = '#0e7490';
const COLOR_HOVER = '#0891b2';
const RADIO = 9;
const RADIO_HOVER = 13;
const RADIO_HALO = 22; // área de click invisible: no hace falta apuntar exacto (ley de Fitts)

/**
 * Mapa con un marcador por país. Cada país tiene un punto visible grande y, encima, un área de
 * click ampliada e invisible para que sea fácil de acertar. Al tocar un país, lo emite.
 */
@Component({
  selector: 'app-mapa-paises',
  standalone: true,
  template: `<div id="mapa-paises" class="h-[58vh] min-h-[380px] w-full overflow-hidden rounded-3xl border border-solid border-superficie-linea shadow-sm"></div>`
})
export class MapaPaisesComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() paises: Pais[] = [];
  @Output() seleccionar = new EventEmitter<Pais>();

  private readonly idioma = inject(IdiomaService);
  private map?: L.Map;
  private capa?: L.LayerGroup;
  private subIdioma?: Subscription;

  ngAfterViewInit(): void {
    this.map = L.map('mapa-paises', { worldCopyJump: true, minZoom: 2, scrollWheelZoom: true }).setView([20, 0], 2);
    // Base satelital de Esri (gratis, sin API key): más atractiva que el mapa plano para una app de viajes.
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics'
    }).addTo(this.map);
    // Etiquetas de países/ciudades por encima del satélite, para ubicarse mejor.
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    }).addTo(this.map);
    this.capa = L.layerGroup().addTo(this.map);
    this.pintar();
    this.encuadrar(false);
    // Al cambiar de idioma se redibujan los nombres de los marcadores (sin volver a encuadrar).
    this.subIdioma = this.idioma.idioma$.subscribe(() => this.pintar());
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (this.map && cambios['paises'] && !cambios['paises'].firstChange) {
      this.pintar();
      this.encuadrar(true);
    }
  }

  ngOnDestroy(): void {
    this.subIdioma?.unsubscribe();
    this.map?.remove();
  }

  private pintar(): void {
    if (!this.capa) return;
    this.capa.clearLayers();

    for (const pais of this.paises) {
      if (pais.latitud == null || pais.longitud == null) continue;
      const coord: L.LatLngTuple = [pais.latitud, pais.longitud];
      const nombre = this.idioma.dato(pais, 'nombre');

      const punto = L.circleMarker(coord, {
        radius: RADIO, color: '#ffffff', weight: 2.5, fillColor: COLOR, fillOpacity: 1, className: 'marcador-pais'
      });
      const halo = L.circleMarker(coord, {
        radius: RADIO_HALO, stroke: false, fill: true, fillColor: COLOR, fillOpacity: 0, className: 'marcador-halo'
      });

      const resaltar = (activo: boolean) => {
        punto.setRadius(activo ? RADIO_HOVER : RADIO);
        punto.setStyle({ fillColor: activo ? COLOR_HOVER : COLOR });
      };

      for (const marcador of [halo, punto]) {
        marcador.bindTooltip(nombre, { direction: 'top', className: 'tooltip-pais', offset: [0, -4] });
        marcador.on('click', () => this.seleccionar.emit(pais));
        marcador.on('mouseover', () => resaltar(true));
        marcador.on('mouseout', () => resaltar(false));
        marcador.addTo(this.capa!);
      }
    }
  }

  private encuadrar(animado: boolean): void {
    if (!this.map) return;
    const puntos: L.LatLngTuple[] = this.paises
      .filter(p => p.latitud != null && p.longitud != null)
      .map(p => [p.latitud as number, p.longitud as number]);
    if (!puntos.length) return;

    const limites = L.latLngBounds(puntos).pad(0.15);
    if (animado) {
      this.map.flyToBounds(limites, { maxZoom: 6, duration: 0.8 });
    } else {
      this.map.fitBounds(limites, { maxZoom: 6 });
    }
  }
}
