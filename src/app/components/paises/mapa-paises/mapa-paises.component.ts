import { Component, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import * as L from 'leaflet';
import { Pais } from '../../../models/interface/pais.interface';
import { IdiomaService } from '../../../core/i18n/idioma.service';

/** Mapa con un marcador por país (círculos, sin íconos de imagen). Al tocar un país, lo emite. */
@Component({
  selector: 'app-mapa-paises',
  standalone: true,
  template: `<div id="mapa-paises" class="h-[58vh] min-h-[400px] w-full overflow-hidden rounded-3xl border border-solid border-superficie-linea shadow-sm"></div>`
})
export class MapaPaisesComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() paises: Pais[] = [];
  @Output() seleccionar = new EventEmitter<Pais>();

  private readonly idioma = inject(IdiomaService);
  private map?: L.Map;
  private capa?: L.LayerGroup;

  ngAfterViewInit(): void {
    this.map = L.map('mapa-paises', { worldCopyJump: true, minZoom: 1, scrollWheelZoom: true }).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(this.map);
    this.capa = L.layerGroup().addTo(this.map);
    this.dibujar();
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (this.map && cambios['paises']) this.dibujar();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private dibujar(): void {
    if (!this.map || !this.capa) return;
    this.capa.clearLayers();
    const puntos: L.LatLngTuple[] = [];
    for (const pais of this.paises) {
      if (pais.latitud == null || pais.longitud == null) continue;
      const coord: L.LatLngTuple = [pais.latitud, pais.longitud];
      puntos.push(coord);
      L.circleMarker(coord, { radius: 7, color: '#0e7490', weight: 2, fillColor: '#22d3ee', fillOpacity: 0.85 })
        .bindTooltip(this.idioma.dato(pais, 'nombre'), { direction: 'top' })
        .on('click', () => this.seleccionar.emit(pais))
        .addTo(this.capa!);
    }
    if (puntos.length) {
      this.map.fitBounds(L.latLngBounds(puntos).pad(0.15), { maxZoom: 6 });
    }
  }
}
