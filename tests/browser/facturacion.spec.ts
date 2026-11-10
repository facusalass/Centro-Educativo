import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  test,
  expect,
  request,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from '@playwright/test';

// T06 / C-01: barrido E2E de los flujos de la PWA en un navegador real.
// El limitador de login permite 30 intentos por IP y proceso (server/core/security.ts),
// así que acá se inicia sesión UNA sola vez por rol y se reutiliza el storageState
// guardado en un directorio temporal fuera del repositorio.
const BASE = 'http://127.0.0.1:3101';
const TARIFAS: [string, number][] = [
  ['base', 50000],
  ['deporte', 5000],
  ['comedor', 12000],
  ['transporte', 9000],
];
// PNG de 1x1 px: el comprobante mínimo válido que viaja como base64 al servidor.
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
);
const ARCHIVO_PAGADA = 'comprobante-pagada.png';
const ARCHIVO_PENDIENTE = 'comprobante-pendiente.png';

type Rol = 'admin' | 'padre' | 'alumno';
type ItemFactura = { id: number; descripcion: string; monto: number; monto_pagado: number };
type FacturaDetalle = {
  id: number;
  numero_factura: string;
  periodo: string;
  total: number;
  saldo_pendiente: number;
  items: ItemFactura[];
  recibos: { id: number; numero_recibo: string; monto_total: number }[];
};

// Los períodos se derivan del reloj para que el vencimiento (día 10 del mes
// siguiente) quede siempre en el futuro y el estado sea 'pendiente'.
function periodoDesdeHoy(meses: number) {
  const hoy = new Date();
  return new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + meses, 1))
    .toISOString()
    .slice(0, 7);
}
const PERIODO_PAGADA = periodoDesdeHoy(1);
const PERIODO_PENDIENTE = periodoDesdeHoy(2);
const fechaDeHoy = () => new Date().toISOString().slice(0, 10);
const enDias = (dias: number) =>
  new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const contexts: Partial<Record<Rol, BrowserContext>> = {};
let directorio = '';
let alumnoId = 0;
let comprobanteAprobadoId = 0;
let facturaPagada: FacturaDetalle;
let facturaPendiente: FacturaDetalle;

async function abrir(rol: Rol) {
  const page = await contexts[rol]!.newPage();
  await page.goto('/login');
  return page;
}

function navPortal(page: Page) {
  return page.getByRole('navigation', { name: 'Secciones del portal' });
}

async function abrirCuotas(page: Page) {
  await navPortal(page).getByRole('button', { name: 'Cuotas', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Facturas \(/ })).toBeVisible();
}

// La tarjeta de cada factura se identifica por su número y período: buscar solo
// por período también matchearía el vencimiento de otra tarjeta.
function articuloDe(page: Page, factura: FacturaDetalle) {
  return page
    .locator('article.notice')
    .filter({ hasText: `${factura.numero_factura} · ${factura.periodo}` });
}

async function subirComprobante(
  page: Page,
  factura: FacturaDetalle,
  archivo: string,
  seleccion: 'todos' | 'uno',
) {
  const tarjeta = articuloDe(page, factura);
  await expect(tarjeta).toHaveCount(1);
  await tarjeta.getByText('Informar un pago', { exact: true }).click();
  const casillas = tarjeta.getByRole('checkbox');
  await expect(casillas.first()).toBeVisible();
  const totalItems = await casillas.count();
  if (seleccion === 'todos') {
    for (let i = 0; i < totalItems; i += 1) await casillas.nth(i).check();
  } else {
    await casillas.first().check();
  }
  await tarjeta
    .locator('input[type="file"]')
    .setInputFiles({ name: archivo, mimeType: 'image/png', buffer: PNG_1PX });
  // El panel hace refetch y muestra mensaje, sin recargar la página.
  await tarjeta.getByRole('button', { name: 'Subir comprobante' }).click();
  await expect(page.getByText(/Comprobante enviado, quedó en revisión/)).toBeVisible();
}

test.describe.serial('facturación, comprobantes y reportes financieros (T06)', () => {
  test.beforeAll(async ({ browser }) => {
    directorio = await mkdtemp(join(tmpdir(), 'educar-e2e-'));
    const sesiones: Record<Rol, APIRequestContext> = {} as Record<Rol, APIRequestContext>;
    for (const [rol, email, password] of [
      ['admin', 'admin@educar.com', 'admin123'],
      ['padre', 'padre@educar.com', 'padre123'],
      ['alumno', 'alumno@educar.com', 'alumno123'],
    ] as [Rol, string, string][]) {
      const api = await request.newContext({ baseURL: BASE });
      const login = await api.post('/api/auth/login', { data: { email, password } });
      expect(login.status(), `login de ${rol}`).toBe(200);
      await api.storageState({ path: join(directorio, `${rol}.json`) });
      sesiones[rol] = api;
    }
    const hijos = await (await sesiones.padre.get('/api/padres/hijos')).json();
    expect(Array.isArray(hijos) && hijos.length > 0, 'el padre demo necesita un hijo').toBe(true);
    alumnoId = hijos[0].id;

    // Datos financieros mínimos: tarifas planas configuradas, transporte para el
    // hijo del padre demo (los aranceles diferenciados ya vienen del seed) y dos
    // períodos de facturación generados por la API (no hay botón en la UI).
    for (const [tipo, monto] of TARIFAS) {
      const tarifa = await sesiones.admin.post('/api/tarifas', { data: { tipo, monto } });
      expect(tarifa.status(), `tarifa ${tipo}`).toBe(201);
    }
    const inscripcion = await sesiones.admin.post('/api/inscripciones', {
      data: { alumno_id: alumnoId, tipo: 'transporte', recorrido_id: 1 },
    });
    expect(inscripcion.status(), 'inscripción de transporte').toBe(201);
    for (const periodo of [PERIODO_PAGADA, PERIODO_PENDIENTE]) {
      const generado = await sesiones.admin.post('/api/facturas/generar-periodo', {
        data: { periodo },
      });
      expect(generado.status(), `generar ${periodo}`).toBe(201);
      expect((await generado.json()).creadas, `facturas de ${periodo}`).toBeGreaterThan(0);
    }

    const listado = await (await sesiones.admin.get(`/api/facturas?alumno_id=${alumnoId}`)).json();
    const detalle = async (periodo: string): Promise<FacturaDetalle> => {
      const factura = listado.find((f: { periodo: string }) => f.periodo === periodo);
      expect(factura, `factura de ${periodo}`).toBeTruthy();
      const respuesta = await sesiones.admin.get(`/api/facturas/${factura.id}`);
      expect(respuesta.status()).toBe(200);
      return (await respuesta.json()) as FacturaDetalle;
    };
    facturaPagada = await detalle(PERIODO_PAGADA);
    facturaPendiente = await detalle(PERIODO_PENDIENTE);
    // Cursado lectivo + deporte + comedor + transporte.
    expect(facturaPagada.items.length).toBe(4);
    expect(facturaPagada.saldo_pendiente).toBe(facturaPagada.total);

    for (const [rol, path] of Object.entries({
      admin: join(directorio, 'admin.json'),
      padre: join(directorio, 'padre.json'),
      alumno: join(directorio, 'alumno.json'),
    }) as [Rol, string][]) {
      contexts[rol] = await browser.newContext({
        baseURL: BASE,
        storageState: path,
        viewport: { width: 1280, height: 900 },
      });
    }
    await Promise.all(Object.values(sesiones).map((api) => api.dispose()));
  });

  test.afterAll(async () => {
    await Promise.all(Object.values(contexts).map((contexto) => contexto?.close().catch(() => {})));
    if (directorio) await rm(directorio, { recursive: true, force: true });
  });

  test('la vista de recuperación envía el enlace real y restablece con token válido', async ({
    page,
  }) => {
    const enviar = async (email: string) => {
      const respuesta = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === '/api/auth/forgot-password' &&
          r.request().method() === 'POST',
      );
      await page.getByLabel('Email', { exact: true }).fill(email);
      await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click();
      // Siempre 200: la respuesta no revela si el email está registrado.
      expect((await respuesta).status()).toBe(200);
      await expect(page.getByRole('status')).toContainText('Revisá tu casilla.');
    };

    await page.goto('/login');
    await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
    await expect(page.getByRole('heading', { name: 'Recuperar contraseña' })).toBeVisible();
    await enviar('padre@educar.com');
    // Recarga limpia: la vista conserva el estado de éxito hasta remontarse.
    await page.goto('/login');
    await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
    await expect(page.getByRole('heading', { name: 'Recuperar contraseña' })).toBeVisible();
    await enviar('no-existe@educar.com');

    // El token vive en el SQLite temporal del servidor: el enlace real con un
    // token desconocido se rechaza y el camino feliz se ejerce con un mock.
    await page.goto('/login?token=token-invalido-de-prueba');
    await expect(page.getByRole('heading', { name: 'Nueva contraseña' })).toBeVisible();
    await page.getByLabel('Nueva contraseña').fill('Navegador-Seguro-2027');
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'El enlace de recuperación no es válido o ya expiró. Pedí uno nuevo.',
    );
    await page.route('**/api/auth/reset-password', (route) =>
      route.fulfill({ status: 200, json: { ok: true } }),
    );
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
    await expect(page.getByRole('status')).toHaveText(
      'Actualizamos tu contraseña. Ya podés iniciar sesión con la nueva.',
    );
    await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
  });

  test('el padre ve cuotas, filtra por estado y fechas, consulta la deuda itemizada y descarga el PDF', async () => {
    const page = await abrir('padre');
    try {
      await expect(page.getByRole('heading', { name: 'Portal de familias' })).toBeVisible();
      await abrirCuotas(page);
      await expect(page.getByRole('heading', { name: 'Facturas (2)' })).toBeVisible();
      // El hijo del padre demo queda seleccionado automáticamente.
      await expect(page.getByRole('combobox', { name: 'Hijo', exact: true })).not.toHaveValue('');

      const estado = page.getByRole('combobox', { name: 'Estado', exact: true });
      await estado.selectOption('pendiente');
      await expect(page.getByRole('heading', { name: 'Facturas (2)' })).toBeVisible();
      await estado.selectOption('pagada');
      await expect(page.getByText('No hay facturas para este filtro.')).toBeVisible();
      await estado.selectOption('');
      await expect(page.getByRole('heading', { name: 'Facturas (2)' })).toBeVisible();

      // Rango de fechas: la emisión de hoy y un vencimiento futuro entran en el rango.
      await page.getByLabel('Desde', { exact: true }).fill(fechaDeHoy());
      await page.getByLabel('Hasta', { exact: true }).fill(enDias(120));
      await expect(page.getByRole('heading', { name: 'Facturas (2)' })).toBeVisible();

      // Deuda itemizada: una línea por concepto en cada factura del período.
      await page.getByText('Ver desglose de deuda', { exact: true }).click();
      await expect(page.getByText(/^Deuda itemizada:/)).toHaveCount(1);
      const conceptos = ['Cursado lectivo', 'Deporte: ', 'Comedor', 'Transporte'];
      for (const concepto of conceptos) {
        await expect(
          page.getByRole('listitem').filter({ hasText: concepto }),
          `concepto ${concepto}`,
        ).toHaveCount(2);
      }

      const factura = articuloDe(page, facturaPagada);
      await expect(factura).toHaveCount(1);
      const respuestaPdf = page.waitForResponse(
        (r) => new URL(r.url()).pathname === `/api/facturas/${facturaPagada.id}/pdf`,
      );
      const descarga = page.waitForEvent('download');
      await factura.getByRole('button', { name: 'PDF factura' }).click();
      const [respuesta, archivo] = await Promise.all([respuestaPdf, descarga]);
      expect(respuesta.status()).toBe(200);
      expect(respuesta.headers()['content-type']).toContain('application/pdf');
      expect(archivo.suggestedFilename()).toBe(`${facturaPagada.numero_factura}.pdf`);
      expect(await archivo.failure()).toBeNull();
      // El documento servido es un PDF real (no un HTML de error descargado).
      const documento = await page.request.get(`/api/facturas/${facturaPagada.id}/pdf`);
      expect(documento.status()).toBe(200);
      expect(
        Buffer.from(await documento.body())
          .subarray(0, 5)
          .toString(),
      ).toBe('%PDF-');
    } finally {
      await page.close();
    }
  });

  test('el padre sube los comprobantes de transferencia con el archivo real', async () => {
    const page = await abrir('padre');
    try {
      await abrirCuotas(page);
      // Comprobante por la totalidad de la primera factura.
      await subirComprobante(page, facturaPagada, ARCHIVO_PAGADA, 'todos');
      await abrirCuotas(page);
      await expect(page.getByText(/Comprobantes: 1/)).toBeVisible();
      await expect(articuloDe(page, facturaPagada)).toContainText('En revisión');
      // Segundo comprobante parcial sobre otro período (multi-comprobante).
      await subirComprobante(page, facturaPendiente, ARCHIVO_PENDIENTE, 'uno');
      await abrirCuotas(page);
      await expect(page.getByText(/Comprobantes: 2/)).toBeVisible();
    } finally {
      await page.close();
    }
  });

  test('administración sirve el archivo, exige motivo de rechazo y aprueba generando el recibo', async () => {
    const page = await abrir('admin');
    try {
      await page.goto('/admin');
      await expect(page.getByRole('heading', { name: 'Gestión institucional' })).toBeVisible();
      await page.getByRole('button', { name: 'Validación de pagos', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Validación de comprobantes' })).toBeVisible();

      const filaAprobada = page.locator('article.notice').filter({ hasText: ARCHIVO_PAGADA });
      const filaPendiente = page.locator('article.notice').filter({ hasText: ARCHIVO_PENDIENTE });
      await expect(filaAprobada).toHaveCount(1);
      await expect(filaPendiente).toHaveCount(1);

      // "Ver archivo" sirve exactamente el PNG que subió el padre.
      const enlace = filaAprobada.getByRole('link', { name: 'Ver archivo' });
      const href = await enlace.getAttribute('href');
      expect(href).toBeTruthy();
      comprobanteAprobadoId = Number(String(href).split('/').at(-2));
      const archivo = await page.request.get(href!);
      expect(archivo.status()).toBe(200);
      expect(archivo.headers()['content-type']).toContain('image/png');
      expect(Buffer.from(await archivo.body()).equals(PNG_1PX)).toBe(true);

      // Rechazar sin motivo: la validación obligatoria lo impide y el comprobante
      // NO se consume (sigue en la cola de revisión).
      await filaPendiente.getByRole('button', { name: 'Rechazar' }).click();
      await expect(page.getByRole('alert')).toHaveText('El motivo de rechazo es obligatorio.');
      await expect(filaPendiente).toHaveCount(1);

      // Aprobar el comprobante completo lo saca de la cola de revisión.
      const estado = page.getByRole('combobox', { name: 'Estado', exact: true });
      await expect(filaAprobada).toHaveCount(1);
      await filaAprobada.getByRole('button', { name: 'Aprobar' }).click();
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.locator('article.notice').filter({ hasText: ARCHIVO_PAGADA })).toHaveCount(
        0,
      );
      await expect(
        page.locator('article.notice').filter({ hasText: ARCHIVO_PENDIENTE }),
      ).toHaveCount(1);
      await estado.selectOption('aprobado');
      await expect(page.locator('article.notice').filter({ hasText: ARCHIVO_PAGADA })).toHaveCount(
        1,
      );

      // La aprobación es ACID: saldo en cero y recibo emitido por el monto imputado.
      const detalle = (await (
        await page.request.get(`/api/facturas/${facturaPagada.id}`)
      ).json()) as FacturaDetalle;
      expect(detalle.estado).toBe('pagada');
      expect(Number(detalle.saldo_pendiente)).toBe(0);
      expect(detalle.recibos).toHaveLength(1);
      expect(Number(detalle.recibos[0].monto_total)).toBe(facturaPagada.total);

      await estado.selectOption('en_revision');
      const porRechazar = page.locator('article.notice').filter({ hasText: ARCHIVO_PENDIENTE });
      await porRechazar.getByPlaceholder('Motivo de rechazo').fill('El importe no es legible.');
      await porRechazar.getByRole('button', { name: 'Rechazar' }).click();
      await expect(porRechazar).toHaveCount(0);
      await estado.selectOption('rechazado');
      await expect(porRechazar).toContainText('El importe no es legible.');
    } finally {
      await page.close();
    }
  });

  test('los cinco reportes financieros nuevos muestran los datos reales y exportan', async () => {
    const page = await abrir('admin');
    try {
      await page.goto('/admin');
      await page.getByRole('button', { name: 'Reportes', exact: true }).click();
      const selector = page.getByLabel('Tipo de reporte');
      const informe = page.locator('#printable-report');
      const exportar = page.getByRole('button', { name: 'Exportar CSV' });

      const casos: [string, string][] = [
        ['ingresos-periodo', 'recibos emitidos'],
        ['pagos-completos', facturaPagada.numero_factura],
        ['pagos-incompletos', facturaPendiente.numero_factura],
        ['pagos-por-deporte', 'Totales generales'],
        ['pagos-por-transporte', 'Pagos de transporte por recorrido'],
      ];
      for (const [tipo, texto] of casos) {
        await selector.selectOption(tipo);
        await expect(page.locator('.admin-status'), tipo).toHaveText('Reporte actualizado.');
        await expect(informe, tipo).toBeVisible();
        await expect(informe, tipo).toContainText(texto);
        await expect(exportar, tipo).toBeEnabled();
        await expect(page.getByRole('alert'), tipo).toHaveCount(0);
      }

      // 10. Ingresos por Período refleja el recibo aprobado en este barrido.
      await selector.selectOption('ingresos-periodo');
      await expect(page.locator('.admin-status')).toHaveText('Reporte actualizado.');
      const ingresos = await (await page.request.get('/api/reportes/ingresos-periodo')).json();
      expect(ingresos.cantidad).toBe(1);
      expect(Number(ingresos.total)).toBe(facturaPagada.total);
      const formateado = await page.evaluate(
        (valor) =>
          Number(valor).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        ingresos.total,
      );
      await expect(informe).toContainText(`$ ${formateado}`);

      // 11. Pagos Completos: la factura aprobada aparece como saldo cancelado.
      await selector.selectOption('pagos-completos');
      await expect(informe).toContainText('Facturas con saldo cancelado');
      await expect(informe).toContainText(facturaPagada.numero_factura);

      // La misma vista previa de impresión que la producción.
      const imprimir = page.getByRole('button', { name: 'Imprimir / PDF' });
      await imprimir.click();
      const dialogo = page.getByRole('dialog', { name: 'Vista previa del reporte' });
      await expect(dialogo).toBeVisible();
      await page.emulateMedia({ media: 'print' });
      const pdf = await page.pdf({ format: 'A4' });
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(pdf.length).toBeGreaterThan(1000);
      // En media print la barra de la vista previa se oculta: se vuelve a pantalla
      // para cerrar el diálogo con su botón real.
      await page.emulateMedia({ media: 'screen' });
      await dialogo.getByRole('button', { name: 'Cerrar' }).click();
      await expect(dialogo).toBeHidden();
    } finally {
      await page.close();
    }
  });

  test('la UI móvil mantiene cuotas legibles y el pago desplegable en 360 y 390 px', async () => {
    const page = await abrir('padre');
    const errores: string[] = [];
    page.on('pageerror', (error) => errores.push(error.message));
    try {
      for (const width of [360, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto('/login?tab=cuotas');
        await expect(page.getByRole('heading', { name: 'Facturas (2)' })).toBeVisible();
        const nav = page.getByRole('navigation', { name: 'Navegación móvil del portal' });
        await expect(nav).toBeVisible();
        await expect(page.getByRole('navigation', { name: 'Secciones del portal' })).toBeHidden();
        await expect(page.getByRole('region', { name: 'Estado de cuenta' })).toBeVisible();
        const tarjeta = articuloDe(page, facturaPendiente);
        await expect(tarjeta.getByRole('checkbox')).toHaveCount(0);
        await tarjeta.getByText('Informar un pago', { exact: true }).click();
        await expect(tarjeta.getByRole('checkbox').first()).toBeVisible();
        await tarjeta.getByRole('button', { name: 'Subir comprobante' }).click();
        await expect(tarjeta.getByRole('alert')).toHaveText('Seleccioná al menos un concepto.');
        await tarjeta.getByRole('checkbox').first().check();
        await tarjeta.getByLabel('Archivo del comprobante').setInputFiles({
          name: 'demasiado-grande.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.alloc(3 * 1024 * 1024 + 1),
        });
        await expect(tarjeta.getByRole('alert')).toContainText('El archivo supera los 3 MB');
        await page.screenshot({ path: `outputs/pago-movil-${width}.png`, fullPage: true });
        await tarjeta.getByText('Informar un pago', { exact: true }).click();
        await expect(tarjeta.getByRole('checkbox')).toHaveCount(0);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true);
        await page.screenshot({ path: `outputs/cuotas-movil-${width}.png`, fullPage: true });
        for (const nombre of ['Inicio', 'Evaluaciones', 'Novedades', 'Cuenta']) {
          await nav.getByRole('button', { name: nombre, exact: true }).click();
          await expect(page.locator('.panel-card').first()).toBeVisible();
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            nombre,
          ).toBe(true);
          await page.screenshot({ path: `outputs/portal-${nombre}-${width}.png`, fullPage: true });
        }
      }
      expect(errores).toEqual([]);
    } finally {
      await page.close();
    }
  });

  test('administración permite revisar comprobantes y reportes en móvil sin desbordar', async () => {
    const page = await abrir('admin');
    try {
      await page.setViewportSize({ width: 360, height: 844 });
      await page.goto('/admin');
      await page.getByRole('button', { name: 'Validación de pagos', exact: true }).click();
      await page.getByRole('combobox', { name: 'Estado', exact: true }).selectOption('rechazado');
      await expect(page.locator('article.notice').first()).toContainText(
        'El importe no es legible.',
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      await page.screenshot({ path: 'outputs/validacion-movil-360.png', fullPage: true });
      await page.getByRole('button', { name: 'Reportes', exact: true }).click();
      await expect(page.getByLabel('Tipo de reporte')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      await page.screenshot({ path: 'outputs/reportes-movil-360.png', fullPage: true });
    } finally {
      await page.close();
    }
  });

  test('el RBAC bloquea las rutas financieras por rol en la UI y en la API', async () => {
    const alumno = await abrir('alumno');
    try {
      await expect(alumno.getByRole('heading', { name: 'Portal estudiantil' })).toBeVisible();
      // RF-01.5: el alumno no tiene pestaña de cuotas; el backend igual responde 403.
      await expect(
        navPortal(alumno).getByRole('button', { name: 'Cuotas', exact: true }),
      ).toHaveCount(0);
      expect((await alumno.request.get('/api/facturas')).status()).toBe(403);
      expect((await alumno.request.get(`/api/facturas/${facturaPagada.id}`)).status()).toBe(403);
      expect((await alumno.request.get(`/api/deuda/alumno/${alumnoId}`)).status()).toBe(403);
      expect(
        (await alumno.request.get(`/api/comprobantes/${comprobanteAprobadoId}/archivo`)).status(),
      ).toBe(403);
    } finally {
      await alumno.close();
    }

    const padre = await abrir('padre');
    try {
      await expect(padre.getByRole('heading', { name: 'Portal de familias' })).toBeVisible();
      expect((await padre.request.get('/api/admin/comprobantes')).status()).toBe(403);
      expect(
        (
          await padre.request.put('/api/admin/comprobantes/1/validar', {
            data: { accion: 'aprobar' },
          })
        ).status(),
      ).toBe(403);
      expect(
        (
          await padre.request.post('/api/facturas/generar-periodo', {
            data: { periodo: PERIODO_PAGADA },
          })
        ).status(),
      ).toBe(403);
      // Un padre nunca alcanza la deuda de un alumno ajeno.
      expect((await padre.request.get('/api/deuda/alumno/3')).status()).toBe(403);
    } finally {
      await padre.close();
    }
  });
});
