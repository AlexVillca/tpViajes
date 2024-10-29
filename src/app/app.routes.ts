import { Routes } from '@angular/router';
import { LoginFormComponent } from './core/auth/login-form/login-form.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { PaisesListComponent } from './components/paises/paises-list/paises-list.component';
import { PaisDetailComponent } from './components/paises/pais-detail/pais-detail.component';
import { CiudadDetailComponent } from './components/paises/ciudad-detail/ciudad-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginFormComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'paises', component: PaisesListComponent },
  { path: 'ciudad', component: CiudadDetailComponent },
  { path: 'pais', component: PaisDetailComponent } // Ruta sin parámetro
];
