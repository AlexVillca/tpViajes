
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function valorExistenteMap(mapa: Map<string, string>): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    const valorComprobar = control.value;

    if (!valorComprobar) {
      return null;
    }

    const yaExiste = Array.from(mapa.values()).includes(valorComprobar);

    return yaExiste ? { valorExistente: true } : null;
  };
}
