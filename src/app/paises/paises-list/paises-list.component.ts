import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pais } from '../pais';
import { RouterModule } from '@angular/router';
import { PaisDataService } from '../pais-data.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-paises-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './paises-list.component.html',
  styleUrls: ['./paises-list.component.css']
})
export class PaisesListComponent implements OnInit {
  paises: Pais[] = [];

  constructor(
    private paisDataService: PaisDataService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.http.get<Pais[]>('http://localhost:3000/paises') // Obtener datos de la API
      .subscribe(data => {
        this.paises = data;
      });
  }

  seleccionarPais(pais: Pais) {
    this.paisDataService.setPais(pais);
    this.router.navigate(['/pais']);
  }
}
