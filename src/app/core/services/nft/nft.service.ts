import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environment/environment';

export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  description: string;
  imageUrl: string;
  collectionName: string;
  collectionSlug?: string;
  floorPrice?: number;
  floorPriceCurrency?: string;
  network: string;
  owner: string;
  metadata?: any;
}

export interface NFTCollection {
  name: string;
  slug: string;
  imageUrl?: string;
  floorPrice?: number;
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class NFTService {
  // Using Alchemy API - you can get a free API key from https://www.alchemy.com/
  // For production, store this in environment variables
  private readonly ALCHEMY_API_KEY = environment.alchemyApiKey; // Replace with your Alchemy API key
  private readonly ALCHEMY_BASE_URL = environment.alchemyBaseUrl;
  
  // OpenSea API as fallback
  private readonly OPENSEA_API_URL = environment.openseaApiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Fetch all NFTs owned by a wallet address
   */
  getNFTsByAddress(address: string, network: string = 'eth-mainnet'): Observable<NFT[]> {
    if (!address) {
      return of([]);
    }

    // Try Alchemy first
    return this.fetchFromAlchemy(address, network).pipe(
      catchError(() => {
        // Fallback to OpenSea
        return this.fetchFromOpenSea(address);
      }),
      catchError(() => {
        // If both fail, return empty array
        console.warn('Failed to fetch NFTs from both Alchemy and OpenSea');
        return of([]);
      })
    );
  }

  /**
   * Fetch NFTs using Alchemy API
   * Note: You need to get a free API key from https://www.alchemy.com/
   * Replace 'demo' with your actual API key
   */
  private fetchFromAlchemy(address: string, network: string): Observable<NFT[]> {
    // If using demo key, return empty to trigger fallback
    if (!this.ALCHEMY_API_KEY) {
      throw new Error('Alchemy API key not configured');
    }

    const url = `${this.ALCHEMY_BASE_URL}/${this.ALCHEMY_API_KEY}/getNFTs`;
    const params = {
      owner: address,
      withMetadata: 'true',
      pageSize: '100'
    };

    return this.http.get<any>(url, { params }).pipe(
      map((response) => {
        if (!response.ownedNfts || response.ownedNfts.length === 0) {
          return [];
        }

        return response.ownedNfts.map((nft: any) => this.mapAlchemyNFT(nft, address));
      })
    );
  }

  /**
   * Fetch NFTs using OpenSea API
   */
  private fetchFromOpenSea(address: string): Observable<NFT[]> {
    const url = `${this.OPENSEA_API_URL}/chain/ethereum/account/${address}/nfts`;
    const headers = new HttpHeaders({
      'X-API-KEY': '' // OpenSea API key if you have one (optional for public endpoints)
    });

    return this.http.get<any>(url, { headers }).pipe(
      map((response) => {
        if (!response.nfts || response.nfts.length === 0) {
          return [];
        }

        return response.nfts.map((nft: any) => this.mapOpenSeaNFT(nft, address));
      })
    );
  }

  /**
   * Map Alchemy API response to NFT interface
   */
  private mapAlchemyNFT(nft: any, owner: string): NFT {
    const metadata = nft.metadata || {};
    const imageUrl = this.getImageUrl(metadata.image || metadata.image_url || '');
    
    return {
      id: `${nft.contract.address}-${nft.id.tokenId}`,
      tokenId: nft.id.tokenId,
      contractAddress: nft.contract.address,
      name: metadata.name || `#${nft.id.tokenId}`,
      description: metadata.description || '',
      imageUrl: imageUrl,
      collectionName: nft.contract.name || 'Unknown Collection',
      network: 'ethereum',
      owner: owner,
      metadata: metadata,
      floorPrice: undefined, // Will need separate call for floor price
      floorPriceCurrency: 'ETH'
    };
  }

  /**
   * Map OpenSea API response to NFT interface
   */
  private mapOpenSeaNFT(nft: any, owner: string): NFT {
    const imageUrl = this.getImageUrl(nft.image_url || nft.image || '');
    
    return {
      id: `${nft.contract}-${nft.identifier}`,
      tokenId: nft.identifier,
      contractAddress: nft.contract,
      name: nft.name || `#${nft.identifier}`,
      description: nft.description || '',
      imageUrl: imageUrl,
      collectionName: nft.collection || 'Unknown Collection',
      collectionSlug: nft.collection_slug,
      network: 'ethereum',
      owner: owner,
      metadata: nft,
      floorPrice: nft.floor_price ? parseFloat(nft.floor_price) : undefined,
      floorPriceCurrency: 'ETH'
    };
  }

  /**
   * Get image URL, handling IPFS and HTTP URLs
   */
  private getImageUrl(url: string): string {
    if (!url) return '/assets/images/placeholder-nft.png';
    
    // Handle IPFS URLs
    if (url.startsWith('ipfs://')) {
      return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
    }
    
    // Handle IPFS gateway URLs
    if (url.includes('ipfs')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    return url;
  }

  /**
   * Get floor price for a collection (mock implementation)
   * In production, you'd call an API like OpenSea or Reservoir
   */
  getCollectionFloorPrice(collectionSlug: string): Observable<number | undefined> {
    // Mock implementation - replace with actual API call
    return of(undefined);
  }

  /**
   * Group NFTs by collection
   */
  groupNFTsByCollection(nfts: NFT[]): NFTCollection[] {
    const collectionMap = new Map<string, NFT[]>();
    
    nfts.forEach(nft => {
      const key = nft.collectionName;
      if (!collectionMap.has(key)) {
        collectionMap.set(key, []);
      }
      collectionMap.get(key)!.push(nft);
    });

    return Array.from(collectionMap.entries()).map(([name, nftList]) => ({
      name,
      slug: nftList[0].collectionSlug || name.toLowerCase().replace(/\s+/g, '-'),
      imageUrl: nftList[0].imageUrl,
      count: nftList.length,
      floorPrice: nftList[0].floorPrice
    }));
  }
}

