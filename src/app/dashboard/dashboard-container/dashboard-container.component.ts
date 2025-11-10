import { Component } from '@angular/core';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-dashboard-container',
  imports: [SidebarComponent, NavbarComponent, RouterOutlet],
  templateUrl: './dashboard-container.component.html',
  styleUrl: './dashboard-container.component.css'
})
export class DashboardContainerComponent {

}
