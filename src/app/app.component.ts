import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { RegisterComponent } from './components/register/register.component';
import { NavbarComponent } from "./components/navbar/navbar.component";
import {HttpClientModule } from '@angular/common/http';
import { FooterComponent } from "./components/footer/footer.component";


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginFormComponent, RegisterComponent, NavbarComponent, HttpClientModule, FooterComponent,FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'tpFinal';
}
