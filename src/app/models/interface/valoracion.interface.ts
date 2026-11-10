/** Puntaje de 1 a 5 que un usuario le da a una ciudad. Hay una sola por usuario y ciudad. */
export interface Valoracion {
  id?: string;
  ciudad: string;
  paisId: string;
  usuarioId?: string;
  puntaje: number;
}
