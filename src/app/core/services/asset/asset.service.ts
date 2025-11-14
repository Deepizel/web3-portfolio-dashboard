import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { environment } from "../../environment/environment";

@Injectable({ providedIn: 'root' })
export class AssetService {
  private ALCHEMY_KEY = environment.alchemyApiKey;
  private API_URL = `${environment.alchemyTransactionUrl}${this.ALCHEMY_KEY}`;

  COINGECKO_IDS: Record<string, string> = {
    ETH: 'ethereum',
    WETH: 'weth',
    USDC: 'usd-coin',
    DAI: 'dai',
    BUSD: 'binance-usd',
    // add more as needed
  };
  
  constructor(private http: HttpClient) {}

  getTokenBalances(wallet: string): Observable<any> {
    const body = {
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getTokenBalances",
      params: [wallet]
    };
    return this.http.post<any>(this.API_URL, body);
  }

  getTokenMetadata(contractAddress: string): Observable<any> {
    const body = {
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getTokenMetadata",
      params: [contractAddress]
    };
    return this.http.post<any>(this.API_URL, body);
  }

  getCoinGeckoId(symbol: string): string | null {
    return this.COINGECKO_IDS[symbol.toUpperCase()] || null;
  }

  getTokenPrice(symbol: string, currency: 'USD' | 'NGN' | 'GBP' = 'USD'): Observable<any> {
    const id = this.COINGECKO_IDS[symbol.toUpperCase()];
    if (!id) {
      return of({ [currency.toLowerCase()]: 0 }); // fallback if unknown
    }
    return this.http.get<any>(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=${currency.toLowerCase()}`
    );
  }
  
}
