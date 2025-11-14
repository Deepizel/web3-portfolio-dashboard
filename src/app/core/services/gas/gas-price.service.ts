import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap, startWith } from 'rxjs/operators';
import { of } from 'rxjs';

export interface GasPrice {
  eth: {
    slow: number;
    standard: number;
    fast: number;
    unit: string;
  };
  solana: {
    price: number;
    unit: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GasPriceService {
  private gasPrice$ = new BehaviorSubject<GasPrice>({
    eth: { slow: 0, standard: 0, fast: 0, unit: 'Gwei' },
    solana: { price: 0, unit: 'SOL' }
  });

  constructor(private http: HttpClient) {
    // Fetch gas prices immediately and then every 30 seconds
    this.startGasPriceUpdates();
  }

  /**
   * Get gas prices as Observable
   */
  getGasPrices(): Observable<GasPrice> {
    return this.gasPrice$.asObservable();
  }

  /**
   * Start periodic gas price updates
   */
  private startGasPriceUpdates(): void {
    // Fetch immediately
    this.fetchGasPrices();

    // Then fetch every 30 seconds
    interval(30000).subscribe(() => {
      this.fetchGasPrices();
    });
  }

  /**
   * Fetch current gas prices
   */
  private async fetchGasPrices(): Promise<void> {
    try {
      const [ethGas, solanaGas] = await Promise.all([
        this.fetchEthGasPrice(),
        this.fetchSolanaGasPrice()
      ]);

      this.gasPrice$.next({
        eth: ethGas,
        solana: solanaGas
      });
    } catch (error) {
      console.error('Error fetching gas prices:', error);
    }
  }

  /**
   * Fetch Ethereum gas price from multiple APIs with fallbacks
   */
  private async fetchEthGasPrice(): Promise<{ slow: number; standard: number; fast: number; unit: string }> {
    try {
      // Try Blocknative API first (most reliable)
      try {
        const blocknativeResponse: any = await fetch('https://api.blocknative.com/gasprices/blockprices', {
          headers: {
            'Authorization': '' // Can add API key if needed
          }
        }).then(res => res.json()).catch(() => null);

        if (blocknativeResponse && blocknativeResponse.blockPrices && blocknativeResponse.blockPrices.length > 0) {
          const prices = blocknativeResponse.blockPrices[0].estimatedPrices;
          if (prices && prices.length >= 3) {
            return {
              slow: Math.round(prices[0]?.price || 0),
              standard: Math.round(prices[1]?.price || 0),
              fast: Math.round(prices[2]?.price || 0),
              unit: 'Gwei'
            };
          }
        }
      } catch (e) {
        // Continue to next API
      }

      // Fallback: Use ethgasstation API
      try {
        const ethgasResponse: any = await fetch('https://ethgasstation.info/api/ethgasAPI.json')
          .then(res => res.json())
          .catch(() => null);

        if (ethgasResponse && ethgasResponse.safe) {
          return {
            slow: Math.round(ethgasResponse.safe / 10) || 20,
            standard: Math.round(ethgasResponse.average / 10) || 30,
            fast: Math.round(ethgasResponse.fast / 10) || 40,
            unit: 'Gwei'
          };
        }
      } catch (e) {
        // Continue to next API
      }

      // Final fallback: Use a simple public API
      try {
        const simpleResponse: any = await fetch('https://api.owlracle.info/v1/eth')
          .then(res => res.json())
          .catch(() => null);

        if (simpleResponse && simpleResponse.speeds) {
          const speeds = simpleResponse.speeds;
          return {
            slow: Math.round(speeds[0]?.gasPrice || 20),
            standard: Math.round(speeds[1]?.gasPrice || 30),
            fast: Math.round(speeds[2]?.gasPrice || 40),
            unit: 'Gwei'
          };
        }
      } catch (e) {
        // Use defaults
      }

      // Default values if all APIs fail
      return { slow: 20, standard: 30, fast: 40, unit: 'Gwei' };
    } catch (error) {
      console.error('Error fetching ETH gas price:', error);
      return { slow: 20, standard: 30, fast: 40, unit: 'Gwei' };
    }
  }

  /**
   * Fetch Solana gas price
   */
  private async fetchSolanaGasPrice(): Promise<{ price: number; unit: string }> {
    try {
      // Solana uses a different model - fees are typically very low and fixed
      // We'll fetch from a Solana RPC endpoint
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getRecentPrioritizationFees',
          params: []
        })
      });

      const data: any = await response.json();

      if (data && data.result && data.result.length > 0) {
        // Get average prioritization fee (in microlamports, convert to SOL)
        const fees = data.result.map((r: any) => r.prioritizationFee || 0);
        const avgFee = fees.reduce((a: number, b: number) => a + b, 0) / fees.length;
        // Convert microlamports to SOL (1 SOL = 1,000,000,000 lamports, microlamports are lamports/1000)
        const priceInSol = avgFee / 1000000000;
        return {
          price: priceInSol || 0.000005,
          unit: 'SOL'
        };
      }

      // Fallback: Solana fees are typically very low (~0.000005 SOL per transaction)
      return { price: 0.000005, unit: 'SOL' };
    } catch (error) {
      console.error('Error fetching Solana gas price:', error);
      return { price: 0.000005, unit: 'SOL' };
    }
  }
}

