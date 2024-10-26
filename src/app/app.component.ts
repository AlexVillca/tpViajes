import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { RegisterComponent } from './components/register/register.component';
import { NavbarComponent } from "./components/navbar/navbar.component";
import { HttpClientModule } from '@angular/common/http';
import { FooterComponent } from "./components/footer/footer.component";
import { PaisesListComponent } from './paises/paises-list/paises-list.component';
import { PaisDetailComponent } from './paises/pais-detail/pais-detail.component';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { FiltroPaisesPipe } from './paises/filtro-paises.pipe';
import { CiudadDetailComponent } from './paises/ciudad-detail/ciudad-detail.component';


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
    CiudadDetailComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

}
