import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaisDataService } from '../pais-data.service';

@Component({
  selector: 'app-pais-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pais-detail.component.html',
  styleUrls: ['./pais-detail.component.css']
})
export class PaisDetailComponent {
  pais$ = this.paisDataService.pais$;

  constructor(private paisDataService: PaisDataService) { }
}
