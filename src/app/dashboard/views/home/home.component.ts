import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { WalletService } from '../../../core/services/wallet/wallet.service';
import { NFTService, NFT, NFTCollection } from '../../../core/services/nft/nft.service';
import { ConfirmDisconnectModalComponent } from '../../../shared/components/confirm-disconnect-modal/confirm-disconnect-modal.component';
import { Subscription } from 'rxjs';

interface Asset {
  name: string;
  symbol: string;
  percentage: number;
  networks: string | number;
  price: string;
  balance: string;
  value: string;
  change: number;
  changeValue: string;
  logo?: string;
}

interface Transaction {
  type: string;
  date: string;
  amount: string;
  token?: string;
  network?: string;
}

interface GraphDataPoint {
  time: string;
  value: number;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  walletAddress: string | null = null;
  balance: string = '0.00';
  totalValue: number = 0.03;
  changePercent: number = -1.9;
  changeValue: number = 0.00;
  
  activeTab: 'tokens' | 'nfts' | 'history' = 'tokens';
  selectedTimeRange: '1H' | '1D' | '1W' | '1M' | '1Y' | 'Max' = '1D';
  selectedNetwork: string = 'All Networks';
  
  assets: Asset[] = [];
  transactions: Transaction[] = [];
  graphData: GraphDataPoint[] = [];
  
  // NFT properties
  nfts: NFT[] = [];
  nftCollections: NFTCollection[] = [];
  nftTotalValue: number = 0;
  isLoadingNFTs: boolean = false;
  nftSortBy: 'price-high' | 'price-low' | 'recent' = 'price-high';
  selectedCollection: string = 'all';
  
  private walletSubscription?: Subscription;
  private nftSubscription?: Subscription;

  constructor(
    private walletService: WalletService,
    private nftService: NFTService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    // Get initial wallet address
    this.walletAddress = this.walletService.getCurrentAddress();
    if (this.walletAddress) {
      this.loadWalletData();
    }

    // Subscribe to wallet address changes
    this.walletSubscription = this.walletService.getWalletAddress().subscribe(async (address) => {
      this.walletAddress = address;
      if (address) {
        await this.loadWalletData();
        // Load NFTs if NFTs tab is active
        if (this.activeTab === 'nfts') {
          this.loadNFTs();
        }
      } else {
        // Reset values if wallet disconnected
        this.balance = '0.00';
        this.totalValue = 0;
        this.changePercent = 0;
        this.changeValue = 0;
        this.nfts = [];
        this.nftCollections = [];
        this.nftTotalValue = 0;
      }
    });

    // Load initial data
    this.loadMockData();
    this.generateGraphData();
  }

  ngOnDestroy() {
    if (this.walletSubscription) {
      this.walletSubscription.unsubscribe();
    }
    if (this.nftSubscription) {
      this.nftSubscription.unsubscribe();
    }
  }

  async loadWalletData() {
    if (this.walletAddress) {
      const balance = await this.walletService.getBalance();
      if (balance) {
        this.balance = parseFloat(balance).toFixed(2);
        // Calculate total value (simplified - in real app, you'd fetch token prices)
        this.totalValue = parseFloat(balance) * 3000; // Assuming ETH price ~$3000
        this.updateChange();
      }
    }
  }

  updateChange() {
    // Mock change calculation
    const previousValue = this.totalValue / (1 + this.changePercent / 100);
    this.changeValue = this.totalValue - previousValue;
  }

  loadMockData() {
    // Mock assets data
    this.assets = [
      {
        name: 'Ethereum',
        symbol: 'ETH',
        percentage: 70.9,
        networks: '12 Networks',
        price: '$3,393.91',
        balance: '0.0000056 ETH',
        value: '$0.02',
        change: -2.48,
        changeValue: '$0.00'
      },
      {
        name: 'USD Coin',
        symbol: 'USDC.e',
        percentage: 23.4,
        networks: 'Polygon',
        price: '$0.999784',
        balance: '0.0063 USDC.e',
        value: '$0.01',
        change: 0.23,
        changeValue: '$0.00'
      }
    ];

    // Mock transactions
    this.transactions = [
      { type: 'Trade', date: 'Nov 12', amount: '+0.0029 ETH', token: '-0.0029 ETH' },
      { type: 'Delegate', date: 'Nov 11', amount: '0.0001 ETH' },
      { type: 'Delegate', date: 'Nov 11', amount: '0.0001 ETH' },
      { type: 'Delegate', date: 'Nov 11', amount: '0.0001 ETH' },
      { type: 'Delegate', date: 'Nov 11', amount: '0.0001 ETH' },
      { type: 'Delegate', date: 'Nov 11', amount: '0.0001 ETH' }
    ];
  }

  generateGraphData() {
    // Generate mock graph data for the selected time range
    const dataPoints: GraphDataPoint[] = [];
    const baseValue = 0.021574;
    const now = new Date();
    
    let points = 24; // Default for 1D
    if (this.selectedTimeRange === '1H') points = 60;
    else if (this.selectedTimeRange === '1W') points = 168;
    else if (this.selectedTimeRange === '1M') points = 720;
    else if (this.selectedTimeRange === '1Y') points = 365;
    else if (this.selectedTimeRange === 'Max') points = 1000;

    for (let i = points; i >= 0; i--) {
      const time = new Date(now.getTime() - i * (24 * 60 * 60 * 1000 / points));
      const variation = (Math.random() - 0.5) * 0.001;
      const value = baseValue + variation + (i / points) * 0.0008;
      dataPoints.push({
        time: time.toISOString(),
        value: Math.max(0.021, Math.min(0.023, value))
      });
    }

    this.graphData = dataPoints;
  }

  formatAddress(address: string | null): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  setActiveTab(tab: 'tokens' | 'nfts' | 'history') {
    this.activeTab = tab;
    if (tab === 'nfts' && this.walletAddress && this.nfts.length === 0) {
      this.loadNFTs();
    }
  }

  setTimeRange(range: string) {
    this.selectedTimeRange = range as '1H' | '1D' | '1W' | '1M' | '1Y' | 'Max';
    this.generateGraphData();
  }

  getTimeRanges(): string[] {
    return ['1H', '1D', '1W', '1M', '1Y', 'Max'];
  }

  getGraphPath(): string {
    if (this.graphData.length === 0) return '';
    
    const width = 600;
    const height = 200;
    const padding = 20;
    
    const minValue = Math.min(...this.graphData.map(d => d.value));
    const maxValue = Math.max(...this.graphData.map(d => d.value));
    const valueRange = maxValue - minValue || 1;
    
    const points = this.graphData.map((point, index) => {
      const x = (index / (this.graphData.length - 1)) * (width - 2 * padding) + padding;
      const y = height - padding - ((point.value - minValue) / valueRange) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }

  getGraphAreaPath(): string {
    if (this.graphData.length === 0) return '';
    
    const path = this.getGraphPath();
    const width = 600;
    const height = 200;
    const padding = 20;
    const lastPoint = path.split(' ').pop() || '';
    const lastY = lastPoint.split(',')[1] || height - padding;
    
    return `${path} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;
  }

  getAbsoluteChangeValue(): number {
    return Math.abs(this.changeValue);
  }

  getAbsoluteAssetChange(asset: Asset): number {
    return Math.abs(parseFloat(asset.changeValue.replace('$', '')));
  }

  // NFT Methods
  loadNFTs() {
    if (!this.walletAddress) {
      return;
    }

    this.isLoadingNFTs = true;
    this.nftSubscription = this.nftService.getNFTsByAddress(this.walletAddress).subscribe({
      next: (nfts) => {
        this.nfts = nfts;
        this.nftCollections = this.nftService.groupNFTsByCollection(nfts);
        this.calculateNFTTotalValue();
        this.isLoadingNFTs = false;
      },
      error: (error) => {
        console.error('Error loading NFTs:', error);
        this.isLoadingNFTs = false;
        // Fallback to mock data if API fails
        this.loadMockNFTs();
      }
    });
  }

  loadMockNFTs() {
    // Mock NFT data for demonstration
    this.nfts = [
      {
        id: '1',
        tokenId: '123',
        contractAddress: '0x1234...',
        name: 'Rodeo posts',
        description: 'kitty',
        imageUrl: 'https://via.placeholder.com/300',
        collectionName: 'Rodeo posts',
        floorPrice: 0.0005,
        floorPriceCurrency: 'ETH',
        network: 'ethereum',
        owner: this.walletAddress || ''
      },
      {
        id: '2',
        tokenId: '456',
        contractAddress: '0x5678...',
        name: 'BBM',
        description: 'BIG BROTHER MUSICAL',
        imageUrl: 'https://via.placeholder.com/300',
        collectionName: 'www.token-maker.app - 5xd9t...',
        floorPrice: 14.734,
        floorPriceCurrency: 'POL',
        network: 'polygon',
        owner: this.walletAddress || ''
      }
    ];
    this.nftCollections = this.nftService.groupNFTsByCollection(this.nfts);
    this.calculateNFTTotalValue();
  }

  calculateNFTTotalValue() {
    this.nftTotalValue = this.nfts.reduce((total, nft) => {
      if (nft.floorPrice) {
        // Convert to USD (simplified - in production, fetch real prices)
        const ethPrice = 3000; // Mock ETH price
        const polygonPrice = 0.8; // Mock POL price
        const price = nft.floorPriceCurrency === 'ETH' 
          ? nft.floorPrice * ethPrice 
          : nft.floorPrice * polygonPrice;
        return total + price;
      }
      return total;
    }, 0);
  }

  getFilteredNFTs(): NFT[] {
    let filtered = [...this.nfts];

    // Filter by collection
    if (this.selectedCollection !== 'all') {
      filtered = filtered.filter(nft => nft.collectionName === this.selectedCollection);
    }

    // Sort
    filtered.sort((a, b) => {
      if (this.nftSortBy === 'price-high') {
        return (b.floorPrice || 0) - (a.floorPrice || 0);
      } else if (this.nftSortBy === 'price-low') {
        return (a.floorPrice || 0) - (b.floorPrice || 0);
      } else {
        // Recent (by tokenId as proxy)
        return parseInt(b.tokenId) - parseInt(a.tokenId);
      }
    });

    return filtered;
  }

  setNFTSort(sortBy: 'price-high' | 'price-low' | 'recent') {
    this.nftSortBy = sortBy;
  }

  setCollectionFilter(collection: string) {
    this.selectedCollection = collection;
  }

  formatPrice(price: number | undefined, currency: string = 'ETH'): string {
    if (!price) return 'N/A';
    return `${price.toFixed(4)} ${currency}`;
  }

  getCollectionNames(): string[] {
    return ['all', ...this.nftCollections.map(c => c.name)];
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'https://via.placeholder.com/300?text=NFT';
    }
  }

  // Wallet Disconnect Methods
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
    // Reset all component state
    this.walletAddress = null;
    this.balance = '0.00';
    this.totalValue = 0;
    this.changePercent = 0;
    this.changeValue = 0;
    this.nfts = [];
    this.nftCollections = [];
    this.nftTotalValue = 0;
    this.assets = [];
    this.transactions = [];
    // Navigate to connect wallet page
    this.router.navigate(['/dashboard/connect-wallet']);
  }

  navigateToConnectWallet() {
    this.router.navigate(['/dashboard/connect-wallet']);
  }
}
