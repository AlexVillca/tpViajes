import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../../core/service/currency.service';

@Component({
  selector: 'app-conversor-moneda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conversor-moneda.component.html',
  styleUrls: ['./conversor-moneda.component.css']
})
export class ConversorMonedaComponent implements OnInit {
  // Recibe el texto crudo de la moneda del pais (ej: "Peso argentino (ARS)").
  @Input() monedaPais?: string;

  private currencyService = inject(CurrencyService);

  // Monedas de origen que puede elegir el usuario.
  monedasBase = ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'MXN', 'GBP'];

  monedaDestino: string | null = null;
  baseSeleccionada = 'ARS';
  monto = 1000;

  private tasas: Record<string, number> = {};
  ultimaActualizacion = '';

  cargando = false;
  error: string | null = null;

  ngOnInit(): void {
    this.monedaDestino = this.currencyService.extraerCodigoIso(this.monedaPais);
    if (this.monedaDestino) {
      this.cargarTasas();
    }
  }

  // Se llama al iniciar y cada vez que cambia la moneda de origen.
  cargarTasas(): void {
    this.cargando = true;
    this.error = null;
    this.currencyService.getTasas(this.baseSeleccionada).subscribe({
      next: (data) => {
        this.tasas = data.rates;
        this.ultimaActualizacion = data.ultimaActualizacion;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.message ?? 'No se pudieron obtener las cotizaciones.';
        this.cargando = false;
      }
    });
  }

  // Cotizacion de 1 unidad de la moneda base -> moneda del pais.
  get tasa(): number | null {
    if (!this.monedaDestino) {
      return null;
    }
    return this.tasas[this.monedaDestino] ?? null;
  }

  // Resultado de convertir el monto ingresado.
  get resultado(): number | null {
    const tasa = this.tasa;
    if (tasa === null || this.monto === null || this.monto === undefined) {
      return null;
    }
    return this.monto * tasa;
  }
}
