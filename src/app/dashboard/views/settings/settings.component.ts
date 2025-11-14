import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { WalletService } from '../../../core/services/wallet/wallet.service';
import { ConfirmDisconnectModalComponent } from '../../../shared/components/confirm-disconnect-modal/confirm-disconnect-modal.component';
import { ClearCacheModalComponent } from '../../../shared/components/clear-cache-modal/clear-cache-modal.component';

interface Network {
  chainId: string;
  name: string;
  rpcUrl?: string;
}

@Component({
  selector: 'app-settings',
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit, OnDestroy {
  walletAddress: string | null = null;
  truncatedWalletAddress: string = '';
  currentNetwork: string = 'Not Connected';
  autoSwitchNetwork: boolean = false;
  displayCurrency: string = 'USD';
  sessionTimeout: number = 30; // minutes
  private walletSubscription?: Subscription;
  private sessionTimeoutTimer?: any;
  private startTimeoutCheck?: () => void;

  // Common networks
  networks: Network[] = [
    { chainId: '0x1', name: 'Ethereum Mainnet' },
    { chainId: '0x5', name: 'Goerli Testnet' },
    { chainId: '0x89', name: 'Polygon Mainnet' },
    { chainId: '0x13881', name: 'Mumbai Testnet' },
    { chainId: '0xa', name: 'Optimism' },
    { chainId: '0xa4b1', name: 'Arbitrum One' }
  ];

  constructor(
    private walletService: WalletService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Get initial wallet address
    this.walletAddress = this.walletService.getCurrentAddress();
    this.updateTruncatedAddress();

    // Subscribe to wallet address changes
    this.walletSubscription = this.walletService.getWalletAddress().subscribe((address) => {
      this.walletAddress = address;
      this.updateTruncatedAddress();
      if (address) {
        this.detectNetwork();
        // Setup session timeout when wallet connects
        this.setupSessionTimeout();
      } else {
        this.currentNetwork = 'Not Connected';
        // Clear session timeout when wallet disconnects
        if (this.sessionTimeoutTimer) {
          clearTimeout(this.sessionTimeoutTimer);
        }
      }
    });

    // Load auto-switch network preference
    const savedAutoSwitch = localStorage.getItem('autoSwitchNetwork');
    this.autoSwitchNetwork = savedAutoSwitch === 'true';

    const savedCurrency = localStorage.getItem('displayCurrency');
    this.displayCurrency = savedCurrency || 'USD';

    // Load session timeout preference
    const savedTimeout = localStorage.getItem('sessionTimeout');
    this.sessionTimeout = savedTimeout ? parseInt(savedTimeout, 10) : 30;
    this.setupSessionTimeout();

    // Detect current network if wallet is connected
    if (this.walletAddress) {
      this.detectNetwork();
    }
  }

  ngOnDestroy() {
    if (this.walletSubscription) {
      this.walletSubscription.unsubscribe();
    }
    if (this.sessionTimeoutTimer) {
      clearTimeout(this.sessionTimeoutTimer);
    }
  }

  updateTruncatedAddress() {
    if (this.walletAddress) {
      this.truncatedWalletAddress = `${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}`;
    } else {
      this.truncatedWalletAddress = 'Not Connected';
    }
  }

  async detectNetwork() {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
        const network = this.networks.find(n => n.chainId === chainId);
        this.currentNetwork = network ? network.name : `Unknown Network (${chainId})`;
      } else {
        this.currentNetwork = 'Not Connected';
      }
    } catch (error) {
      console.error('Error detecting network:', error);
      this.currentNetwork = 'Unable to detect';
    }
  }

  openDisconnectModal() {
    const dialogRef = this.dialog.open(ConfirmDisconnectModalComponent, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'confirm-disconnect-dialog',
      disableClose: false,
      data: { walletAddress: this.walletAddress }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.disconnectWallet();
      }
    });
  }

  disconnectWallet() {
    this.walletService.disconnectWallet();
    this.currentNetwork = 'Not Connected';
    // Optionally navigate to connect page
    // this.router.navigate(['/dashboard/connect-wallet']);
  }

  switchWallet() {
    // Navigate to connect wallet page
    this.router.navigate(['/dashboard/connect-wallet']);
  }

  async changeNetwork() {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        // Show a simple prompt to select network
        // In a real app, you'd want a proper modal for network selection
        const selectedNetwork = this.networks[0]; // Default to Ethereum Mainnet
        
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: selectedNetwork.chainId }],
        });
        
        // Reload to detect new network
        await this.detectNetwork();
      } else {
        alert('MetaMask is not available. Please install MetaMask to change networks.');
      }
    } catch (error: any) {
      console.error('Error switching network:', error);
      
      // If the chain doesn't exist, try to add it
      if (error.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x1',
              chainName: 'Ethereum Mainnet',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://mainnet.infura.io/v3/'],
              blockExplorerUrls: ['https://etherscan.io']
            }],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          alert('Failed to add network. Please add it manually in MetaMask.');
        }
      } else {
        alert('Failed to switch network. Please try again.');
      }
    }
  }

  onAutoSwitchToggle(event: Event) {
    const target = event.target as HTMLInputElement;
    this.autoSwitchNetwork = target.checked;
    localStorage.setItem('autoSwitchNetwork', this.autoSwitchNetwork.toString());
    
    if (this.autoSwitchNetwork) {
      // Listen for network changes if auto-switch is enabled
      this.walletService.listenToNetworkChanges(() => {
        this.detectNetwork();
      });
    }
  }

  // Permissions Section
  manageDAppPermissions() {
    // Navigate to approvals page
    this.router.navigate(['/dashboard/approvals']);
  }

  configureSessionTimeout() {
    const timeoutInput = prompt(
      `Set session timeout (in minutes). Current: ${this.sessionTimeout} minutes`,
      this.sessionTimeout.toString()
    );
    
    if (timeoutInput !== null) {
      const timeout = parseInt(timeoutInput, 10);
      if (!isNaN(timeout) && timeout > 0) {
        this.sessionTimeout = timeout;
        localStorage.setItem('sessionTimeout', timeout.toString());
        this.setupSessionTimeout();
        alert(`Session timeout set to ${timeout} minutes`);
      } else {
        alert('Please enter a valid number greater than 0');
      }
    }
  }

  setupSessionTimeout() {
    // Clear existing timer
    if (this.sessionTimeoutTimer) {
      clearTimeout(this.sessionTimeoutTimer);
    }

    // Only setup if wallet is connected
    if (!this.walletAddress) {
      return;
    }

    // Set up inactivity timer
    let lastActivityTime = Date.now();

    // Define checkTimeout function first
    const checkTimeout = () => {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      const timeoutMs = this.sessionTimeout * 60 * 1000; // Convert minutes to milliseconds

      if (timeSinceLastActivity >= timeoutMs) {
        // Disconnect wallet after timeout
        this.walletService.disconnectWallet();
        alert('Your wallet has been disconnected due to inactivity.');
        // Remove event listeners
        activityEvents.forEach(event => {
          document.removeEventListener(event, resetTimer);
        });
      } else {
        // Check again in 1 minute
        this.sessionTimeoutTimer = setTimeout(checkTimeout, 60000);
      }
    };

    const resetTimer = () => {
      lastActivityTime = Date.now();
      // Reset the timeout
      if (this.sessionTimeoutTimer) {
        clearTimeout(this.sessionTimeoutTimer);
      }
      checkTimeout();
    };

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Start the timeout check
    checkTimeout();
  }

  // Appearance Section
  changeCurrency() {
    const currencies = ['USD', 'EUR', 'NGN', 'ETH'];
    const currentIndex = currencies.indexOf(this.displayCurrency);
    const nextIndex = (currentIndex + 1) % currencies.length;
    this.displayCurrency = currencies[nextIndex];
    localStorage.setItem('displayCurrency', this.displayCurrency);
  }

  // Data & Storage Section
  clearCachedData() {
    const dialogRef = this.dialog.open(ClearCacheModalComponent, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'clear-cache-dialog',
      disableClose: false,
      data: {}
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        // Clear all localStorage except wallet connection
        const walletAddress = localStorage.getItem('walletAddress');
        const autoSwitchNetwork = localStorage.getItem('autoSwitchNetwork');
        
        localStorage.clear();
        
        // Restore essential data
        if (walletAddress) {
          localStorage.setItem('walletAddress', walletAddress);
        }
        if (autoSwitchNetwork) {
          localStorage.setItem('autoSwitchNetwork', autoSwitchNetwork);
        }

        // Reload page to reset state
        window.location.reload();
      }
    });
  }
}
