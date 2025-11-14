import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { WalletService } from '../../../core/services/wallet/wallet.service';
import { ApprovalService, TokenApproval } from '../../../core/services/approval/approval.service';
import { ethers } from 'ethers';

@Component({
  selector: 'app-approvals',
  imports: [CommonModule],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.css'
})
export class ApprovalsComponent implements OnInit, OnDestroy {
  walletAddress: string | null = null;
  approvals: TokenApproval[] = [];
  isLoading: boolean = false;
  isRevoking: boolean = false;
  revokingIndex: number | null = null;
  error: string | null = null;

  private walletSubscription?: Subscription;

  constructor(
    private walletService: WalletService,
    private approvalService: ApprovalService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Get initial wallet address
    this.walletAddress = this.walletService.getCurrentAddress();
    if (this.walletAddress) {
      this.loadApprovals();
    }

    // Subscribe to wallet address changes
    this.walletSubscription = this.walletService.getWalletAddress().subscribe((address) => {
      this.walletAddress = address;
      if (address) {
        this.loadApprovals();
      } else {
        this.approvals = [];
        this.router.navigate(['/dashboard/connect-wallet']);
      }
    });
  }

  ngOnDestroy() {
    if (this.walletSubscription) {
      this.walletSubscription.unsubscribe();
    }
  }

  async loadApprovals() {
    if (!this.walletAddress) return;

    this.isLoading = true;
    this.error = null;

    try {
      // Get provider
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      
      // Fetch approvals
      this.approvals = await this.approvalService.getTokenApprovals(this.walletAddress, provider);
      
      if (this.approvals.length === 0) {
        this.error = 'No token approvals found';
      }
    } catch (error: any) {
      console.error('Error loading approvals:', error);
      this.error = error?.message || 'Failed to load approvals';
    } finally {
      this.isLoading = false;
    }
  }

  async revokeApproval(approval: TokenApproval, index: number) {
    if (!this.walletAddress) return;

    const confirmed = confirm(
      `Are you sure you want to revoke approval for ${approval.tokenSymbol}?\n\n` +
      `Spender: ${approval.spenderName}\n` +
      `Allowance: ${approval.allowanceFormatted} ${approval.tokenSymbol}`
    );

    if (!confirmed) return;

    this.isRevoking = true;
    this.revokingIndex = index;
    this.error = null;

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      await this.approvalService.revokeApproval(
        approval.tokenAddress,
        approval.spender,
        provider,
        signer
      );

      // Remove the revoked approval from the list
      // Find and remove the specific approval
      this.approvals = this.approvals.filter(a => 
        !(a.tokenAddress === approval.tokenAddress && a.spender === approval.spender)
      );
      
      // Show success message
      alert('Approval revoked successfully!');
    } catch (error: any) {
      console.error('Error revoking approval:', error);
      this.error = error?.message || 'Failed to revoke approval';
      alert(`Error: ${this.error}`);
    } finally {
      this.isRevoking = false;
      this.revokingIndex = null;
    }
  }

  async revokeAllForToken(tokenAddress: string) {
    if (!this.walletAddress) return;

    const tokenApprovals = this.approvals.filter(a => a.tokenAddress === tokenAddress);
    if (tokenApprovals.length === 0) return;

    const tokenSymbol = tokenApprovals[0].tokenSymbol;
    const confirmed = confirm(
      `Are you sure you want to revoke all approvals for ${tokenSymbol}?\n\n` +
      `This will revoke ${tokenApprovals.length} approval(s).`
    );

    if (!confirmed) return;

    this.isRevoking = true;
    this.error = null;

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const spenders = tokenApprovals.map(a => a.spender);
      await this.approvalService.revokeAllApprovalsForToken(
        tokenAddress,
        spenders,
        provider,
        signer
      );

      // Remove all approvals for this token
      this.approvals = this.approvals.filter(a => a.tokenAddress !== tokenAddress);
      
      alert('All approvals revoked successfully!');
    } catch (error: any) {
      console.error('Error revoking approvals:', error);
      this.error = error?.message || 'Failed to revoke approvals';
      alert(`Error: ${this.error}`);
    } finally {
      this.isRevoking = false;
    }
  }

  formatAddress(address: string): string {
    return this.approvalService.formatAddress(address);
  }

  formatAllowance(amount: string): string {
    return this.approvalService.formatAllowance(amount);
  }

  getGroupedApprovals(): { tokenAddress: string; tokenSymbol: string; approvals: TokenApproval[] }[] {
    const grouped = new Map<string, TokenApproval[]>();
    
    this.approvals.forEach(approval => {
      if (!grouped.has(approval.tokenAddress)) {
        grouped.set(approval.tokenAddress, []);
      }
      grouped.get(approval.tokenAddress)!.push(approval);
    });

    return Array.from(grouped.entries()).map(([tokenAddress, approvals]) => ({
      tokenAddress,
      tokenSymbol: approvals[0].tokenSymbol,
      approvals
    }));
  }

  navigateToConnectWallet() {
    this.router.navigate(['/dashboard/connect-wallet']);
  }
}
