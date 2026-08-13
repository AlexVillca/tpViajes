import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FeedbackService } from '../../../core/service/feedback.service';

@Component({
  selector: 'app-feedback-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback-toast.component.html',
  styleUrl: './feedback-toast.component.css'
})
export class FeedbackToastComponent {
  feedback = inject(FeedbackService);
}
