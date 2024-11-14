import { map } from 'rxjs';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  @Input() location!: string;

  private map!: L.Map;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeMap();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['location'] && this.location) {
      this.searchLocation(this.location);
    }
  }


  private initializeMap(): void {
    this.map = L.map('map').setView([0, 0], 2); // Vista inicial del mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private searchLocation(location: string): void {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${location}`;
    this.http.get<any[]>(url).subscribe(data => {
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        this.map.setView([+lat, +lon], 6); // Centrar mapa en la ubicación
        L.marker([+lat, +lon]).addTo(this.map).bindPopup(location).openPopup();
      } else {
        alert('Ubicación no encontrada');
      }
    });
  }
}

