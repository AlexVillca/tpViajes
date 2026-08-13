import { Component } from '@angular/core';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.css'
})
export class AboutUsComponent {

  videoLoaded = false;

  onVideoLoaded() {
    this.videoLoaded = true;
    setTimeout(() => {

    }, 200);
  }
  containerVisible = false;

  ngOnInit() {
    setTimeout(() => {
      this.containerVisible = true;
    }, 200);
  }

}
