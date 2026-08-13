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
  videoLoaded = false;

  onVideoLoaded() {
    this.videoLoaded = true;
    setTimeout(() => {
      const buttons = document.querySelectorAll('button');

      buttons.forEach((button) => {
        button.classList.add('visible');
      });
    }, 200);
  }
  containerVisible = false;

  ngOnInit() {
    setTimeout(() => {
      this.containerVisible = true;
    }, 200);
  }
}
