import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, role = 'admin') {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(`${role}@educar.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill(`${role}123`);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
}

test('los nueve reportes cargan y la vista de impresión genera un PDF real', async ({ page }) => {
  const uncaught: string[] = [];
  page.on('pageerror', (error) => uncaught.push(error.message));
  await login(page);
  await page.getByRole('button', { name: 'Reportes', exact: true }).click();
  const selector = page.getByLabel('Tipo de reporte');
  const types = await selector
    .locator('option')
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLOptionElement).value));
  expect(types).toHaveLength(9);
  for (const type of types) {
    await selector.selectOption(type);
    await expect(page.locator('.admin-status')).toHaveText('Reporte actualizado.');
    await expect(page.locator('#printable-report')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();
    await expect(page.getByRole('alert')).toHaveCount(0);
  }
  await page.getByRole('button', { name: 'Imprimir / PDF' }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.report-preview-toolbar')).toBeHidden();
  expect(
    await page.locator('#printable-report').evaluate((node) => getComputedStyle(node).visibility),
  ).toBe('visible');
  const pdf = await page.pdf({ path: 'outputs/reporte-verificado.pdf', format: 'A4' });
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(1000);
  expect(uncaught).toEqual([]);
});

test('el CSV neutraliza fórmulas de planilla en datos ingresados por usuarios', async ({
  page,
}) => {
  await page.route('**/api/reportes/alumnos-por-curso', async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    const row = data.find((group: { alumnos: unknown[] }) => group.alumnos.length > 0).alumnos[0];
    row.apellido = '=2+2';
    row.nombre = 'Formula';
    await route.fulfill({ json: data });
  });
  await login(page);
  await page.getByRole('button', { name: 'Reportes', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  const path = await (await download).path();
  const csv = await readFile(path!, 'utf8');
  expect(csv).toContain('"\'=2+2, Formula"');
});

test('una sesión revocada retira el panel privado al consultar de nuevo', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('heading', { name: 'Gestión institucional' })).toBeVisible();
  const logout = await page.request.post('/api/auth/logout');
  expect(logout.status()).toBe(200);
  await page.getByRole('button', { name: 'Reportes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.locator('#printable-report')).toHaveCount(0);
});

test('la vista previa conserva el foco y lo devuelve al cerrar', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Reportes', exact: true }).click();
  const opener = page.getByRole('button', { name: 'Imprimir / PDF' });
  await opener.click();
  const dialog = page.getByRole('dialog');
  const print = dialog.getByRole('button', { name: 'Imprimir', exact: true });
  const close = dialog.getByRole('button', { name: 'Cerrar', exact: true });
  await expect(print).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(print).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});

for (const role of ['alumno', 'docente', 'padre']) {
  test(`el portal de ${role} funciona en móvil sin desbordar`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, role);
    await expect(page.getByRole('button', { name: 'Mi cuenta', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Mi cuenta', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Cambiar contraseña' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  });
}
