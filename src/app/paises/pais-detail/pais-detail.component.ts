import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaisesService } from '../paises.service';
import { Pais } from '../pais'
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pais-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pais-detail.component.html',
  styleUrl: './pais-detail.component.css'
})

export class PaisDetailComponent implements OnInit {
  pais!: Pais;

  constructor(
    private route: ActivatedRoute,
    private paisesService: PaisesService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const codigo = params['codigo'];
      this.paisesService.getPais(codigo).subscribe(pais => this.pais = pais);
    });
  }
}
