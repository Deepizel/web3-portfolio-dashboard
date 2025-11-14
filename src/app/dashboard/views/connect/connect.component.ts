import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { WalletService } from '../../../core/services/wallet/wallet.service';
import { MetaMaskModalComponent } from '../../../shared/components/metamask-modal/metamask-modal.component';
import { PhantomModalComponent } from '../../../shared/components/phantom-modal/phantom-modal.component';

@Component({
  selector: 'app-connect',
  imports: [CommonModule],
  templateUrl: './connect.component.html',
  styleUrl: './connect.component.css'
})
export class ConnectComponent {
  constructor(
    private walletService: WalletService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  connectWallet(walletType: string) {
    console.log('Connecting to:', walletType);
    
    // Handle different wallet types
    switch(walletType) {
      case 'metamask':
      case 'metamask-solana':
        this.openMetaMaskModal();
        break;
      case 'phantom':
      case 'phantom-solana':
        this.connectPhantom();
        break;
      case 'walletconnect':
        this.connectWalletConnect();
        break;
      case 'ledger':
        this.connectLedger();
        break;
      case 'keplr':
        this.connectKeplr();
        break;
      case 'zerion':
        this.connectZerion();
        break;
      default:
        console.warn('Unknown wallet type:', walletType);
    }
  }

  private connectPhantom() {
    // Always show modal for consistency (it will handle connection and not-available states)
    this.openPhantomModal();
  }

  private openPhantomModal() {
    const dialogRef = this.dialog.open(PhantomModalComponent, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'phantom-dialog',
      disableClose: false,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.connected) {
        console.log('Phantom connected successfully:', result.address);
        // Navigate to home component after successful connection
        this.router.navigate(['/dashboard/home']);
      }
    });
  }

  private connectWalletConnect() {
    // WalletConnect integration would go here
    console.log('WalletConnect connection not yet implemented');
  }

  private connectLedger() {
    // Ledger integration would go here
    console.log('Ledger connection not yet implemented');
  }

  private connectKeplr() {
    if (typeof window !== 'undefined' && (window as any).keplr) {
      (window as any).keplr.enable('cosmoshub-4')
        .then(() => {
          console.log('Keplr connected');
        })
        .catch((error: any) => {
          console.error('Keplr connection failed:', error);
        });
    } else {
      alert('Keplr wallet not detected. Please install Keplr extension.');
    }
  }

  private connectZerion() {
    // Zerion wallet integration would go here
    console.log('Zerion wallet connection not yet implemented');
  }

  private openMetaMaskModal() {
    const dialogRef = this.dialog.open(MetaMaskModalComponent, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'metamask-dialog',
      disableClose: false,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.connected) {
        console.log('MetaMask connected successfully:', result.address);
        // Navigate to home component after successful connection
        this.router.navigate(['/dashboard/home']);
      }
    });
  }
}
