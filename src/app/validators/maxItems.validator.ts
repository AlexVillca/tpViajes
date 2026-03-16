import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function maxItemsValidator(
  coleccion: Map<any, any>,
  maxItems: number
): ValidatorFn {

  return (control: AbstractControl): ValidationErrors | null => {

    if (coleccion.size >= maxItems) {
      return { maxItemsAlcanzado: true };
    }

    return null;
  };
}
