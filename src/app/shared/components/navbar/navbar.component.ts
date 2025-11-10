import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToggleService } from '../../../core/services/toggle/toggle.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  // notificationCount$ = this.appStore.pipe(select(notificationCountSelector));
  showNotifications = false;
  unreadCount = 4;
  userDetails:any
  constructor(private route: Router,
     private toggleService: ToggleService) {

     }

  toggleSidebar() {
    this.toggleService.toggleSidebar();
  }


  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  navigateToNotifications(): void {
    this.route.navigate(['/main/notifications']);
  }

  logout() {
    // this.modalDialog.open(SignOutComponent, {
    //   width: '350px'
    // })
  }

  notify(event: MouseEvent): void {
    // const target = event.target as HTMLElement;
    // const rect = target.getBoundingClientRect();

    // const dialogRef = this.modalDialog.open(NotificationModalComponent, {
    //   width: '350px',
    //   position: {
    //     top: `${rect.bottom + window.scrollY}px`, 
    //     left: `${rect.left}px`,                  
    //   },
    //   hasBackdrop: false, 
    //   disableClose: true  
    // });
  
    // Function to detect clicks outside the modal
    // const closeDialogOnClickOutside = (clickEvent: MouseEvent) => {
    //   const clickedInsideDialog = (clickEvent.target as HTMLElement).closest('.mat-mdc-dialog-surface');
    //   if (!clickedInsideDialog) {
    //     dialogRef.close();
    //     document.removeEventListener('click', closeDialogOnClickOutside); // Remove listener after dialog is closed
    //   }
    // };
  
    // Add the event listener with a slight delay to avoid immediate closing due to the opening click bug experienced while setting this up
  //   setTimeout(() => {
  //     document.addEventListener('click', closeDialogOnClickOutside);
  //   }, 0);
  // }
  
  }
}
