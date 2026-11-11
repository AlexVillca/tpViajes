import { Component, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { Atraccion } from '../../../models/interface/pais.interface';
import { IdiomaService } from '../../../core/i18n/idioma.service';

/**
 * Mapa de las atracciones de una ciudad: un pin numerado por atracción, en el mismo orden que las
 * tarjetas. Al tocar un pin emite el índice (la página lo usa para llevar a la tarjeta).
 */
@Component({
  selector: 'app-mapa-atracciones',
  standalone: true,
  template: `<div [id]="idMapa" class="h-[42vh] min-h-[300px] w-full overflow-hidden rounded-2xl border border-solid border-superficie-linea shadow-sm"></div>`
})
export class MapaAtraccionesComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() atracciones: Atraccion[] = [];
  @Output() seleccionar = new EventEmitter<number>();

  /** Id único por si hay más de un mapa en la página. */
  readonly idMapa = `mapa-atracciones-${Math.random().toString(36).slice(2, 9)}`;

  private readonly idioma = inject(IdiomaService);
  private map?: L.Map;
  private capa?: L.LayerGroup;
  private subIdioma?: Subscription;

  ngAfterViewInit(): void {
    this.map = L.map(this.idMapa, { scrollWheelZoom: false }).setView([0, 0], 2);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics'
    }).addTo(this.map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    }).addTo(this.map);
    this.capa = L.layerGroup().addTo(this.map);
    this.pintar();
    this.encuadrar();
    this.subIdioma = this.idioma.idioma$.subscribe(() => this.pintar());
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (this.map && cambios['atracciones'] && !cambios['atracciones'].firstChange) {
      this.pintar();
      this.encuadrar();
    }
  }

  ngOnDestroy(): void {
    this.subIdioma?.unsubscribe();
    this.map?.remove();
  }

  private coords(a: Atraccion): L.LatLngTuple | null {
    const u = a.ubicacion;
    if (!u || u.latitud == null || u.longitud == null) return null;
    return [u.latitud, u.longitud];
  }

  private pintar(): void {
    if (!this.capa) return;
    this.capa.clearLayers();

    this.atracciones.forEach((atraccion, indice) => {
      const coord = this.coords(atraccion);
      if (!coord) return;
      const icono = L.divIcon({
        className: 'pin-atraccion',
        html: `<span>${indice + 1}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      L.marker(coord, { icon: icono, title: this.idioma.dato(atraccion, 'nombre') })
        .bindTooltip(`${indice + 1}. ${this.idioma.dato(atraccion, 'nombre')}`, { direction: 'top', className: 'tooltip-pais', offset: [0, -12] })
        .on('click', () => this.seleccionar.emit(indice))
        .addTo(this.capa!);
    });
  }

  private encuadrar(): void {
    if (!this.map) return;
    const puntos = this.atracciones
      .map(a => this.coords(a))
      .filter((c): c is L.LatLngTuple => c !== null);
    if (!puntos.length) return;
    if (puntos.length === 1) {
      this.map.setView(puntos[0], 14);
    } else {
      this.map.fitBounds(L.latLngBounds(puntos).pad(0.25), { maxZoom: 15 });
    }
  }
}
