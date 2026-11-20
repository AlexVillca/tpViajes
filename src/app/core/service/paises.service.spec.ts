import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaisesService } from './paises.service';
import { Pais } from '../../models/interface/pais.interface';
import { environment } from '../../../environments/environment';

describe('PaisesService - imágenes guardadas en la app', () => {
  let service: PaisesService;
  let http: HttpTestingController;

  const pais = (imagenes: (string | undefined)[]): Pais => ({
    id: 'ma', nombre: 'Marruecos', visible: true,
    ciudades: [{ nombre: 'Fez', atracciones: imagenes.map((imagen, i) => ({ nombre: `A${i}`, imagen })) }]
  });
  const indice = {
    'ma|Fez|A0': { imagen: 'assets/img/atracciones/ma/a0.webp', archivoCommons: 'Foto A0.jpg', urlOriginal: 'url_imagen_a0.jpg' },
    'ma|Fez|A1': { imagen: 'assets/img/atracciones/ma/a1.webp', archivoCommons: 'Foto A1.jpg', urlOriginal: 'https://viejo.example/a1.jpg' },
    'ma|Fez|A2': { imagen: 'assets/img/atracciones/ma/a2.webp', archivoCommons: null, urlOriginal: 'https://viejo.example/a2.jpg' }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PaisesService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function cargar(imagenes: (string | undefined)[], indiceRespuesta: object | null = indice) {
    let resultado: Pais[] = [];
    service.getPaises().subscribe(p => (resultado = p));
    http.expectOne(`${environment.apiBaseUrl}/paises`).flush([pais(imagenes)]);
    const pedidoIndice = http.expectOne('assets/img/atracciones/indice.json');
    if (indiceRespuesta) pedidoIndice.flush(indiceRespuesta);
    else pedidoIndice.flush('no', { status: 404, statusText: 'Not Found' });
    return resultado[0].ciudades![0].atracciones!;
  }

  it('usa la foto local cuando la base tiene un texto de relleno o el link con el que se descargó', () => {
    const [a0, a1] = cargar(['url_imagen_a0.jpg', 'https://viejo.example/a1.jpg']);
    expect(a0.imagen).toBe('assets/img/atracciones/ma/a0.webp');
    expect(a0.fuenteImagen).toBe('https://commons.wikimedia.org/wiki/File:Foto%20A0.jpg');
    expect(a1.imagen).toBe('assets/img/atracciones/ma/a1.webp');
  });

  it('si un admin cambió la imagen en la base, gana la de la base', () => {
    const [, , a2] = cargar(['url_imagen_a0.jpg', undefined, 'https://nuevo.example/a2.jpg']);
    expect(a2.imagen).toBe('https://nuevo.example/a2.jpg');
    expect(a2.fuenteImagen).toBeUndefined();
  });

  it('si el índice no carga, deja las imágenes de la API', () => {
    const [a0] = cargar(['https://api.example/a0.jpg'], null);
    expect(a0.imagen).toBe('https://api.example/a0.jpg');
  });
});
