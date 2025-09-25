import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationNode } from '../../models/location.model';
import { LocationService } from '../../services/location.service';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-location-tree',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <ul *ngIf="nodes && nodes.length > 0" class="pl-4">
      <li *ngFor="let node of nodes" class="py-1">
        <div 
          [class.bg-blue-50]="selectedNodeId === node.id"
          [class.cursor-pointer]="selectedNodeId === node.id"
          class="flex items-start p-2 rounded hover:bg-gray-50 transition-colors cursor-pointer" 
          (click)="onNodeClick(node)">
          
          <!-- Toggle button -->
          <div class="flex items-center">
            <div 
              class="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700 mr-2 cursor-pointer"
              (click)="toggleNode(node); $event.stopPropagation()">
              <i-lucide 
                *ngIf="shouldLoadChildren(node) || node.children?.length"
                [name]="node.isExpanded ? 'chevron-down' : 'chevron-right'" 
                class="w-4 h-4 cursor-pointer"
                (click)="toggleNode(node); $event.stopPropagation()">
              </i-lucide>
              <span *ngIf="!shouldLoadChildren(node) && !node.children?.length" class="w-4"></span>
            </div>
          </div>
          
          <!-- Node content -->
          <div class="flex-1">
            <div class="flex items-center">
              <span class="font-medium">{{ node.name }}</span>
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-2">
                {{ node.type }}
              </span>
              <!-- Show child count if not expanded -->
              <span *ngIf="node.children && node.children.length && !node.isExpanded" 
                    class="text-xs text-gray-500 ml-2">
                ({{ node.children.length }} {{ getChildType(node.type) }})
              </span>
            </div>
            <div class="text-sm text-gray-600 mt-0.5">
              Food: {{ node.resources.food || 0 }}
            </div>
          </div>
        </div>
        
        <!-- Children -->
        <div *ngIf="node.isExpanded && node.children && node.children.length > 0" class="pl-4">
          <app-location-tree 
            [nodes]="node.children"
            [selectedNodeId]="selectedNodeId"
            (nodeClick)="onNodeClick($event)">
          </app-location-tree>
        </div>
      </li>
    </ul>
  `
})
export class LocationTreeComponent {
  @Input() nodes: LocationNode[] = [];
  @Input() selectedNodeId: string | null = null;
  @Output() nodeClick = new EventEmitter<LocationNode>();
  
  private previouslySelectedNode: LocationNode | null = null;

  constructor(
    private locationService: LocationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    if (this.nodes && this.nodes.length > 0) {
      // Start with all nodes collapsed by default
      this.nodes.forEach(node => {
        node.isExpanded = false;
      });
    }
  }

  toggleNode(node: LocationNode): void {
    if (this.shouldLoadChildren(node) && (!node.children || node.children.length === 0)) {
      // Load children if needed
      node.isLoading = true;
      this.loadChildren(node);
      node.isExpanded = true;
    } else {
      // Just toggle the expanded state if we already have children
      node.isExpanded = !node.isExpanded;
    }
  }

  onNodeClick(node: LocationNode): void {
    // If clicking the same node again, clear the selection
    if (this.previouslySelectedNode?.id === node.id) {
      this.selectedNodeId = null;
      this.previouslySelectedNode = null;
      this.notificationService.info('Selection Cleared', `Deselected ${node.name} (${node.type})`);
    } else {
      // Select the new node
      this.selectedNodeId = node.id;
      this.previouslySelectedNode = node;
      this.notificationService.success(
        'Location Selected', 
        `Selected ${node.name} (${node.type})`,
        2000 // Show for 2 seconds
      );
    }
    
    // Emit the node click event
    this.nodeClick.emit(node);
  }

  shouldLoadChildren(node: LocationNode): boolean {
    // Only load children for these node types
    return ['country', 'state', 'city', 'district'].includes(node.type);
  }

  getChildType(type: string): string {
    switch (type) {
      case 'country': return 'states';
      case 'state': return 'cities';
      case 'city': return 'districts';
      case 'district': return 'blocks';
      default: return 'items';
    }
  }

  private loadChildren(node: LocationNode): void {
    // Use setTimeout to ensure the UI updates the loading state
    setTimeout(() => {
      try {
        let childType = '';
        
        switch(node.type) {
          case 'country':
            this.loadStatesForCountry(node);
            childType = 'states';
            break;
          case 'state':
            this.loadCitiesForState(node);
            childType = 'cities';
            break;
          case 'city':
            this.loadDistrictsForCity(node);
            childType = 'districts';
            break;
          case 'district':
            this.loadBlocksForDistrict(node);
            childType = 'blocks';
            break;
          // 'block' has no children
        }
        
        // Show success notification
        if (childType) {
          this.notificationService.success(
            'Data Loaded',
            `Loaded ${node.children?.length || 0} ${childType} for ${node.name}`,
            2000
          );
        }
        
        // Ensure the node is marked as not loading after children are loaded
        node.isLoading = false;
        // Trigger change detection
        this.triggerChangeDetection();
      } catch (error) {
        console.error('Error loading children:', error);
        this.notificationService.error(
          'Error',
          `Failed to load ${this.getChildType(node.type)} for ${node.name}`
        );
        node.isLoading = false;
        this.triggerChangeDetection();
      }
    }, 0);
  }

  private loadStatesForCountry(country: LocationNode): void {
    // Create states with their cities
    const states = Array.from({ length: 5 }, (_, i) => ({
      id: `s${i + 1}`,
      name: `State ${i + 1}`,
      type: 'state' as const,
      parentId: country.id,
      resources: { food: 100 * (i + 1) },
      isExpanded: false,
      children: []
    }));

    // Add states as children of the country
    country.children = states;
    this.triggerChangeDetection();
  }

  private loadCitiesForState(state: LocationNode): void {
    // Create cities with their districts
    const cities = Array.from({ length: 3 }, (_, i) => ({
      id: `c${state.id}-${i + 1}`,
      name: `City ${i + 1}`,
      type: 'city' as const,
      parentId: state.id,
      resources: { food: 50 * (i + 1) },
      isExpanded: false,
      children: []
    }));

    // Add cities as children of the state
    state.children = cities;
    this.triggerChangeDetection();
  }

  private loadDistrictsForCity(city: LocationNode): void {
    // Create districts with their blocks
    const districts = Array.from({ length: 2 }, (_, i) => ({
      id: `d${city.id}-${i + 1}`,
      name: `District ${i + 1}`,
      type: 'district' as const,
      parentId: city.id,
      resources: { food: 30 * (i + 1) },
      isExpanded: false,
      children: []
    }));

    // Add districts as children of the city
    city.children = districts;
    this.triggerChangeDetection();
  }

  private loadBlocksForDistrict(district: LocationNode): void {
    // Create blocks (no deeper levels)
    const blocks = Array.from({ length: 2 }, (_, i) => ({
      id: `b${district.id}-${i + 1}`,
      name: `Block ${i + 1}`,
      type: 'block' as const,
      parentId: district.id,
      resources: { food: 20 * (i + 1) },
      isExpanded: false,
      children: []
    }));

    // Add blocks as children of the district
    district.children = blocks;
    this.triggerChangeDetection();
  }

  // Removed Gram Panchayat level

  private triggerChangeDetection(): void {
    this.nodes = [...this.nodes];
  }

  hasChildren(node: LocationNode): boolean {
    return !!(node.children && node.children.length > 0);
  }

  getChildCount(node: LocationNode): number {
    if (node.children) {
      return node.children.length;
    }
    // Return default counts for different node types
    const defaultCounts = {
      'country': 5,   // states
      'state': 3,     // cities
      'city': 2,      // districts
      'district': 2,  // blocks
      'block': 0
    };
    return defaultCounts[node.type] || 0;
  }
}
