import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CachedAssets {
  assets: any[];
  totalValue: number;
  balance: string;
  timestamp: number;
}

export interface CachedTransactions {
  transactions: any[];
  timestamp: number;
}

export interface CachedNFTs {
  nfts: any[];
  nftCollections: any[];
  nftTotalValue: number;
  timestamp: number;
}

export interface CachedPortfolioData {
  assets?: CachedAssets;
  transactions?: CachedTransactions;
  nfts?: CachedNFTs;
  balance?: string;
  totalValue?: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioCacheService {
  private readonly CACHE_KEY_PREFIX = 'portfolio_cache_';
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_AGE_MS = 30 * 60 * 1000; // 30 minutes max age before forcing refresh

  // In-memory cache for faster access
  private memoryCache: Map<string, CachedPortfolioData> = new Map();
  
  // Observable for cache updates
  private cacheUpdate$ = new BehaviorSubject<string | null>(null);

  constructor() {}

  /**
   * Get cache key for a wallet address
   */
  private getCacheKey(address: string): string {
    return `${this.CACHE_KEY_PREFIX}${address.toLowerCase()}`;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    const age = Date.now() - timestamp;
    return age < this.CACHE_EXPIRY_MS;
  }

  /**
   * Check if cache is stale (should refresh in background)
   */
  private isCacheStale(timestamp: number): boolean {
    const age = Date.now() - timestamp;
    return age > this.CACHE_EXPIRY_MS && age < this.MAX_CACHE_AGE_MS;
  }

  /**
   * Save portfolio data to cache
   */
  savePortfolioData(address: string, data: Partial<CachedPortfolioData>): void {
    const cacheKey = this.getCacheKey(address);
    const existingData = this.getPortfolioData(address);
    
    const cachedData: CachedPortfolioData = {
      ...existingData,
      ...data,
      timestamp: Date.now()
    };

    // Save to memory
    this.memoryCache.set(cacheKey, cachedData);

    // Save to localStorage
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      this.cacheUpdate$.next(address);
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
      // Continue with memory cache only
    }
  }

  /**
   * Get cached portfolio data
   */
  getPortfolioData(address: string): CachedPortfolioData | null {
    const cacheKey = this.getCacheKey(address);

    // Check memory cache first
    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey)!;
      if (this.isCacheValid(cached.timestamp)) {
        return cached;
      }
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const cached: CachedPortfolioData = JSON.parse(stored);
        
        // Update memory cache
        this.memoryCache.set(cacheKey, cached);
        
        // Return even if stale (for immediate display)
        return cached;
      }
    } catch (error) {
      console.warn('Failed to read cache from localStorage:', error);
    }

    return null;
  }

  /**
   * Check if cache exists and is valid
   */
  hasValidCache(address: string): boolean {
    const cached = this.getPortfolioData(address);
    return cached !== null && this.isCacheValid(cached.timestamp);
  }

  /**
   * Check if cache exists but is stale (needs background refresh)
   */
  hasStaleCache(address: string): boolean {
    const cached = this.getPortfolioData(address);
    return cached !== null && this.isCacheStale(cached.timestamp);
  }

  /**
   * Clear cache for a specific address
   */
  clearCache(address: string): void {
    const cacheKey = this.getCacheKey(address);
    this.memoryCache.delete(cacheKey);
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to clear cache from localStorage:', error);
    }
  }

  /**
   * Clear all portfolio caches
   */
  clearAllCache(): void {
    this.memoryCache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear all caches:', error);
    }
  }

  /**
   * Get cache update observable
   */
  getCacheUpdates(): Observable<string | null> {
    return this.cacheUpdate$.asObservable();
  }

  /**
   * Save assets data
   */
  saveAssets(address: string, assets: any[], totalValue: number, balance: string): void {
    this.savePortfolioData(address, {
      assets: {
        assets,
        totalValue,
        balance,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Save transactions data
   */
  saveTransactions(address: string, transactions: any[]): void {
    this.savePortfolioData(address, {
      transactions: {
        transactions,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Save NFTs data
   */
  saveNFTs(address: string, nfts: any[], nftCollections: any[], nftTotalValue: number): void {
    this.savePortfolioData(address, {
      nfts: {
        nfts,
        nftCollections,
        nftTotalValue,
        timestamp: Date.now()
      }
    });
  }
}

