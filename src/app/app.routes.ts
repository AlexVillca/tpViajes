
import { LoginFormComponent } from './core/auth/login-form/login-form.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { PaisesListComponent } from './components/paises/paises-list/paises-list.component';
import { PaisDetailComponent } from './components/paises/pais-detail/pais-detail.component';
import { CiudadDetailComponent } from './components/paises/ciudad-detail/ciudad-detail.component';
import { Component } from '@angular/core';
import { GameComponent } from './game/game.component';
import { Routes } from '@angular/router';
import { ListaDeListasComponent } from './components/favoritos/lista-de-listas/lista-de-listas.component';
import { ListaComponent } from './components/favoritos/lista/lista.component';
import { ContactUsComponent } from './components/home/contact-us/contact-us.component';
import { AboutUsComponent } from './components/home/about-us/about-us.component';


export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginFormComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'paises', component: PaisesListComponent },
  { path: 'ciudad', component: CiudadDetailComponent },
  { path: 'Juego', component: GameComponent},
  { path: 'pais', component: PaisDetailComponent },
  { path: 'favoritos', component: ListaDeListasComponent},
  { path: 'favoritos/listaCiudadesComp/:idLista', component:ListaComponent},
  { path: 'contact', component:ContactUsComponent},
  { path: 'about', component:AboutUsComponent}

];
