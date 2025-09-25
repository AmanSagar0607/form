import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
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
  sourceTfCode?: string;
  targetTfCode?: string;
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
              </div>
              <p class="text-xs text-gray-500 mt-2">Pick exactly one item (State/City/District/Block) to transfer.</p>
            </div>

            <!-- Target Country (single) -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Target Country: <span class="text-red-500">*</span></label>
              <select
                [(ngModel)]="selectedTargetCountryId"
                name="targetCountryId"
                (ngModelChange)="onTargetCountryChange()"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select target country</option>
                <option *ngFor="let c of countries" [value]="c.id" [disabled]="c.id === selectedSourceCountryId">{{ c.name }}</option>
              </select>
            </div>

            <!-- Target Item within selected country (cascading selects) -->
            <div class="mb-6" *ngIf="selectedTargetCountryId">
              <label class="block text-sm font-medium text-gray-700 mb-2">To (inside selected country): <span class="text-red-500">*</span></label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- State -->
                <div>
                  <label class="text-xs text-gray-600 mb-1 block">State</label>
                  <select
                    [(ngModel)]="selectedTargetStateId"
                    name="targetStateId"
                    (ngModelChange)="onTargetStateChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select state</option>
                    <option *ngFor="let s of targetStates; trackBy: trackById" [value]="s.id">{{ s.name }}</option>
                  </select>
                  <div *ngIf="targetStates?.length === 0" class="text-xs text-amber-600 mt-1">No states found for selected country.</div>
                </div>
                <!-- City -->
                <div *ngIf="selectedTargetStateId">
                  <label class="text-xs text-gray-600 mb-1 block">City</label>
                  <select
                    [(ngModel)]="selectedTargetCityId"
                    name="targetCityId"
                    (ngModelChange)="onTargetCityChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select city</option>
                    <option *ngFor="let c of targetCities; trackBy: trackById" [value]="c.id">{{ c.name }}</option>
                  </select>
                  <div *ngIf="targetCities?.length === 0" class="text-xs text-amber-600 mt-1">No cities found for selected state.</div>
                </div>
                <!-- District -->
                <div *ngIf="selectedTargetCityId">
                  <label class="text-xs text-gray-600 mb-1 block">District</label>
                  <select
                    [(ngModel)]="selectedTargetDistrictId"
                    name="targetDistrictId"
                    (ngModelChange)="onTargetDistrictChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select district</option>
                    <option *ngFor="let d of targetDistricts; trackBy: trackById" [value]="d.id">{{ d.name }}</option>
                  </select>
                  <div *ngIf="targetDistricts?.length === 0" class="text-xs text-amber-600 mt-1">No districts found for selected city.</div>
                </div>
                <!-- Block -->
                <div *ngIf="selectedTargetDistrictId">
                  <label class="text-xs text-gray-600 mb-1 block">Block</label>
                  <select
                    [(ngModel)]="selectedTargetBlockId"
                    name="targetBlockId"
                    (ngModelChange)="onTargetBlockChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select block</option>
                    <option *ngFor="let b of targetBlocks; trackBy: trackById" [value]="b.id">{{ b.name }}</option>
                  </select>
                  <div *ngIf="targetBlocks?.length === 0" class="text-xs text-amber-600 mt-1">No blocks found for selected district.</div>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">Pick exactly one destination (State/City/District/Block).</p>
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

            <!-- TF Codes (auto-generated, read-only) -->
            <div class="mb-6 space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">From (Source) TF Code</label>
                <input type="text" [value]="sourceTfCode" readonly class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">To (Target) TF Code</label>
                <input type="text" [value]="targetTfCode" readonly class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Final TF Code (auto-generated)</label>
                <input
                  type="text"
                  [value]="tfCodePreview"
                  name="code"
                  readonly
                  class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none">
                <p class="mt-1 text-xs text-gray-500">Format: C(1) + S(2) + City(3) + Block(4). Missing levels are zero-padded.</p>
              </div>
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
  @Output() transferSubmit = new EventEmitter<TransferRequestForm>();

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
  // Target cascading state
  selectedTargetStateId = '';
  selectedTargetCityId = '';
  selectedTargetDistrictId = '';
  selectedTargetBlockId = '';

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
    const targetId = this.computeSelectedTargetNodeId();
    this.formData.targetIds = targetId ? [targetId] : [];
    // Auto-generate TF code
    this.formData.code = this.computeTfCode();
    // Also include individual source/target codes for logging
    this.formData.sourceTfCode = this.sourceTfCode;
    this.formData.targetTfCode = this.targetTfCode;

    if (this.isValid()) {
      this.transferSubmit.emit({ ...this.formData });
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
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
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
    // Restore text selection after drag
    document.body.style.userSelect = '';
  }

  // Wire global listeners so drag continues outside the header area
  @HostListener('window:mousemove', ['$event'])
  handleWindowMouseMove(ev: MouseEvent) {
    this.onGlobalMouseMove(ev);
  }

  @HostListener('window:mouseup')
  handleWindowMouseUp() {
    this.onGlobalMouseUp();
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
    this.selectedTargetStateId = '';
    this.selectedTargetCityId = '';
    this.selectedTargetDistrictId = '';
    this.selectedTargetBlockId = '';
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

  // Target cascading collections
  get targetStates(): LocationNode[] {
    const c = this.countries.find(x => x.id === this.selectedTargetCountryId);
    return c?.children || [];
  }
  get targetCities(): LocationNode[] {
    const s = this.targetStates.find(x => x.id === this.selectedTargetStateId);
    return s?.children || [];
  }
  get targetDistricts(): LocationNode[] {
    const c = this.targetCities.find(x => x.id === this.selectedTargetCityId);
    return c?.children || [];
  }
  get targetBlocks(): LocationNode[] {
    const d = this.targetDistricts.find(x => x.id === this.selectedTargetDistrictId);
    return d?.children || [];
  }

  // Change handlers to reset downstream
  onStateChange() {
    this.selectedCityId = '';
    this.selectedDistrictId = '';
    this.selectedBlockId = '';
  }
  onCityChange() {
    this.selectedDistrictId = '';
    this.selectedBlockId = '';
  }
  onDistrictChange() {
    this.selectedBlockId = '';
  }
  onBlockChange() {
  }
  

  // Target change handlers
  onTargetStateChange() {
    this.selectedTargetCityId = '';
    this.selectedTargetDistrictId = '';
    this.selectedTargetBlockId = '';
  }
  onTargetCityChange() {
    this.selectedTargetDistrictId = '';
    this.selectedTargetBlockId = '';
  }
  onTargetDistrictChange() {
    this.selectedTargetBlockId = '';
  }
  onTargetBlockChange() {
  }

  onSourceCountryChange() {
    this.selectedStateId = '';
    this.selectedCityId = '';
    this.selectedDistrictId = '';
    this.selectedBlockId = '';
  }

  onTargetCountryChange() {
    this.selectedTargetStateId = '';
    this.selectedTargetCityId = '';
    this.selectedTargetDistrictId = '';
    this.selectedTargetBlockId = '';
  }

  private computeSelectedSourceNodeId(): string {
    return this.selectedBlockId || this.selectedDistrictId || this.selectedCityId || this.selectedStateId || '';
  }
  private computeSelectedTargetNodeId(): string {
    return this.selectedTargetBlockId || this.selectedTargetDistrictId || this.selectedTargetCityId || this.selectedTargetStateId || '';
  }

  // Auto TF code: C(1) + S(2) + City(3) + Block(4)
  private pad(num: number, len: number): string {
    if (!Number.isFinite(num) || num <= 0) return ''.padStart(len, '0');
    const s = String(num);
    return s.length >= len ? s.slice(-len) : s.padStart(len, '0');
  }
  private indexIn(list: LocationNode[] | undefined, id: string | undefined): number {
    if (!list || !id) return 0;
    const idx = list.findIndex(x => x.id === id);
    return idx >= 0 ? idx + 1 : 0; // 1-based
    }
  get tfCodePreview(): string {
    return this.computeTfCode();
  }
  get sourceTfCode(): string {
    const sC = this.indexIn(this.countries, this.selectedSourceCountryId);
    const sS = this.indexIn(this.sourceStates, this.selectedStateId);
    const sCi = this.indexIn(this.sourceCities, this.selectedCityId);
    const sB = this.indexIn(this.sourceBlocks, this.selectedBlockId);
    return `${this.pad(sC,1)}${this.pad(sS,2)}${this.pad(sCi,3)}${this.pad(sB,4)}`;
  }
  get targetTfCode(): string {
    const tC = this.indexIn(this.countries, this.selectedTargetCountryId);
    const tS = this.indexIn(this.targetStates, this.selectedTargetStateId);
    const tCi = this.indexIn(this.targetCities, this.selectedTargetCityId);
    // Target does not include block segment (block comes from source when moving a block)
    return `${this.pad(tC,1)}${this.pad(tS,2)}${this.pad(tCi,3)}${this.pad(0,4)}`;
  }
  private computeTfCode(): string {
    // Source segments
    const sC = this.indexIn(this.countries, this.selectedSourceCountryId);
    const sS = this.indexIn(this.sourceStates, this.selectedStateId);
    const sCi = this.indexIn(this.sourceCities, this.selectedCityId);
    const sB = this.indexIn(this.sourceBlocks, this.selectedBlockId);

    // Target segments (where it's being sent)
    const tC = this.indexIn(this.countries, this.selectedTargetCountryId);
    const tS = this.indexIn(this.targetStates, this.selectedTargetStateId);
    const tCi = this.indexIn(this.targetCities, this.selectedTargetCityId);

    // Determine move level based on source selection
    const level: 'block' | 'district' | 'city' | 'state' | 'country' = this.selectedBlockId
      ? 'block'
      : this.selectedDistrictId
      ? 'district'
      : this.selectedCityId
      ? 'city'
      : this.selectedStateId
      ? 'state'
      : 'country';

    // Compose final segments: prefer target for higher levels, keep source for the moved node's own segment, zero below level
    const C = tC || sC;
    const S = tS || sS;
    const Ci = tCi || sCi;
    const B = level === 'block' ? sB : 0;

    return `${this.pad(C,1)}${this.pad(S,2)}${this.pad(Ci,3)}${this.pad(B,4)}`;
  }

  isValid(): boolean {
    const notSameCountry = !this.selectedSourceCountryId || !this.selectedTargetCountryId || this.selectedSourceCountryId !== this.selectedTargetCountryId;
    const sourceNodeId = this.computeSelectedSourceNodeId();
    const targetNodeId = this.computeSelectedTargetNodeId();
    // Code is auto-generated; no need to validate user input for code
    return !!this.selectedSourceCountryId && !!sourceNodeId && !!this.selectedTargetCountryId && !!targetNodeId && notSameCountry && !!this.formData.reason?.trim();
  }

  // TrackBy helpers
  trackById(_index: number, item: LocationNode) { return item.id; }

  private locationsSub?: Subscription;

  constructor(private locationService: LocationService) {}
}
