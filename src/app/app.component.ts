import { Component } from '@angular/core';

import { LoginFormComponent } from './core/auth/login-form/login-form.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { NavbarComponent } from "./components/navbar/navbar.component";
import { HttpClientModule } from '@angular/common/http';
import { FooterComponent } from "./components/footer/footer.component";
import { PaisesListComponent } from './components/paises/paises-list/paises-list.component';
import { PaisDetailComponent } from './components/paises/pais-detail/pais-detail.component';

import { FiltroPaisesPipe } from './pipes/filtro-paises.pipe';
import { CiudadDetailComponent } from './components/paises/ciudad-detail/ciudad-detail.component';
import { GameComponent } from './game/game.component';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    LoginFormComponent,
    RegisterComponent,
    NavbarComponent,
    HttpClientModule,
    FooterComponent,
    FooterComponent,
    PaisesListComponent,
    PaisDetailComponent,
    FiltroPaisesPipe,
    GameComponent,
    CiudadDetailComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

}
