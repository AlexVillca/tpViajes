import { Component, AfterViewInit, Input, OnChanges, SimpleChanges, Output } from '@angular/core';
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
  @Input() flagUrl!: string;

  private map!: L.Map;




  private initMap(lat: number, lon: number, nombre: string ,flagUrl: string): void { /// Inic map

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
      .bindPopup(nombre + `
        <div style="text-align: center;">
          <img src="${flagUrl}" alt="Ubicación" style="width: 150px; height: auto; border: 1px solid #ccc;" />
        </div>
      `)
      .openPopup();
  }

  ngAfterViewInit(): void {
    this.initMap(this.lat, this.lon, this.nombre, this.flagUrl);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lat'] || changes['lon']) {
      this.initMap(this.lat, this.lon, this.nombre,this.flagUrl); /// Redefinir en caso de cambios
    }
  }
}
function bindPopup(arg0: string) {
  throw new Error('Function not implemented.');
}

