import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TransferRequest } from '../models/transfer-request.model';
import { LocationNode } from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private transferRequests = new BehaviorSubject<TransferRequest[]>([]);
  transferRequests$ = this.transferRequests.asObservable();

  requestTransfer(
    sourceNode: LocationNode,
    targetNode: LocationNode,
    requestedBy: string,
    reason: string,
    transferResources: boolean
  ): TransferRequest {
    const request: TransferRequest = {
      id: this.generateId(),
      sourceNode,
      targetNode,
      status: 'pending',
      requestedAt: new Date(),
      requestedBy,
      reason,
      transferResources
    };

    const updatedRequests = [...this.transferRequests.value, request];
    this.transferRequests.next(updatedRequests);

    return request;
  }

  updateRequestStatus(requestId: string, status: 'approved' | 'rejected'): void {
    const requests = this.transferRequests.value;
    const requestIndex = requests.findIndex(r => r.id === requestId);
    
    if (requestIndex !== -1) {
      const updatedRequests = [...requests];
      updatedRequests[requestIndex] = {
        ...updatedRequests[requestIndex],
        status,
        resolvedAt: new Date()
      };
      this.transferRequests.next(updatedRequests);
    }
  }

  getPendingRequests(): TransferRequest[] {
    return this.transferRequests.value.filter(r => r.status === 'pending');
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
