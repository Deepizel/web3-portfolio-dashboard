import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ToggleService } from '../../../core/services/toggle/toggle.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../../core/services/wallet/wallet.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  adminDetails: any;
  sidebarCollapsed: boolean = false;
  isMobile: boolean = false;
  walletAddress: string | null = null;
  private subscription?: Subscription;
  private walletSubscription?: Subscription;
  private initialLoad: boolean = true;

  constructor(private router: Router,
    private sidebarService: ToggleService,
    private walletService: WalletService
  ) {}

  ngOnInit() {
    // Check initial screen size
    this.checkScreenSize();

    // this.adminDetails = helper.decodeToken(localStorage.getItem('access_token')!);

    // subscribe to the sidebar collapsed state
    this.subscription = this.sidebarService.sidebarCollapsed$.subscribe((state) => {
      this.sidebarCollapsed = state;
    });

    // Subscribe to wallet address changes
    this.walletSubscription = this.walletService.getWalletAddress().subscribe((address) => {
      this.walletAddress = address;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    const width = window.innerWidth;
    // Tablet breakpoint is typically 768px, but we'll use 1024px for "tablet and below"
    const wasMobile = this.isMobile;
    this.isMobile = width <= 1024;
    
    // Auto-collapse sidebar on tablet and mobile
    // On initial load or when transitioning to mobile view
    if (this.isMobile && (this.initialLoad || !wasMobile)) {
      this.sidebarService.setSidebar(true);
    }
    
    if (this.initialLoad) {
      this.initialLoad = false;
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.walletSubscription) {
      this.walletSubscription.unsubscribe();
    }
  }

  formatAddress(address: string | null): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  connectWallet() {
    this.router.navigate(['/dashboard/connect-wallet']);
  }

  logOut() {
    localStorage.removeItem('access_token');
    this.router.navigateByUrl('/');
  }

  toggleSideBar() {
    this.sidebarService.toggleSidebar();
  }

  getSidebarClasses(): string {
    const baseClasses = 'h-screen bg-[#101828] text-[#EDF7F6] flex flex-col transition-all duration-300';
    
    if (this.isMobile) {
      // On mobile/tablet: hide when collapsed, show as overlay when expanded
      if (this.sidebarCollapsed) {
        return `${baseClasses} w-0 overflow-hidden lg:w-[80px]`;
      } else {
        return `${baseClasses} w-[280px] fixed lg:relative z-50 lg:z-auto`;
      }
    } else {
      // On desktop: normal collapsed/expanded behavior
      if (this.sidebarCollapsed) {
        return `${baseClasses} w-[80px]`;
      } else {
        return `${baseClasses} w-[280px]`;
      }
    }
  }
}
