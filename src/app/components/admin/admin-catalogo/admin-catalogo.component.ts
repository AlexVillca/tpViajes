import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Atraccion, Ciudad, Pais } from '../../../models/interface/pais.interface';
import { PaisesService } from '../../../core/service/paises.service';
import { AdminService, CambiosPais } from '../../../core/service/admin.service';
import { FeedbackService } from '../../../core/service/feedback.service';
import { PopUpConfirmarComponent } from '../../utils/pop-up-confirmar/pop-up-confirmar.component';

type EstadoImagen = 'ok' | 'rota' | 'sin';
interface ImagenRota { pais: Pais; ciudad: string; atraccion: string; }

/** Campos de texto del país que se pueden editar, en el orden en que se muestran. */
const CAMPOS_PAIS = ['capital', 'moneda', 'idiomaOficial', 'continente', 'clima', 'gastronomia', 'cultura', 'seguridad', 'transporte'] as const;
type CampoPais = typeof CAMPOS_PAIS[number];

/** Prueba si una imagen carga en el navegador (con tiempo máximo), igual que la vería un visitante. */
export function probarImagen(url: string | undefined, tiempoMs = 15000): Promise<EstadoImagen> {
  if (!url || (!url.includes('://') && !url.startsWith('assets/'))) return Promise.resolve('sin');
  return new Promise(resolver => {
    const img = new Image();
    const reloj = setTimeout(() => { img.src = ''; resolver('rota'); }, tiempoMs);
    img.onload = () => { clearTimeout(reloj); resolver(img.naturalWidth > 1 ? 'ok' : 'rota'); };
    img.onerror = () => { clearTimeout(reloj); resolver('rota'); };
    img.src = url;
  });
}

/**
 * Catálogo: lista de países (con buscador y estado oculto/visible) y editor del país elegido.
 * Se edita un borrador; "Guardar" manda el país completo y "Descartar" vuelve a lo guardado.
 * El nombre de una ciudad no se edita porque comentarios, valoraciones y favoritos se enlazan por él.
 */
@Component({
  selector: 'app-admin-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, PopUpConfirmarComponent],
  templateUrl: './admin-catalogo.component.html'
})
export class AdminCatalogoComponent implements OnInit {
  private readonly paisesService = inject(PaisesService);
  private readonly admin = inject(AdminService);
  private readonly feedback = inject(FeedbackService);
  @Output() cambio = new EventEmitter<void>();

  readonly camposPais = CAMPOS_PAIS;
  readonly camposLargos: CampoPais[] = ['clima', 'gastronomia', 'cultura', 'seguridad', 'transporte'];

  paises: Pais[] = [];
  cargando = true;
  error = '';
  busqueda = '';

  original: Pais | null = null;
  borrador: Pais | null = null;
  ciudadIndice = 0;
  guardando = false;
  /** País al que se quiere pasar cuando hay cambios sin guardar (pide confirmación). */
  paisPendiente: Pais | null = null;
  atraccionABorrar: number | null = null;

  estadoImagenes: Record<string, EstadoImagen> = {};
  revisando = false;
  progresoRevision = 0;
  totalRevision = 0;
  imagenesRotas: ImagenRota[] | null = null;

  ngOnInit(): void {
    // Con los ocultos incluidos, así se pueden volver a mostrar.
    this.paisesService.getPaises({ incluirOcultos: true }).subscribe({
      next: paises => {
        this.paises = [...paises].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        this.cargando = false;
      },
      error: (e: Error) => { this.error = e.message; this.cargando = false; }
    });
  }

  get paisesFiltrados(): Pais[] {
    const b = this.busqueda.trim().toLowerCase();
    return b ? this.paises.filter(p => p.nombre.toLowerCase().includes(b)) : this.paises;
  }

  get ciudad(): Ciudad | null {
    return this.borrador?.ciudades?.[this.ciudadIndice] ?? null;
  }

  get hayCambios(): boolean {
    return !!this.borrador && JSON.stringify(this.borrador) !== JSON.stringify(this.original);
  }

  esLargo(campo: CampoPais): boolean {
    return this.camposLargos.includes(campo);
  }

  /** Acceso tipado a un texto del país para el formulario. */
  textoPais(campo: CampoPais): string {
    return (this.borrador?.[campo] as string | undefined) ?? '';
  }

  setTextoPais(campo: CampoPais, valor: string): void {
    if (this.borrador) (this.borrador as unknown as Record<string, unknown>)[campo] = valor;
  }

  elegir(pais: Pais): void {
    if (this.hayCambios && pais.id !== this.original?.id) {
      this.paisPendiente = pais;
      return;
    }
    this.abrir(pais);
  }

  abrir(pais: Pais): void {
    this.paisPendiente = null;
    this.original = pais;
    this.borrador = structuredClone(pais);
    this.ciudadIndice = 0;
  }

  descartar(): void {
    if (this.original) this.borrador = structuredClone(this.original);
  }

  /** Ocultar o mostrar se guarda en el momento (no depende de "Guardar"). */
  cambiarVisible(pais: Pais): void {
    const visible = !pais.visible;
    this.admin.actualizarPais(pais.id!, { visible }).subscribe({
      next: () => {
        pais.visible = visible;
        if (this.borrador && this.original?.id === pais.id) this.borrador.visible = visible;
        this.feedback.success(visible ? 'admin.catalogo.mostrado' : 'admin.catalogo.ocultado');
        this.cambio.emit();
      },
      error: (e: Error) => this.feedback.error(e.message)
    });
  }

  guardar(): void {
    const borrador = this.borrador;
    if (!borrador?.id || !this.hayCambios || this.guardando) return;
    const cambios: CambiosPais = { ciudades: borrador.ciudades ?? [] };
    for (const campo of CAMPOS_PAIS) (cambios as Record<string, unknown>)[campo] = borrador[campo] ?? '';
    this.guardando = true;
    this.admin.actualizarPais(borrador.id, cambios).subscribe({
      next: guardado => {
        this.guardando = false;
        const indice = this.paises.findIndex(p => p.id === guardado.id);
        // Lo que devuelve el backend ya viene limpio (por ejemplo, sin textos de relleno en las imágenes).
        const actualizado = { ...borrador, ...guardado, ciudades: guardado.ciudades };
        if (indice >= 0) this.paises[indice] = actualizado;
        this.original = actualizado;
        this.borrador = structuredClone(actualizado);
        this.feedback.success('admin.catalogo.guardado');
        this.cambio.emit();
      },
      error: (e: Error) => { this.guardando = false; this.feedback.error(e.message); }
    });
  }

  agregarAtraccion(): void {
    const ciudad = this.ciudad;
    if (!ciudad) return;
    ciudad.atracciones = [...(ciudad.atracciones ?? []), { nombre: '', descripcion: '', imagen: '' } as Atraccion];
    setTimeout(() => document.getElementById(`atraccion-nombre-${(ciudad.atracciones?.length ?? 1) - 1}`)?.focus());
  }

  borrarAtraccion(): void {
    const ciudad = this.ciudad;
    if (ciudad?.atracciones && this.atraccionABorrar !== null) {
      ciudad.atracciones = ciudad.atracciones.filter((_, i) => i !== this.atraccionABorrar);
    }
    this.atraccionABorrar = null;
  }

  /** Las coordenadas se editan como texto y se guardan como número (o se quitan si quedan vacías). */
  setCoordenada(a: Atraccion, campo: 'latitud' | 'longitud', valor: string): void {
    const numero = valor === '' ? NaN : Number(valor);
    a.ubicacion = { direccion: a.ubicacion?.direccion ?? '', latitud: a.ubicacion?.latitud ?? 0, longitud: a.ubicacion?.longitud ?? 0 };
    a.ubicacion[campo] = Number.isFinite(numero) ? numero : 0;
  }

  claveImagen(paisId: string | undefined, ciudad: string, atraccion: number): string {
    return `${paisId}|${ciudad}|${atraccion}`;
  }

  estadoDe(ciudad: string, indice: number): EstadoImagen | undefined {
    return this.estadoImagenes[this.claveImagen(this.borrador?.id, ciudad, indice)];
  }

  /** Revisa las imágenes de un país (o de todo el catálogo) cargándolas en el navegador, de a 6. */
  async revisarImagenes(soloEste: boolean): Promise<void> {
    if (this.revisando) return;
    const lista = (soloEste && this.borrador ? [this.borrador] : this.paises).flatMap(pais =>
      (pais.ciudades ?? []).flatMap(ciudad => (ciudad.atracciones ?? []).map((a, i) => ({ pais, ciudad: ciudad.nombre, i, a }))));
    this.revisando = true;
    this.progresoRevision = 0;
    this.totalRevision = lista.length;
    const rotas: ImagenRota[] = [];
    let siguiente = 0;
    const trabajador = async () => {
      while (siguiente < lista.length) {
        const item = lista[siguiente++];
        const estado = await probarImagen(item.a.imagen);
        this.estadoImagenes[this.claveImagen(item.pais.id, item.ciudad, item.i)] = estado;
        if (estado !== 'ok') rotas.push({ pais: item.pais, ciudad: item.ciudad, atraccion: item.a.nombre });
        this.progresoRevision++;
      }
    };
    await Promise.all(Array.from({ length: 6 }, trabajador));
    this.imagenesRotas = rotas.sort((x, y) => x.pais.nombre.localeCompare(y.pais.nombre, 'es'));
    this.revisando = false;
    this.feedback.success('admin.catalogo.revisionLista');
  }

  /** Desde la lista de imágenes rotas, abre ese país en esa ciudad. */
  irA(rota: ImagenRota): void {
    if (this.hayCambios && rota.pais.id !== this.original?.id) { this.paisPendiente = rota.pais; return; }
    if (rota.pais.id !== this.original?.id) this.abrir(rota.pais);
    this.ciudadIndice = Math.max(0, this.borrador?.ciudades?.findIndex(c => c.nombre === rota.ciudad) ?? 0);
    setTimeout(() => document.getElementById('editor-pais')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  /** Cuando se cambia el link de una imagen, se vuelve a probar sola. */
  async reprobar(a: Atraccion, i: number): Promise<void> {
    if (!this.borrador || !this.ciudad) return;
    this.estadoImagenes[this.claveImagen(this.borrador.id, this.ciudad.nombre, i)] = await probarImagen(a.imagen);
  }
}
