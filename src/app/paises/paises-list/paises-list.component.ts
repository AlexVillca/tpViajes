import { Component, OnInit } from '@angular/core';
import { PaisesService } from '../paises.service';
import { CommonModule } from '@angular/common'; // Importar CommonModule para usar *ngFor
import { HttpClientModule } from '@angular/common/http'; // Importar HttpClientModule
import { Pais } from '../pais';

@Component({
  selector: 'app-paises-list',
  standalone: true, // Indicar que es un componente standalone
  imports: [CommonModule, HttpClientModule], // Importar los módulos necesarios
  templateUrl: './paises-list.component.html',
  styleUrls: ['./paises-list.component.css']
})

export class PaisesListComponent implements OnInit {
  paises:  
 Pais[] = [];

  constructor(private paisesService: PaisesService) { }

  ngOnInit(): void {
    this.paisesService.getPaises().subscribe(data => {
      this.paises = data;  

    });
  }

}
