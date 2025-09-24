import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationService } from './shared/services/location.service';
import { LocationNode } from './shared/models/location.model';
import { LocationTreeComponent } from './shared/components/location-tree/location-tree.component';
import { TransferRequestComponent, TransferRequestForm as TRForm } from './shared/components/transfer-request/transfer-request.component';
import { Subscription } from 'rxjs';
import { TransferService } from './shared/services/transfer.service';

export interface TransferRequestForm {
  sourceId: string;
  targetIds: string[];
  reason: string;
  includeFood: boolean;
  code: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LocationTreeComponent,
    TransferRequestComponent
  ],
  template: `
    <!-- Navbar -->
    <nav class="bg-white shadow-sm border-b border-gray-200" style="min-height: 4rem;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center" style="height: 4rem;">
          <div class="flex-shrink-0 flex items-center">
            <span class="text-xl font-bold text-gray-900">Location Management System</span>
          </div>

    <!-- Minimized bar (taskbar-like) -->
    <div *ngIf="showTransferModal && modalState==='minimized'"
         class="fixed bottom-4 left-4 z-50">
      <button (click)="onMinimize()" class="px-3 py-2 bg-white shadow rounded border text-sm font-medium hover:bg-gray-50">
        Transfer Location
      </button>
    </div>
          <div class="hidden sm:flex sm:items-center" style="gap: 2rem;">
            <a href="#" class="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap">Home</a>
            <button (click)="onTransfersClick()" class="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap">Transfers</button>
            <a href="#" class="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap">Reports</a>
          </div>
        </div>
      </div>
    </nav>

    <!-- Transfer Request Modal (Component) -->
    <app-transfer-request
      *ngIf="showTransferModal"
      [isVisible]="showTransferModal"
      [locations]="locations"
      (close)="showTransferModal=false"
      (submit)="handleTransferSubmit($event)">
    </app-transfer-request>

    <!-- Main Application Content -->
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div class="max-w-6xl mx-auto">
        <div class="mb-8 text-center">
          <p class="text-gray-600">Manage your locations and resources</p>
        </div>

        <div class="grid grid-cols-1 gap-6">
          <div class="space-y-6">
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="p-4 border-b">
                <h2 class="text-xl font-semibold">Location Hierarchy</h2>
                <p class="text-sm text-gray-500">Click on a location to select it</p>
              </div>
              <div class="p-4">
                <app-location-tree [nodes]="locations" (nodeClick)="onNodeClick($event)"></app-location-tree>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    .transfer-modal { will-change: transform,left,top; }
    .transfer-modal.maximized {
      left: 16px !important;
      top: 16px !important;
      width: calc(100vw - 32px) !important;
      height: calc(100vh - 32px) !important;
      max-width: none !important;
      max-height: none !important;
    }
    .transfer-modal.minimized {
      left: 16px !important;
      top: auto !important;
      bottom: 16px;
      width: 360px !important;
      height: 48px !important;
      overflow: hidden;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  locations: LocationNode[] = [];
  selectedNode: LocationNode | null = null;
  showTransferModal = false;
  modalState: 'normal' | 'maximized' | 'minimized' = 'normal';
  formData: TransferRequestForm = {
    sourceId: '',
    targetIds: [],
    reason: '',
    includeFood: false,
    code: ''
  };

  private subscription?: Subscription;
  modalPosition = { x: 0, y: 0 };
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private moveListener?: (e: MouseEvent) => void;
  private upListener?: (e: MouseEvent) => void;
  private lastNormalPosition = { x: 0, y: 0 };

  constructor(
    private locationService: LocationService,
    private transferService: TransferService
  ) {}

  ngOnInit() {
    this.subscription = this.locationService.locations$.subscribe({
      next: (locations: LocationNode[]) => {
        this.locations = locations || [];
      },
      error: (error: any) => {
        console.error('Error loading locations:', error);
      }
    });
  }

  onNodeClick(node: LocationNode): void {
    this.selectedNode = node;
  }

  onTransfersClick() {
    this.showTransferModal = true;
    // Set initial position if not already set
    if (this.modalPosition.x === 0 && this.modalPosition.y === 0) {
      // Center-ish default; can be adjusted based on viewport
      this.modalPosition.x = Math.max(40, Math.floor(window.innerWidth / 2 - 360));
      this.modalPosition.y = Math.max(40, Math.floor(window.innerHeight / 2 - 260));
    }
    this.modalState = 'normal';
    this.lastNormalPosition = { ...this.modalPosition };
  }

  onDragMouseDown(event: MouseEvent) {
    if (this.modalState !== 'normal') return; // disable drag when maximized/minimized
    this.isDragging = true;
    document.body.style.userSelect = 'none';
    const headerEl = event.currentTarget as HTMLElement;
    const modalEl = headerEl.closest('.transfer-modal') as HTMLElement;
    const rect = modalEl.getBoundingClientRect();
    this.dragOffset.x = event.clientX - rect.left;
    this.dragOffset.y = event.clientY - rect.top;

    this.moveListener = (e: MouseEvent) => {
      if (!this.isDragging) return;
      // Constrain within viewport
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = rect.width;
      const height = rect.height;
      const nextX = e.clientX - this.dragOffset.x;
      const nextY = e.clientY - this.dragOffset.y;
      this.modalPosition.x = Math.min(Math.max(0, nextX), Math.max(0, vw - width));
      this.modalPosition.y = Math.min(Math.max(0, nextY), Math.max(0, vh - height));
    };
    this.upListener = () => {
      this.isDragging = false;
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', this.moveListener!);
      window.removeEventListener('mouseup', this.upListener!);
      this.lastNormalPosition = { ...this.modalPosition };
    };

    window.addEventListener('mousemove', this.moveListener, { passive: true });
    window.addEventListener('mouseup', this.upListener, { passive: true });
  }

  onMinimize() {
    this.modalState = this.modalState === 'minimized' ? 'normal' : 'minimized';
    if (this.modalState === 'normal') {
      // restore to last normal spot
      this.modalPosition = { ...this.lastNormalPosition };
    }
  }

  onMaximizeToggle() {
    if (this.modalState === 'maximized') {
      this.modalState = 'normal';
      // restore normal position
      this.modalPosition = { ...this.lastNormalPosition };
    } else {
      if (this.modalState === 'normal') {
        this.lastNormalPosition = { ...this.modalPosition };
      }
      this.modalState = 'maximized';
      // snap to margins handled by CSS class
    }
  }

  // Close on Esc key for standard UX
  @HostListener('window:keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent) {
    if (!this.showTransferModal) return;
    if (ev.key === 'Escape') {
      this.showTransferModal = false;
    }
  }

  onTargetChange(locationId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.formData.targetIds.push(locationId);
    } else {
      this.formData.targetIds = this.formData.targetIds.filter(id => id !== locationId);
    }
  }

  onTransferSubmit(formData: TransferRequestForm) {
    const source = this.locations.find(l => l.id === formData.sourceId);
    const targets = this.locations.filter(l => formData.targetIds.includes(l.id));

    console.log('Transfer Request Submitted:', {
      source: source?.name,
      targets: targets.map(t => t.name),
      reason: formData.reason,
      includeFood: formData.includeFood,
      code: formData.code
    });

    targets.forEach(target => {
      this.transferService.requestTransfer(
        source!,
        target,
        'Admin',
        formData.reason,
        formData.includeFood
      );
    });

    this.showTransferModal = false;
    this.formData = {
      sourceId: '',
      targetIds: [],
      reason: '',
      includeFood: false,
      code: ''
    };
  }

  // Handle submission from TransferRequestComponent
  handleTransferSubmit(form: TRForm) {
    const source = this.findNodeById(this.locations, form.sourceId);
    if (!source) {
      console.error('Source node not found for id:', form.sourceId);
      return;
    }
    const targetCountryId = form.targetIds?.[0];
    const target = this.locations.find(n => n.id === targetCountryId) || null;
    if (!target) {
      console.error('Target country not found for id:', targetCountryId);
      return;
    }

    console.log('Transfer Request (component) Submitted:', {
      source: `${source.name} (${source.type})`,
      target: `${target.name} (${target.type})`,
      reason: form.reason,
      includeFood: form.includeFood,
      code: form.code
    });

    this.transferService.requestTransfer(
      source,
      target,
      'Admin',
      form.reason,
      form.includeFood
    );
    this.showTransferModal = false;
  }

  private findNodeById(nodes: LocationNode[], id: string | undefined | null): LocationNode | null {
    if (!id) return null;
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children && node.children.length) {
        const found = this.findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
