import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ethers } from 'ethers';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private provider!: ethers.BrowserProvider;
  private signer!: ethers.JsonRpcSigner;
  private address: string | null = null;
  private walletAddress$ = new BehaviorSubject<string | null>(null);

  constructor() {
    this.initProvider();
    this.checkExistingConnection();
  }

  // Observable for components to subscribe to wallet address changes
  getWalletAddress(): Observable<string | null> {
    return this.walletAddress$.asObservable();
  }

  // Get current wallet address synchronously
  getCurrentAddress(): string | null {
    return this.address;
  }

  private async checkExistingConnection() {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          this.address = accounts[0];
          this.walletAddress$.next(this.address);
        }
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  }

  async initProvider() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
    } else {
      console.warn('MetaMask not detected. Please install it.');
    }
  }

  async connectWallet(): Promise<string | null> {
    try {
      if (!this.provider) await this.initProvider();
      const accounts = await this.provider.send('eth_requestAccounts', []);
      this.signer = await this.provider.getSigner();
      this.address = accounts[0];
      this.walletAddress$.next(this.address); // Emit the new address
      console.log('Wallet connected:', this.address);
      return this.address;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return null;
    }
  }

  async getAccount(): Promise<string | null> {
    if (this.address) return this.address;
    const accounts = await this.provider.listAccounts();
    this.address = accounts.length ? accounts[0].address : null;
    if (this.address) {
      this.walletAddress$.next(this.address); // Emit the address if found
    }
    return this.address;
  }

  async getBalance(): Promise<string | null> {
    if (!this.provider) await this.initProvider();
    if (!this.provider) return null;
    
    try {
      const address = this.address || await this.getAccount();
      if (!address) return null;
      
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  }

  listenToAccountChanges(callback: (account: string) => void) {
    (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
      this.address = accounts.length > 0 ? accounts[0] : null;
      this.walletAddress$.next(this.address); // Emit the changed address
      if (this.address) {
        callback(this.address);
      }
    });
  }

  listenToNetworkChanges(callback: () => void) {
    (window as any).ethereum.on('chainChanged', () => {
      callback();
      window.location.reload(); // refresh to reinit provider
    });
  }

  /**
   * Disconnect the wallet by clearing the stored address
   * Note: This doesn't actually disconnect from MetaMask, just clears our local state
   */
  disconnectWallet() {
    this.address = null;
    this.signer = null as any;
    this.walletAddress$.next(null);
    console.log('Wallet disconnected');
  }
}
