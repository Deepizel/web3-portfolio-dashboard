import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-phantom-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './phantom-modal.component.html',
  styleUrl: './phantom-modal.component.css'
})
export class PhantomModalComponent {
  isConnecting = false;
  errorMessage: string | null = null;
  isPhantomInstalled = false;

  constructor(
    public dialogRef: MatDialogRef<PhantomModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.checkPhantomInstalled();
  }

  checkPhantomInstalled() {
    this.isPhantomInstalled = typeof window !== 'undefined' && !!(window as any).phantom?.solana;
  }

  async connectPhantom() {
    if (!this.isPhantomInstalled) {
      this.errorMessage = 'Phantom wallet is not installed. Please install Phantom extension to continue.';
      return;
    }

    this.isConnecting = true;
    this.errorMessage = null;

    try {
      const response = await (window as any).phantom.solana.connect();
      if (response && response.publicKey) {
        const publicKey = response.publicKey.toString();
        console.log('Phantom connected:', publicKey);
        // Close the dialog after successful connection
        this.dialogRef.close({ connected: true, address: publicKey });
      } else {
        this.errorMessage = 'Failed to connect to Phantom wallet. Please try again.';
      }
    } catch (error: any) {
      console.error('Phantom connection error:', error);
      this.errorMessage = error.message || 'An error occurred while connecting to Phantom wallet.';
    } finally {
      this.isConnecting = false;
    }
  }

  installPhantom() {
    window.open('https://phantom.app/', '_blank');
  }

  close() {
    this.dialogRef.close({ connected: false });
  }
}

