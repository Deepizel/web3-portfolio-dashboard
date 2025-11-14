import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ethers } from 'ethers';
import { environment } from '../../environment/environment';
import { AssetService } from '../asset/asset.service';

export interface TokenApproval {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;
  spender: string;
  spenderName?: string;
  allowance: string;
  allowanceFormatted: string;
  network: string;
  lastUpdated?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApprovalService {
  private ALCHEMY_KEY = environment.alchemyApiKey;
  private API_URL = `${environment.alchemyTransactionUrl}${this.ALCHEMY_KEY}`;
  
  // ERC20 Token Approval ABI
  private readonly ERC20_ABI = [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
    'function decimals() view returns (uint8)'
  ];

  // Common DEX and DeFi spender addresses (for display names)
  private readonly SPENDER_NAMES: Record<string, string> = {
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2 Router',
    '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3 Router',
    '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'SushiSwap Router',
    '0x1111111254fb6c44bac0bed2854e76f90643097d': '1inch Router',
    '0x881d40237659c251811cec9c364ef91dc08d300c': 'Metamask Swap',
    '0xdef1c0ded9bec7f1a1670819833240f027b25eff': '0x Protocol',
  };

  constructor(
    private http: HttpClient,
    private assetService: AssetService
  ) {}

  /**
   * Get all token approvals for a wallet
   * This scans through token balances and checks approvals
   */
  async getTokenApprovals(walletAddress: string, provider: ethers.BrowserProvider): Promise<TokenApproval[]> {
    try {
      // First, get all tokens with balances
      const tokenBalances = await this.assetService.getTokenBalances(walletAddress).toPromise();
      const tokens = tokenBalances?.result?.tokenBalances || [];

      const approvals: TokenApproval[] = [];
      const checkedSpenders = new Set<string>(); // Track unique spender addresses

      // Get common DEX spenders to check
      const commonSpenders = Object.keys(this.SPENDER_NAMES);

      // Check approvals for each token
      for (const token of tokens) {
        if (token.tokenBalance === '0x0') continue;

        try {
          // Get token metadata
          const metadata: any = await this.assetService.getTokenMetadata(token.contractAddress).toPromise();
          const symbol = metadata?.result?.symbol || 'UNKNOWN';
          const name = metadata?.result?.name || symbol;
          const decimals = metadata?.result?.decimals || 18;
          const logo = metadata?.result?.logo || '';

          // Create token contract instance
          const tokenContract = new ethers.Contract(
            token.contractAddress,
            this.ERC20_ABI,
            provider
          );

          // Check approvals for common spenders
          for (const spender of commonSpenders) {
            const key = `${token.contractAddress}-${spender}`;
            if (checkedSpenders.has(key)) continue;
            checkedSpenders.add(key);

            try {
              const allowance = await tokenContract['allowance'](walletAddress, spender);
              const allowanceBN = BigInt(allowance.toString());

              // Only include if there's an active approval
              if (allowanceBN > 0n) {
                const allowanceFormatted = ethers.formatUnits(allowance, decimals);
                const spenderName = this.SPENDER_NAMES[spender] || this.formatAddress(spender);

                approvals.push({
                  tokenAddress: token.contractAddress,
                  tokenSymbol: symbol,
                  tokenName: name,
                  tokenLogo: logo,
                  spender: spender,
                  spenderName: spenderName,
                  allowance: allowance.toString(),
                  allowanceFormatted: allowanceFormatted,
                  network: 'Ethereum'
                });
              }
            } catch (error) {
              // Skip if approval check fails
              console.warn(`Failed to check approval for ${token.contractAddress} -> ${spender}:`, error);
            }
          }
        } catch (error) {
          console.warn(`Failed to process token ${token.contractAddress}:`, error);
        }
      }

      return approvals;
    } catch (error) {
      console.error('Error fetching token approvals:', error);
      return [];
    }
  }

  /**
   * Revoke a token approval by setting allowance to 0
   */
  async revokeApproval(
    tokenAddress: string,
    spenderAddress: string,
    provider: ethers.BrowserProvider,
    signer: ethers.JsonRpcSigner
  ): Promise<boolean> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        this.ERC20_ABI,
        signer
      );

      // Set allowance to 0 to revoke
      const tx = await tokenContract['approve'](spenderAddress, 0);
      console.log('Revoke transaction sent:', tx.hash);

      // Wait for transaction confirmation
      await tx.wait();
      console.log('Approval revoked successfully');

      return true;
    } catch (error: any) {
      console.error('Error revoking approval:', error);
      throw new Error(error?.message || 'Failed to revoke approval');
    }
  }

  /**
   * Revoke all approvals for a token (set all spenders to 0)
   */
  async revokeAllApprovalsForToken(
    tokenAddress: string,
    spenders: string[],
    provider: ethers.BrowserProvider,
    signer: ethers.JsonRpcSigner
  ): Promise<boolean> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        this.ERC20_ABI,
        signer
      );

      // Revoke all spenders
      const revokePromises = spenders.map(spender => 
        tokenContract['approve'](spender, 0)
      );

      const txs = await Promise.all(revokePromises);
      console.log('Revoke transactions sent:', txs.map(tx => tx.hash));

      // Wait for all transactions
      await Promise.all(txs.map(tx => tx.wait()));
      console.log('All approvals revoked successfully');

      return true;
    } catch (error: any) {
      console.error('Error revoking all approvals:', error);
      throw new Error(error?.message || 'Failed to revoke approvals');
    }
  }

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format large numbers
   */
  formatAllowance(amount: string, decimals: number = 18): string {
    try {
      const num = parseFloat(ethers.formatUnits(amount, decimals));
      if (num >= 1e9) {
        return `${(num / 1e9).toFixed(2)}B`;
      } else if (num >= 1e6) {
        return `${(num / 1e6).toFixed(2)}M`;
      } else if (num >= 1e3) {
        return `${(num / 1e3).toFixed(2)}K`;
      } else if (num >= 1) {
        return num.toFixed(2);
      } else {
        return num.toFixed(6);
      }
    } catch {
      return '0';
    }
  }
}

