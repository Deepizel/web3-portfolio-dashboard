import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { WalletService } from '../../../core/services/wallet/wallet.service';

@Component({
  selector: 'app-metamask-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './metamask-modal.component.html',
  styleUrl: './metamask-modal.component.css'
})
export class MetaMaskModalComponent {
  isConnecting = false;
  errorMessage: string | null = null;
  isMetaMaskInstalled = false;

  constructor(
    public dialogRef: MatDialogRef<MetaMaskModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private walletService: WalletService
  ) {
    this.checkMetaMaskInstalled();
  }

  checkMetaMaskInstalled() {
    this.isMetaMaskInstalled = typeof window !== 'undefined' && !!(window as any).ethereum;
  }

  async connectMetaMask() {
    if (!this.isMetaMaskInstalled) {
      this.errorMessage = 'MetaMask is not installed. Please install MetaMask extension to continue.';
      return;
    }

    this.isConnecting = true;
    this.errorMessage = null;

    try {
      const address = await this.walletService.connectWallet();
      if (address) {
        // Close the dialog after successful connection
        this.dialogRef.close({ connected: true, address });
      } else {
        this.errorMessage = 'Failed to connect to MetaMask. Please try again.';
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      this.errorMessage = error.message || 'An error occurred while connecting to MetaMask.';
    } finally {
      this.isConnecting = false;
    }
  }

  installMetaMask() {
    window.open('https://metamask.io/download/', '_blank');
  }

  close() {
    this.dialogRef.close({ connected: false });
  }
}

