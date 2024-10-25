import { Routes } from '@angular/router';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { RegisterComponent } from './components/register/register.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { PaisesListComponent } from './paises/paises-list/paises-list.component';
import { PaisDetailComponent } from './paises/pais-detail/pais-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginFormComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'paises', component: PaisesListComponent },
  { path: 'pais', component: PaisDetailComponent } // Ruta sin parámetro
];
