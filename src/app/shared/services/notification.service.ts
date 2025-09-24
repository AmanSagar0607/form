import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'default';

export interface AlertOptions {
  type?: AlertType;
  title: string;
  description: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private defaultDuration = 5000; // 5 seconds
  private alerts$ = new Subject<AlertOptions>();

  /**
   * Show an alert with the given options
   */
  showAlert(options: AlertOptions): void {
    // Set default values
    if (options.duration === undefined) {
      options.duration = this.defaultDuration;
    }
    
    // Emit the alert to subscribers
    this.alerts$.next(options);
  }

  /**
   * Subscribe to alerts
   */
  getAlerts() {
    return this.alerts$.asObservable();
  }

  // Helper methods for different alert types
  success(title: string, description: string, duration?: number): void {
    this.showAlert({ type: 'success', title, description, duration });
  }

  error(title: string, description: string, duration?: number): void {
    this.showAlert({ type: 'error', title, description, duration });
  }

  info(title: string, description: string, duration?: number): void {
    this.showAlert({ type: 'info', title, description, duration });
  }

  warning(title: string, description: string, duration?: number): void {
    this.showAlert({ type: 'warning', title, description, duration });
  }
}
