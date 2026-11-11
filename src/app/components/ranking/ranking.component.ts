import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UsuariosService, RankingItem } from '../../core/service/usuarios.service';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './ranking.component.html'
})
export class RankingComponent implements OnInit {
  private readonly usuarios = inject(UsuariosService);

  ranking: RankingItem[] = [];
  cargando = true;
  error = '';
  readonly medallas = ['🥇', '🥈', '🥉'];

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.usuarios.getRanking(10).subscribe({
      next: (ranking) => { this.ranking = ranking; this.cargando = false; },
      error: (e: Error) => { this.error = e.message; this.cargando = false; }
    });
  }
}
