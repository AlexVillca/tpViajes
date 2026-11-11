import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { authGuard } from './core/auth/auth.guard';

// El inicio se carga con la app; el resto de las páginas se descarga recién cuando se visita
// (carga diferida), así el paquete inicial es más liviano. Leaflet, por ejemplo, solo llega con /pais.
export const routes: Routes = [

  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', loadComponent: () => import('./core/auth/login-form/login-form.component').then(m => m.LoginFormComponent) },
  { path: 'register', loadComponent: () => import('./core/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'paises', loadComponent: () => import('./components/paises/paises-list/paises-list.component').then(m => m.PaisesListComponent) },
  { path: 'ciudad', loadComponent: () => import('./components/paises/ciudad-detail/ciudad-detail.component').then(m => m.CiudadDetailComponent) },
  { path: 'Juego', loadComponent: () => import('./game/game.component').then(m => m.GameComponent) },
  { path: 'ranking', loadComponent: () => import('./components/ranking/ranking.component').then(m => m.RankingComponent) },
  { path: 'pais', loadComponent: () => import('./components/paises/pais-detail/pais-detail.component').then(m => m.PaisDetailComponent) },
  { path: 'favoritos', canActivate: [authGuard], loadComponent: () => import('./components/favoritos/lista-de-listas/lista-de-listas.component').then(m => m.ListaDeListasComponent) },
  { path: 'listaCiudadesComp/:idLista', canActivate: [authGuard], loadComponent: () => import('./components/favoritos/lista/lista.component').then(m => m.ListaComponent) },
  { path: 'contact', loadComponent: () => import('./components/home/contact-us/contact-us.component').then(m => m.ContactUsComponent) },
  { path: 'about', loadComponent: () => import('./components/home/about-us/about-us.component').then(m => m.AboutUsComponent) },
  { path: 'updateP', canActivate: [authGuard], loadComponent: () => import('./core/auth/update-password/update-password.component').then(m => m.UpdatePasswordComponent) },
  { path: 'fichaUser', canActivate: [authGuard], loadComponent: () => import('./core/auth/ficha-user/ficha-user.component').then(m => m.FichaUserComponent) },
  { path: 'editarPerfil', canActivate: [authGuard], loadComponent: () => import('./core/auth/editar-perfil/editar-perfil.component').then(m => m.EditarPerfilComponent) },
  { path: '**', redirectTo: '' }

];
