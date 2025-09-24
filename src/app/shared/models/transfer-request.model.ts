import { LocationNode } from './location.model';

export interface TransferRequest {
  id: string;
  sourceNode: LocationNode;
  targetNode: LocationNode;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  resolvedAt?: Date;
  requestedBy: string;
  reason?: string;
  transferResources: boolean;
}
