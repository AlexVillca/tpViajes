import { MapComponent } from './../map/map.component';
import { Component } from '@angular/core';

import { GameComponent } from '../../game/game.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
