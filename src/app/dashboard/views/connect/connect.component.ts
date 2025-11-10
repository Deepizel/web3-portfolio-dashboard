import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../../core/services/wallet/wallet.service';

@Component({
  selector: 'app-connect',
  imports: [CommonModule],
  templateUrl: './connect.component.html',
  styleUrl: './connect.component.css'
})
export class ConnectComponent {
  constructor(private walletService: WalletService) {}

  connectWallet(walletType: string) {
    console.log('Connecting to:', walletType);
    
    // Handle different wallet types
    switch(walletType) {
      case 'metamask':
      case 'metamask-solana':
        this.walletService.connectWallet();
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
    if (typeof window !== 'undefined' && (window as any).phantom?.solana) {
      (window as any).phantom.solana.connect()
        .then((response: any) => {
          console.log('Phantom connected:', response.publicKey.toString());
        })
        .catch((error: any) => {
          console.error('Phantom connection failed:', error);
        });
    } else {
      alert('Phantom wallet not detected. Please install Phantom extension.');
    }
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
}
