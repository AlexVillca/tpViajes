import { Component } from '@angular/core';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent {
  email: string = "drarroundtheworld@gmail.com"

  videoLoaded = false;

  // Esta función se llama cuando el video se carga completamente
  onVideoLoaded() {
    this.videoLoaded = true;
    setTimeout(() => {

    }, 200);  // Se espera 200ms para asegurarse de que todo se renderice correctamente
  }

  containerVisible = false;

  ngOnInit() {
    // Activa la clase después de un breve retraso
    setTimeout(() => {
      this.containerVisible = true;
    }, 200); // Retraso en milisegundos
  }

  onSubmit(event: Event) {
    event.preventDefault(); // Evita el comportamiento predeterminado del formulario
    console.log("Formulario enviado (simulado)");
    alert("¡Gracias por tu mensaje! Pronto nos pondremos en contacto contigo.");
  }
}
