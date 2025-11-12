import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-disconnect-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './confirm-disconnect-modal.component.html',
  styleUrl: './confirm-disconnect-modal.component.css'
})
export class ConfirmDisconnectModalComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDisconnectModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { walletAddress: string | null }
  ) {}

  confirm() {
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }

  formatAddress(address: string | null): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

