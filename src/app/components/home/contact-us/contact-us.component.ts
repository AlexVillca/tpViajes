import { Component, inject } from '@angular/core';
import { FeedbackService } from '../../../core/service/feedback.service';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent {
  email: string = "drarroundtheworld@gmail.com"
  feedback = inject(FeedbackService);

  videoLoaded = false;

  // Esta funcion se llama cuando el video se carga completamente.
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

  onSubmit(event: Event) {
    event.preventDefault();
    console.log("Formulario enviado (simulado)");
    this.feedback.success('Gracias por tu mensaje. Pronto nos pondremos en contacto contigo.');
  }
}
