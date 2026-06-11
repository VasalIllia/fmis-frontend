import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { farmGuard } from './core/guards/farm.guard';
import { nonAuthGuard } from './core/guards/non-auth.guard';
import { OverviewComponent } from './features/farm/overview/overview.component';
import { ProfileComponent } from './features/profile/profile.component';
import { FarmCreateComponent } from './features/farm/farm-create/farm-create.component';


export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [nonAuthGuard],
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
      { path: 'confirm-email', loadComponent: () => import('./features/auth/confirm-email/confirm-email.component').then(m => m.ConfirmEmailComponent) },
      { path: 'google-callback', loadComponent: () => import('./features/auth/google-callback/google-callback.component').then(m => m.GoogleCallbackComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'overview', component: OverviewComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'farm/create', component: FarmCreateComponent },
      {
        path: 'animals',
        canActivate: [farmGuard],
        children: [
          { path: '', loadComponent: () => import('./features/animals/animals.component').then(m => m.AnimalsComponent) },
          { path: 'locations', loadComponent: () => import('./features/animals/locations/animal-locations.component').then(m => m.AnimalLocationsComponent) },
          { path: 'products', loadComponent: () => import('./features/animals/products/animal-products-page.component').then(m => m.AnimalProductsPageComponent) },
          { path: 'matings', loadComponent: () => import('./features/animals/matings/animal-matings-page.component').then(m => m.AnimalMatingsPageComponent) },
          { path: 'medical-info', loadComponent: () => import('./features/animals/medical-info/medical-info-page.component').then(m => m.MedicalInfoPageComponent) },
          { path: ':id', loadComponent: () => import('./features/animals/details/animal-details.component').then(m => m.AnimalDetailsComponent) }
        ]
      },
      {
        path: 'crops',
        canActivate: [farmGuard],
        children: [
          { path: '', loadComponent: () => import('./features/crops/crops.component').then(m => m.CropsComponent) },
          { path: 'locations', loadComponent: () => import('./features/crops/locations/crop-locations.component').then(m => m.CropLocationsComponent) },
          { path: 'harvests', loadComponent: () => import('./features/crops/harvests/crop-harvests.component').then(m => m.CropHarvestsComponent) },
          { path: ':id', loadComponent: () => import('./features/crops/details/crop-details.component').then(m => m.CropDetailsComponent) }
        ]
      },
      {
        path: 'gardens',
        canActivate: [farmGuard],
        children: [
          { path: '', loadComponent: () => import('./features/gardens/gardens.component').then(m => m.GardensComponent) },
          { path: 'locations', loadComponent: () => import('./features/gardens/locations/garden-locations.component').then(m => m.GardenLocationsComponent) },
          { path: 'harvests', loadComponent: () => import('./features/gardens/harvests/garden-harvests.component').then(m => m.GardenHarvestsComponent) },
          { path: ':id', loadComponent: () => import('./features/gardens/details/garden-details.component').then(m => m.GardenDetailsComponent) }
        ]
      },
      {
        path: 'finances',
        canActivate: [farmGuard],
        loadComponent: () => import('./features/finances/finances.component').then(m => m.FinancesComponent)
      },
      {
        path: 'statistics',
        canActivate: [farmGuard],
        loadComponent: () => import('./features/statistics/statistics.component').then(m => m.StatisticsComponent)
      },
      {
        path: 'planning',
        canActivate: [farmGuard],
        loadComponent: () => import('./features/planning/planning.component').then(m => m.PlanningComponent)
      },
      {
        path: 'notifications',
        canActivate: [farmGuard],
        loadComponent: () => import('./features/planning/notifications/notifications-page.component').then(m => m.NotificationsPageComponent)
      },
      { path: 'planning/notifications', redirectTo: 'notifications', pathMatch: 'full' },
      { path: '', redirectTo: 'overview', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];