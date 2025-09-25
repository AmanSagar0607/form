export interface Resources {
  food: number;
  // Add other resource types as needed
}

export interface LocationNode {
  id: string;
  name: string;
  type: 'country' | 'state' | 'city' | 'district' | 'block';
  parentId: string | null;
  resources: Resources;
  isExpanded?: boolean;
  isLoading?: boolean;
  children?: LocationNode[];
  // Additional properties for transfer system
  canBeTransferred?: boolean;
  transferRestrictions?: string[]; // Types this node can be transferred to
}

// Helper function to create a new location node
export function createLocationNode(
  id: string,
  name: string,
  type: LocationNode['type'],
  parentId: string | null,
  resources: Resources,
  children: LocationNode[] = []
): LocationNode {
  return {
    id,
    name,
    type,
    parentId,
    resources,
    isExpanded: false,
    isLoading: false,
    canBeTransferred: type !== 'country', // Example: Countries can't be transferred
    transferRestrictions: getTransferRestrictions(type),
    children
  };
}

// Define transfer restrictions based on node type
function getTransferRestrictions(type: string): string[] {
  const restrictions: Record<string, string[]> = {
    state: ['country'],
    city: ['state'],
    district: ['city'],
    block: ['district']
  };
  
  return restrictions[type] || [];
}
