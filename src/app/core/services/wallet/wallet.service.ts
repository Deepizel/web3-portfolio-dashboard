import { Injectable } from '@angular/core';
import { ethers } from 'ethers';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private provider!: ethers.BrowserProvider;
  private signer!: ethers.JsonRpcSigner;
  private address: string | null = null;

  constructor() {
    this.initProvider();
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
    return this.address;
  }

  async getBalance(): Promise<string | null> {
    if (!this.signer) return null;
    const balance = await this.provider.getBalance(this.signer.address);
    return ethers.formatEther(balance);
  }

  listenToAccountChanges(callback: (account: string) => void) {
    (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
      callback(accounts[0]);
    });
  }

  listenToNetworkChanges(callback: () => void) {
    (window as any).ethereum.on('chainChanged', () => {
      callback();
      window.location.reload(); // refresh to reinit provider
    });
  }
}
