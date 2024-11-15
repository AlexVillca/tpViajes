import { Component, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',

  standalone: true,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, OnChanges {
  @Input() lat!: number;
  @Input() lon!: number;
  @Input() nombre!: string;
  private map!: L.Map;

  /// Recibo latitud y longitud, defino map



  private initMap(lat: number, lon: number, nombre: string): void { /// Inic map

    if(this.map){
      this.map.remove(); /// Borrar mapa si ya se creo uno
    }
    this.map = L.map('map', {
      center: [lat, lon],
      zoom: 6
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    L.marker([lat, lon]).addTo(this.map)
      .bindPopup(nombre)
      .openPopup();
  }

  ngAfterViewInit(): void {
    this.initMap(this.lat, this.lon, this.nombre);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lat'] || changes['lon']) {
      this.initMap(this.lat, this.lon, this.nombre); /// Redefinir en caso de cambios
    }
  }
}
