import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private API_URL = `${environment.alchemyTransactionUrl}${environment.alchemyApiKey}`
  
  constructor( private http: HttpClient) {

  }
// get all transactions for a wallet
  getTransactions(wallet: string): Observable<any> {
    const body = {
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [{
        fromBlock: "0x0",
        toBlock: "latest",
        fromAddress: wallet,
        toAddress: wallet,
        category: ["external", "erc20", "erc721", "erc1155"]
      }]
    };

    return this.http.post<any>(this.API_URL, body);
  }

}
