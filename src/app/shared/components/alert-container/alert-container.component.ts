import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardAlertComponent } from '../alert/alert.component';
import { NotificationService, AlertOptions } from '../../services/notification.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface Alert extends AlertOptions {
  id: number;
}

@Component({
  selector: 'app-alert-container',
  standalone: true,
  imports: [CommonModule, ZardAlertComponent],
  template: `
    <div class="fixed bottom-4 right-4 z-50 w-80 space-y-2">
      <z-alert
        *ngFor="let alert of alerts"
        [zTitle]="alert.title"
        [zDescription]="alert.description"
        [zType]="alert.type || 'info'"
        [zAppearance]="'outline'"
        class="border-2 shadow-lg shadow-gray-300/50 border-gray-200 bg-white/95 backdrop-blur-sm animate-fade-in-up"
      ></z-alert>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Enhanced shadow for different alert types */
    z-alert[data-type="success"] {
      box-shadow: 0 10px 25px -5px rgba(34, 197, 94, 0.1), 0 4px 6px -2px rgba(34, 197, 94, 0.05);
    }
    z-alert[data-type="error"] {
      box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.1), 0 4px 6px -2px rgba(239, 68, 68, 0.05);
    }
    z-alert[data-type="warning"] {
      box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.1), 0 4px 6px -2px rgba(245, 158, 11, 0.05);
    }
    z-alert[data-type="info"] {
      box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05);
    }
  `]
})
export class AlertContainerComponent implements OnDestroy {
  alerts: Alert[] = [];
  private nextId = 0;
  private timers: Map<number, any> = new Map();

  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {
    // Subscribe to the notification service
    this.notificationService.getAlerts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(alert => {
        this.showAlert(alert);
      });
  }

  private showAlert(options: AlertOptions): void {
    const id = this.nextId++;
    const alert = { ...options, id };
    
    // Add the alert to the array
    this.alerts = [...this.alerts, alert];
    
    // Set a timer to remove the alert
    const duration = options.duration || 3000;
    const timer = setTimeout(() => {
      this.removeAlert(id);
    }, duration);
    
    this.timers.set(id, timer);
  }

  private removeAlert(id: number): void {
    // Clear the timer
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id));
      this.timers.delete(id);
    }
    
    // Remove the alert from the array
    this.alerts = this.alerts.filter(alert => alert.id !== id);
  }

  ngOnDestroy(): void {
    // Clear all timers and complete the subject
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
