import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { dashboardRoutes } from './dashboard/dashboard.routes';

export const routes: Routes = [
    {
        path: '',
        component: LandingComponent
    },
    {
        path: 'dashboard',
        children: dashboardRoutes
    }
];
