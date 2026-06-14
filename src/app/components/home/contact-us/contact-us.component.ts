import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeedbackService } from '../../../core/service/feedback.service';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent {
  email: string = "drarroundtheworld@gmail.com"
  feedback = inject(FeedbackService);
  fb = inject(FormBuilder);

  formulario = this.fb.nonNullable.group({
    // Son validaciones simples, pero suficientes para que el usuario vea
    // que corregir debajo de cada campo.
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

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

  onSubmit() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.feedback.success('Gracias por tu mensaje. Pronto nos pondremos en contacto contigo.');
    this.formulario.reset({
      name: '',
      email: '',
      message: ''
    });
  }
}
