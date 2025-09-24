import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationNode } from '../../models/location.model';
import { LocationService } from '../../services/location.service';
import { Subscription } from 'rxjs';

export interface TransferRequestForm {
  sourceId: string;
  targetIds: string[];
  reason: string;
  includeFood: boolean;
  code: string;
}

@Component({
  selector: 'app-transfer-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4"
         *ngIf="isVisible"
         (click)="onBackdropClick($event)">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
           [class.dragging]="isDragging"
           [style.transform]="transformStyle">

        <!-- Header with drag handle -->
        <div class="bg-blue-600 text-white p-4 cursor-move flex justify-between items-center select-none"
             (mousedown)="onMouseDown($event)">
          <div>
            <h2 class="text-xl font-bold">Transfer Location</h2>
            <p class="text-blue-100 text-sm">Transfer Request</p>
          </div>

          <!-- Window controls -->
          <div class="flex items-center space-x-2">
            <button
              (click)="onClose()"
              class="hover:bg-red-600 p-1 rounded transition-colors"
              title="Close">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Form Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]" *ngIf="!isMinimized">
          <form (ngSubmit)="onSubmit()" #transferForm="ngForm">

            <!-- Source Country -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Source Country: <span class="text-red-500">*</span></label>
              <select
                [(ngModel)]="selectedSourceCountryId"
                name="sourceCountryId"
                (ngModelChange)="onSourceCountryChange()"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select country</option>
                <option *ngFor="let c of countries" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <!-- Source Item within selected country (cascading selects) -->
            <div class="mb-6" *ngIf="selectedSourceCountryId">
              <label class="block text-sm font-medium text-gray-700 mb-2">From (inside selected country): <span class="text-red-500">*</span></label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- State -->
                <div>
                  <label class="text-xs text-gray-600 mb-1 block">State</label>
                  <select
                    [(ngModel)]="selectedStateId"
                    name="sourceStateId"
                    (ngModelChange)="onStateChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select state</option>
                    <option *ngFor="let s of sourceStates; trackBy: trackById" [value]="s.id">{{ s.name }}</option>
                  </select>
                  <div *ngIf="sourceStates?.length === 0" class="text-xs text-amber-600 mt-1">No states found for selected country.</div>
                </div>
                <!-- City -->
                <div *ngIf="selectedStateId">
                  <label class="text-xs text-gray-600 mb-1 block">City</label>
                  <select
                    [(ngModel)]="selectedCityId"
                    name="sourceCityId"
                    (ngModelChange)="onCityChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select city</option>
                    <option *ngFor="let c of sourceCities; trackBy: trackById" [value]="c.id">{{ c.name }}</option>
                  </select>
                  <div *ngIf="sourceCities?.length === 0" class="text-xs text-amber-600 mt-1">No cities found for selected state.</div>
                </div>
                <!-- District -->
                <div *ngIf="selectedCityId">
                  <label class="text-xs text-gray-600 mb-1 block">District</label>
                  <select
                    [(ngModel)]="selectedDistrictId"
                    name="sourceDistrictId"
                    (ngModelChange)="onDistrictChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select district</option>
                    <option *ngFor="let d of sourceDistricts; trackBy: trackById" [value]="d.id">{{ d.name }}</option>
                  </select>
                  <div *ngIf="sourceDistricts?.length === 0" class="text-xs text-amber-600 mt-1">No districts found for selected city.</div>
                </div>
                <!-- Block -->
                <div *ngIf="selectedDistrictId">
                  <label class="text-xs text-gray-600 mb-1 block">Block</label>
                  <select
                    [(ngModel)]="selectedBlockId"
                    name="sourceBlockId"
                    (ngModelChange)="onBlockChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select block</option>
                    <option *ngFor="let b of sourceBlocks; trackBy: trackById" [value]="b.id">{{ b.name }}</option>
                  </select>
                  <div *ngIf="sourceBlocks?.length === 0" class="text-xs text-amber-600 mt-1">No blocks found for selected district.</div>
                </div>
                <!-- Gram Panchayat -->
                <div *ngIf="selectedBlockId">
                  <label class="text-xs text-gray-600 mb-1 block">Gram Panchayat</label>
                  <select
                    [(ngModel)]="selectedGpId"
                    name="sourceGpId"
                    (ngModelChange)="onGpChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select gram panchayat</option>
                    <option *ngFor="let g of sourceGps; trackBy: trackById" [value]="g.id">{{ g.name }}</option>
                  </select>
                  <div *ngIf="sourceGps?.length === 0" class="text-xs text-amber-600 mt-1">No gram panchayats found for selected block.</div>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">Pick exactly one item (State/City/District/Block/Gram Panchayat) to transfer.</p>
            </div>

            <!-- Target Country (single) -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Target Country: <span class="text-red-500">*</span></label>
              <select
                [(ngModel)]="selectedTargetCountryId"
                name="targetCountryId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select target country</option>
                <option *ngFor="let c of countries" [value]="c.id" [disabled]="c.id === selectedSourceCountryId">{{ c.name }}</option>
              </select>
            </div>

            <!-- Reason for Transfer -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Reason for Transfer: <span class="text-red-500">*</span>
              </label>
              <textarea
                [(ngModel)]="formData.reason"
                name="reason"
                required
                rows="3"
                placeholder="Enter reason for transfer..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none">
              </textarea>
            </div>

            <!-- Resources -->
            <div class="mb-6">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  [(ngModel)]="formData.includeFood"
                  name="includeFood"
                  class="mr-2">
                <span class="text-sm font-medium text-gray-700">Transfer resources (Food)</span>
              </label>
            </div>

            <!-- Code -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Code: <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="formData.code"
                name="code"
                required
                placeholder="Enter transfer code"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                (click)="onCancel()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!isValid()"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                Submit Request
              </button>
            </div>
          </form>
        </div>

        <!-- Minimized State -->
        <div *ngIf="isMinimized" class="p-3 text-center">
          <p class="text-sm text-gray-600">Transfer Request Form (Minimized)</p>
          <button
            (click)="onMaximize()"
            class="text-xs text-blue-600 hover:text-blue-800 mt-1">
            Click to restore
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dragging {
      transition: none;
      user-select: none;
      cursor: move;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      z-index: 60;
    }

    .cursor-move {
      cursor: move;
    }

    /* Custom scrollbar */
    .max-h-32::-webkit-scrollbar {
      width: 6px;
    }

    .max-h-32::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    .max-h-32::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .max-h-32::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    /* Smooth transitions */
    .bg-white {
      transition: box-shadow 0.2s ease;
    }

    /* Prevent text selection during drag */
    .select-none {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
  `]
})
export class TransferRequestComponent implements OnInit, OnDestroy {
  @Input() isVisible = false;
  @Input() locations: LocationNode[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<TransferRequestForm>();

  formData: TransferRequestForm = {
    sourceId: '',
    targetIds: [],
    reason: '',
    includeFood: false,
    code: ''
  };

  isMinimized = false;
  isDragging = false;
  dragOffset = { x: 0, y: 0 };

  // Local selection state
  selectedSourceCountryId = '';
  selectedTargetCountryId = '';
  selectedStateId = '';
  selectedCityId = '';
  selectedDistrictId = '';
  selectedBlockId = '';
  selectedGpId = '';

  get transformStyle(): string {
    return `translate(${this.dragOffset.x}px, ${this.dragOffset.y}px)`;
  }

  ngOnInit() {
    // If locations are not provided by parent, subscribe to LocationService
    const lacksChildren = Array.isArray(this.locations)
      && this.locations.length > 0
      && !((this.locations[0] && this.locations[0].children && this.locations[0].children.length > 0));

    if (!this.locations || this.locations.length === 0 || lacksChildren) {
      this.locationsSub = this.locationService.locations$.subscribe(locs => {
        this.locations = locs || [];
        // Default-select first country if not chosen yet
        if (!this.selectedSourceCountryId && this.countries.length > 0) {
          this.selectedSourceCountryId = this.countries[0].id;
        }
      });
    }
    // If parent already provided locations, also default-select first country
    if (this.locations && this.locations.length > 0 && !this.selectedSourceCountryId && this.countries.length > 0) {
      this.selectedSourceCountryId = this.countries[0].id;
    }

    // Debug info to help verify hierarchy
    try {
      const first = this.locations?.[0];
      // eslint-disable-next-line no-console
      console.debug('[TransferRequest] locations count:', this.locations?.length, 'first has children:', !!first?.children?.length);
    } catch {}
  }

  ngOnDestroy() {
    this.locationsSub?.unsubscribe();
  }

  onSubmit() {
    // Project selected values into formData
    this.formData.sourceId = this.computeSelectedSourceNodeId() || '';
    this.formData.targetIds = this.selectedTargetCountryId ? [this.selectedTargetCountryId] : [];

    if (this.isValid()) {
      this.submit.emit({ ...this.formData });
      this.resetForm();
      this.onClose();
    }
  }

  onCancel() {
    this.resetForm();
    this.onClose();
  }

  onClose() {
    this.close.emit();
  }

  onMinimize() {
    this.isMinimized = true;
  }

  onMaximize() {
    this.isMinimized = false;
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onMouseDown(event: MouseEvent) {
    if (event.button === 0) { // Left mouse button
      this.isDragging = true;
      const rect = (event.target as HTMLElement).closest('.bg-white')?.getBoundingClientRect();
      if (rect) {
        this.dragOffset = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
      }
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onMouseUp() {
    this.isDragging = false;
  }

  // Global mouse event handlers for smoother dragging
  private onGlobalMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const newX = event.clientX - this.dragOffset.x;
      const newY = event.clientY - this.dragOffset.y;

      // Constrain to viewport with some margin
      const maxX = window.innerWidth - 450; // Modal width + margin
      const maxY = window.innerHeight - 250; // Modal height + margin

      this.dragOffset = {
        x: Math.max(20, Math.min(newX, maxX)),
        y: Math.max(20, Math.min(newY, maxY))
      };

      event.preventDefault();
    }
  }

  private onGlobalMouseUp() {
    this.isDragging = false;
  }

  private resetForm() {
    this.formData = {
      sourceId: '',
      targetIds: [],
      reason: '',
      includeFood: false,
      code: ''
    };
    this.selectedSourceCountryId = '';
    this.selectedTargetCountryId = '';
    this.selectedStateId = '';
    this.selectedCityId = '';
    this.selectedDistrictId = '';
    this.selectedBlockId = '';
    this.selectedGpId = '';
  }

  // Derived data helpers
  get countries(): LocationNode[] {
    return (this.locations || []).filter(n => n.type === 'country');
  }

  // Cascading collections
  get sourceStates(): LocationNode[] {
    const c = this.countries.find(x => x.id === this.selectedSourceCountryId);
    return c?.children || [];
  }
  get sourceCities(): LocationNode[] {
    const s = this.sourceStates.find(x => x.id === this.selectedStateId);
    return s?.children || [];
  }
  get sourceDistricts(): LocationNode[] {
    const c = this.sourceCities.find(x => x.id === this.selectedCityId);
    return c?.children || [];
  }
  get sourceBlocks(): LocationNode[] {
    const d = this.sourceDistricts.find(x => x.id === this.selectedDistrictId);
    return d?.children || [];
  }
  get sourceGps(): LocationNode[] {
    const b = this.sourceBlocks.find(x => x.id === this.selectedBlockId);
    return b?.children || [];
  }

  // Change handlers to reset downstream
  onStateChange() {
    this.selectedCityId = '';
    this.selectedDistrictId = '';
    this.selectedBlockId = '';
    this.selectedGpId = '';
  }
  onCityChange() {
    this.selectedDistrictId = '';
    this.selectedBlockId = '';
    this.selectedGpId = '';
  }
  onDistrictChange() {
    this.selectedBlockId = '';
    this.selectedGpId = '';
  }
  onBlockChange() {
    this.selectedGpId = '';
  }
  onGpChange() {}

  onSourceCountryChange() {
    this.selectedStateId = '';
    this.selectedCityId = '';
    this.selectedDistrictId = '';
    this.selectedBlockId = '';
    this.selectedGpId = '';
  }

  private computeSelectedSourceNodeId(): string {
    return this.selectedGpId || this.selectedBlockId || this.selectedDistrictId || this.selectedCityId || this.selectedStateId || '';
  }

  isValid(): boolean {
    const notSameCountry = !this.selectedSourceCountryId || !this.selectedTargetCountryId || this.selectedSourceCountryId !== this.selectedTargetCountryId;
    const sourceNodeId = this.computeSelectedSourceNodeId();
    return !!this.selectedSourceCountryId && !!sourceNodeId && !!this.selectedTargetCountryId && notSameCountry && !!this.formData.reason?.trim() && !!this.formData.code?.trim();
  }

  // TrackBy helpers
  trackById(_index: number, item: LocationNode) { return item.id; }

  private locationsSub?: Subscription;

  constructor(private locationService: LocationService) {}
}
