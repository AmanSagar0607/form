import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransferService } from '../../services/transfer.service';
import { LocationService } from '../../services/location.service';
import { TransferRequest } from '../../models/transfer-request.model';

@Component({
  selector: 'app-transfer-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="p-4 border-b">
        <h3 class="text-lg font-semibold">Pending Transfer Requests</h3>
      </div>
      
      <div *ngIf="pendingRequests.length === 0" class="p-4 text-gray-500">
        No pending transfer requests.
      </div>
      
      <div *ngFor="let request of pendingRequests" class="border-b last:border-b-0 p-4">
        <div class="flex justify-between items-start">
          <div>
            <div class="font-medium">
              Transfer {{ request.sourceNode.name }} ({{ request.sourceNode.type }}) 
              to {{ request.targetNode.name }} ({{ request.targetNode.type }})
            </div>
            <div class="text-sm text-gray-600 mt-1">
              Requested by: {{ request.requestedBy }} • 
              {{ request.requestedAt | date:'short' }}
            </div>
            <div class="text-sm text-gray-700 mt-2">
              <span class="font-medium">Reason:</span> {{ request.reason || 'No reason provided' }}
            </div>
            <div class="text-sm mt-1">
              <span class="font-medium">Transfer Resources:</span> 
              {{ request.transferResources ? 'Yes' : 'No' }}
            </div>
          </div>
          
          <div class="flex space-x-2">
            <button 
              (click)="approveRequest(request.id)"
              class="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700">
              Approve
            </button>
            <button 
              (click)="rejectRequest(request.id)"
              class="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700">
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TransferRequestsComponent implements OnInit {
  pendingRequests: TransferRequest[] = [];

  constructor(
    private transferService: TransferService,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    this.loadPendingRequests();
  }

  private loadPendingRequests() {
    this.pendingRequests = this.transferService.getPendingRequests();
  }

  approveRequest(requestId: string) {
    const request = this.pendingRequests.find(r => r.id === requestId);
    if (request) {
      // Perform the transfer
      const success = this.locationService.transferNode(
        request.sourceNode,
        request.targetNode,
        request.transferResources
      );
      
      if (success) {
        this.transferService.updateRequestStatus(requestId, 'approved');
        this.loadPendingRequests();
      }
    }
  }

  rejectRequest(requestId: string) {
    this.transferService.updateRequestStatus(requestId, 'rejected');
    this.loadPendingRequests();
  }
}
