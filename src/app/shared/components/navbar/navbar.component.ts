import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="bg-white shadow-sm border-b border-gray-200" style="min-height: 4rem;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center" style="height: 4rem;">
          <div class="flex-shrink-0 flex items-center">
            <span class="text-xl font-bold text-gray-900">{{ title || 'Location Management System' }}</span>
          </div>
          <div class="hidden sm:flex sm:items-center" style="gap: 2rem;">
            <a href="#" class="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap">Home</a>
            <button (click)="onTransfersClick()" class="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap">Transfers</button>
            <a href="#" class="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap">Reports</a>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    /* Ensure proper spacing and prevent text overlap */
    nav {
      position: relative;
      z-index: 10;
    }

    .flex {
      display: flex;
    }

    .justify-between {
      justify-content: space-between;
    }

    /* Fix for any potential text overflow issues */
    .text-xl {
      font-size: 1.25rem;
      line-height: 1.75rem;
    }

    /* Ensure navigation items are properly spaced */
    .space-x-8 > * + * {
      margin-left: 2rem;
    }
  `]
})
export class NavbarComponent {
  @Input() title: string = 'Location Management System';
  @Output() transfersClick = new EventEmitter<void>();

  onTransfersClick() {
    this.transfersClick.emit();
  }
}
