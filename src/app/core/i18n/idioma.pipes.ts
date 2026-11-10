import { Pipe, PipeTransform, inject } from '@angular/core';
import { IdiomaService } from './idioma.service';

// Los tres pipes son impuros a propósito: tienen que volver a calcularse cuando cambia el idioma.

/** Campo de la base en el idioma actual: {{ pais | dato:'clima' }}. */
@Pipe({ name: 'dato', standalone: true, pure: false })
export class DatoPipe implements PipeTransform {
  private readonly idioma = inject(IdiomaService);

  transform(objeto: unknown, campo: string): string {
    return this.idioma.dato(objeto, campo);
  }
}

/** Número con el formato del idioma actual. El formato es como el de Angular: '1.0-0', '1.2-2'. */
@Pipe({ name: 'numero', standalone: true, pure: false })
export class NumeroPipe implements PipeTransform {
  private readonly idioma = inject(IdiomaService);
  private readonly formateadores = new Map<string, Intl.NumberFormat>();

  transform(valor: number | null | undefined, formato = '1.0-0'): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return '';
    const clave = `${this.idioma.locale}|${formato}`;
    let formateador = this.formateadores.get(clave);
    if (!formateador) {
      const [, minimo = '0', maximo = '0'] = /^\d+\.(\d+)-(\d+)$/.exec(formato) ?? [];
      formateador = new Intl.NumberFormat(this.idioma.locale, {
        minimumFractionDigits: Number(minimo),
        maximumFractionDigits: Number(maximo)
      });
      this.formateadores.set(clave, formateador);
    }
    return formateador.format(valor);
  }
}

/** Fecha y hora con el formato del idioma actual. Si el texto no es una fecha, lo deja igual. */
@Pipe({ name: 'fecha', standalone: true, pure: false })
export class FechaPipe implements PipeTransform {
  private readonly idioma = inject(IdiomaService);

  transform(valor: string | null | undefined): string {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return valor;
    return new Intl.DateTimeFormat(this.idioma.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(fecha);
  }
}
