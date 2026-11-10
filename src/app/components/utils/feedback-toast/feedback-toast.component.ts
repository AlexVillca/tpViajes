import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FeedbackService } from '../../../core/service/feedback.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-feedback-toast',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './feedback-toast.component.html'
})
export class FeedbackToastComponent {
  feedback = inject(FeedbackService);
}
