import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToggleService } from '../../../core/services/toggle/toggle.service';
import { WalletService } from '../../../core/services/wallet/wallet.service';
import { GasPriceService, GasPrice } from '../../../core/services/gas/gas-price.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  showNotifications = false;
  unreadCount = 4;
  userDetails: any;
  
  walletAddress: string | null = null;
  currentNetwork: string = 'Not Connected';
  gasPrice: GasPrice = {
    eth: { slow: 0, standard: 0, fast: 0, unit: 'Gwei' },
    solana: { price: 0, unit: 'SOL' }
  };
  showGasDropdown = false;
  showWalletDropdown = false;

  private walletSubscription?: Subscription;
  private gasSubscription?: Subscription;

  // Common networks mapping
  private networks: Record<string, string> = {
    '0x1': 'Ethereum Mainnet',
    '0x5': 'Goerli Testnet',
    '0x89': 'Polygon Mainnet',
    '0x13881': 'Mumbai Testnet',
    '0xa': 'Optimism',
    '0xa4b1': 'Arbitrum One'
  };

  constructor(
    private route: Router,
    private toggleService: ToggleService,
    private walletService: WalletService,
    private gasPriceService: GasPriceService
  ) {}

  ngOnInit() {
    // Get initial wallet address
    this.walletAddress = this.walletService.getCurrentAddress();
    if (this.walletAddress) {
      this.detectNetwork();
    }

    // Subscribe to wallet address changes
    this.walletSubscription = this.walletService.getWalletAddress().subscribe((address) => {
      this.walletAddress = address;
      if (address) {
        this.detectNetwork();
      } else {
        this.currentNetwork = 'Not Connected';
      }
    });

    // Subscribe to gas price updates
    this.gasSubscription = this.gasPriceService.getGasPrices().subscribe((gasPrice) => {
      this.gasPrice = gasPrice;
    });

    // Listen for network changes
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('chainChanged', () => {
        this.detectNetwork();
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }
goToSettings(){
  this.route.navigate(['/dashboard/settings']);
}
  ngOnDestroy() {
    if (this.walletSubscription) {
      this.walletSubscription.unsubscribe();
    }
    if (this.gasSubscription) {
      this.gasSubscription.unsubscribe();
    }
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.gas-dropdown') && !target.closest('button[data-gas-button]')) {
      this.showGasDropdown = false;
    }
    if (!target.closest('.wallet-dropdown') && !target.closest('button[data-wallet-button]')) {
      this.showWalletDropdown = false;
    }
  }

  async detectNetwork() {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
        this.currentNetwork = this.networks[chainId] || `Unknown Network (${chainId})`;
      } else {
        this.currentNetwork = 'Not Connected';
      }
    } catch (error) {
      console.error('Error detecting network:', error);
      this.currentNetwork = 'Unable to detect';
    }
  }

  toggleSidebar() {
    this.toggleService.toggleSidebar();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  toggleGasDropdown(): void {
    this.showGasDropdown = !this.showGasDropdown;
    this.showWalletDropdown = false;
  }

  toggleWalletDropdown(): void {
    this.showWalletDropdown = !this.showWalletDropdown;
    this.showGasDropdown = false;
  }

  switchWallet() {
    // Disconnect current wallet and navigate to connect page
    this.walletService.disconnectWallet();
    this.route.navigate(['/dashboard/connect-wallet']);
  }

  formatAddress(address: string | null): string {
    if (!address) return 'Not Connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  navigateToNotifications(): void {
    this.route.navigate(['/main/notifications']);
  }

  logout() {
    // Implementation for logout
  }

  notify(event: MouseEvent): void {
    // Implementation for notifications
  }
}
