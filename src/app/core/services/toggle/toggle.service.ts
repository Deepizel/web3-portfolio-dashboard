import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToggleService {
  private sidebarCollapsed = new BehaviorSubject<boolean>(false);
  sidebarCollapsed$ = this.sidebarCollapsed.asObservable();

  toggleSidebar() {
    this.sidebarCollapsed.next(!this.sidebarCollapsed.value);
  }

  setSidebar(state: boolean) {
    this.sidebarCollapsed.next(state);
  }

  getSidebarState(): boolean {
    return this.sidebarCollapsed.value;
  }
}
