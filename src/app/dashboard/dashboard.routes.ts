import { Routes } from "@angular/router";
import { DashboardContainerComponent } from "./dashboard-container/dashboard-container.component";
import { HomeComponent } from "./views/home/home.component";
import { ConnectComponent } from "./views/connect/connect.component";
import { ApprovalsComponent } from "./views/approvals/approvals.component";
import { SettingsComponent } from "./views/settings/settings.component";


export const dashboardRoutes: Routes = [
    {
        path: '',
        component: DashboardContainerComponent,
        children: [
            {
                path: 'home',
                component: HomeComponent
            },
            { path: '', redirectTo:'home', pathMatch:'full' }, 
            { path: 'connect-wallet', component: ConnectComponent },
            { path: 'approvals', component: ApprovalsComponent },
            { path: 'settings', component: SettingsComponent },
            { path: '**', redirectTo:'home', pathMatch:'full' }, 
        ]
    }
]