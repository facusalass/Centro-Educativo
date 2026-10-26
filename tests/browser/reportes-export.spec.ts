import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('admin@educar.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('admin123');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gestión institucional' })).toBeVisible();
}

async function openReports(page: Page) {
  await page.getByRole('button', { name: 'Reportes', exact: true }).click();
  await expect(page.locator('#printable-report table').first()).toBeVisible();
}

test('el reporte exporta un CSV descargable con BOM y separador punto y coma', async ({ page }) => {
  await loginAsAdmin(page);
  await openReports(page);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^reporte-alumnos-por-curso\.csv$/);
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();

  const contents = await readFile(downloadPath as string, 'utf8');
  // Excel needs the BOM to read the accents, and es-AR expects ';' as delimiter.
  expect(contents.charCodeAt(0)).toBe(0xfeff);
  const rows = contents.slice(1).split('\r\n');
  expect(rows[0]).toBe('"#";"Legajo";"Apellido y Nombre";"DNI";"Email";"Teléfono"');
  expect(rows.length).toBeGreaterThan(1);
});

test('el catálogo filtra por faceta y la combina con la búsqueda de texto', async ({ page }) => {
  await loginAsAdmin(page);
  await page.getByRole('button', { name: 'Grupos deportivos', exact: true }).click();

  const rows = page.locator('table.report-table tbody tr');
  const total = await rows.count();
  expect(total).toBe(5);

  const facet = page.getByLabel('Filtrar Grupos deportivos por Nivel');
  await expect(facet).toBeVisible();
  await facet.selectOption('Secundario');

  await expect(rows).toHaveCount(3);
  for (const text of await rows.allInnerTexts()) expect(text).toContain('Secundario');
  await expect(page.getByText('3 de 5 registros', { exact: true })).toBeVisible();

  // Combining with the text search narrows further instead of resetting.
  await page.getByLabel('Buscar en Grupos deportivos').fill('Miercoles');
  await expect(rows).toHaveCount(1);

  await facet.selectOption('');
  await page.getByLabel('Buscar en Grupos deportivos').fill('');
  await expect(rows).toHaveCount(total);
});

test('la vista previa se abre antes de imprimir y solo imprime al confirmar', async ({ page }) => {
  await page.addInitScript(() => {
    const scope = window as unknown as { __printCalls?: number };
    scope.__printCalls = 0;
    window.print = () => {
      scope.__printCalls = (scope.__printCalls ?? 0) + 1;
    };
  });
  const printCalls = () =>
    page.evaluate(() => (window as unknown as { __printCalls?: number }).__printCalls);

  await loginAsAdmin(page);
  await openReports(page);

  await page.getByRole('button', { name: 'Imprimir / PDF' }).click();
  const toolbar = page.locator('.report-preview-toolbar');
  await expect(toolbar).toContainText('Vista previa');
  await expect(toolbar).toContainText('Nómina de Alumnos por Curso y División');
  await expect(page.locator('#printable-report')).toContainText('CENTRO EDUCATIVO');
  // Opening the preview never blocks on a native dialog.
  expect(await printCalls()).toBe(0);

  await toolbar.getByRole('button', { name: 'Imprimir', exact: true }).click();
  expect(await printCalls()).toBe(1);

  await toolbar.getByRole('button', { name: 'Cerrar' }).click();
  await expect(toolbar).toBeHidden();
});
