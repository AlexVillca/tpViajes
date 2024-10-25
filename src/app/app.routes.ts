import { Routes } from '@angular/router';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { RegisterComponent } from './components/register/register.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Component } from '@angular/core';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent},
  { path:'home', component:HomeComponent},
  { path: 'login', component: LoginFormComponent },
  { path: 'register', component: RegisterComponent }
];

