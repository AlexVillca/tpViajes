import { Component, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';

const escaparHtml = (texto: string) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Mapa chico que ubica un único punto (el país) con su bandera en un popup. Se usa en el detalle del país. */
@Component({
  selector: 'app-map',

  standalone: true,
  templateUrl: './map.component.html'
})
export class MapComponent implements AfterViewInit, OnChanges {
  @Input() lat!: number;
  @Input() lon!: number;
  @Input() nombre!: string;
  @Input() flagUrl!: string;

  private map?: L.Map;
  private marcador?: L.Marker;

  private contenidoPopup(): string {
    return `${escaparHtml(this.nombre ?? '')}
      <div class="text-center">
        <img src="${escaparHtml(this.flagUrl ?? '')}" alt="" class="mx-auto mt-1 block h-auto w-[30px] border border-solid border-superficie-borde" />
      </div>`;
  }

  private initMap(): void {
    this.map?.remove();
    this.map = L.map('map', {
      center: [this.lat, this.lon],
      zoom: 6
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.marcador = L.marker([this.lat, this.lon]).addTo(this.map)
      .bindPopup(this.contenidoPopup())
      .openPopup();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Antes del primer render no existe el contenedor: el mapa se crea en ngAfterViewInit.
    if (!this.map) return;
    if (changes['lat'] || changes['lon']) {
      this.initMap();
    } else if (changes['nombre'] || changes['flagUrl']) {
      // Por ejemplo, al cambiar de idioma: solo se actualiza el texto del marcador.
      this.marcador?.setPopupContent(this.contenidoPopup());
    }
  }
}
