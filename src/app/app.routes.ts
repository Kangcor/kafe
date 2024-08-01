import { Routes } from '@angular/router';

export const routes: Routes = [
    {path: 'reservation', loadComponent: () => import('./features/reservation/pages/reservation-form/reservation-form.component').then(mod => mod.ReservationFormComponent)},
    {path: 'reservation/:id', loadComponent: () => import('./features/reservation/pages/reservation-success/reservation-success.component').then(mod => mod.ReservationSuccessComponent)},
    // {path: '', loadComponent: () => import('./reservation-form/reservation-form.component').then(mod => mod.ReservationFormComponent)},
  ];