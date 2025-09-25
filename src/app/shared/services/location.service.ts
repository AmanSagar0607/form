import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LocationNode, createLocationNode } from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private locations = new BehaviorSubject<LocationNode[]>([]);
  locations$ = this.locations.asObservable();

  constructor() {
    console.log('LocationService initialized');
    this.initializeSampleData();
  }

  private initializeSampleData() {
    console.log('Initializing sample data...');
    
    // Helper function to create blocks for a district
    const createBlocks = (districtId: string, districtNum: number, multiplier: number): LocationNode[] => {
      return Array.from({ length: 2 }, (_, i) => {
        const blockNum = i + 1;
        const blockId = `b${districtId}-${blockNum}`;
        return createLocationNode(
          blockId,
          `Block ${blockNum}`,
          'block',
          districtId,
          { food: 20 * blockNum * multiplier },
          []
        );
      });
    };

    // Helper function to create districts for a city
    const createDistricts = (cityId: string, cityNum: number, multiplier: number): LocationNode[] => {
      return Array.from({ length: 2 }, (_, i) => {
        const districtNum = i + 1;
        const districtId = `d${cityId}-${districtNum}`;
        return createLocationNode(
          districtId,
          `District ${districtNum}`,
          'district',
          cityId,
          { food: 30 * districtNum * multiplier },
          createBlocks(districtId, districtNum, multiplier)
        );
      });
    };

    // Helper function to create cities for a state
    const createCities = (stateId: string, stateNum: number, countryIndex: number): LocationNode[] => {
      return Array.from({ length: 3 }, (_, i) => {
        const cityNum = i + 1;
        const cityId = `ci${stateId}-${cityNum}`;
        const hasDistricts = countryIndex > 0;
        
        return createLocationNode(
          cityId,
          `City ${stateNum}.${cityNum}`,
          'city',
          stateId,
          { food: 50 * cityNum * (countryIndex + 1) },
          hasDistricts ? createDistricts(cityId, cityNum, countryIndex + 1) : []
        );
      });
    };

    // Helper function to create states for a country
    const createStates = (countryId: string, countryIndex: number): LocationNode[] => {
      return Array.from({ length: 5 }, (_, i) => {
        const stateNum = i + 1;
        const stateId = `s${countryId}-${stateNum}`;
        return createLocationNode(
          stateId,
          `State ${countryIndex + 1}.${stateNum}`,
          'state',
          countryId,
          { food: 100 * stateNum * (countryIndex + 1) },
          createCities(stateId, stateNum, countryIndex)
        );
      });
    };

    // Create 3 countries with the new hierarchy
    const countries = Array.from({ length: 3 }, (_, i) => {
      const countryNum = i + 1;
      const countryId = `c${countryNum}`;
      return createLocationNode(
        countryId,
        `Country ${countryNum}`,
        'country',
        null,
        { food: 1000 * countryNum },
        createStates(countryId, i)
      );
    });

    console.log('Sample data created with countries:', countries);
    this.locations.next(countries);
  }

  transferNode(sourceNode: LocationNode, targetNode: LocationNode, transferResources: boolean): boolean {
    const locations = this.locations.getValue();
    
    // Find and remove from source
    const sourceParent = this.findParent(locations, sourceNode.id);
    if (!sourceParent) return false;
    
    const sourceIndex = sourceParent.children?.findIndex(n => n.id === sourceNode.id) ?? -1;
    if (sourceIndex === -1) return false;
    
    // Clone the node to avoid reference issues
    const nodeToTransfer = { ...sourceNode };
    
    // Handle resource transfer if needed
    if (transferResources && targetNode.resources && sourceNode.resources) {
      targetNode.resources.food += sourceNode.resources.food;
    }
    
    // Remove from source
    sourceParent.children?.splice(sourceIndex, 1);
    
    // Add to target
    if (!targetNode.children) {
      targetNode.children = [];
    }
    targetNode.children.push(nodeToTransfer);
    
    // Update the state
    this.locations.next([...locations]);
    return true;
  }
  
  private findParent(nodes: LocationNode[], nodeId: string): LocationNode | null {
    for (const node of nodes) {
      if (node.children) {
        if (node.children.some(n => n.id === nodeId)) {
          return node;
        }
        const found = this.findParent(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  }
}
