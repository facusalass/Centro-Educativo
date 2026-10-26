import { test, expect, type Page } from '@playwright/test';

async function reports(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('admin@educar.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('admin123');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await page.getByRole('button', { name: 'Reportes', exact: true }).click();
}

test('una carga fallida termina, bloquea exportación y permite reintentar', async ({ page }) => {
  const url = '**/api/reportes/alumnos-por-curso';
  await page.route(url, (route) =>
    route.fulfill({ status: 503, json: { error: 'Reporte no disponible' } }),
  );
  await reports(page);
  await expect(page.getByRole('alert')).toHaveText('Reporte no disponible');
  await expect(page.locator('.report-loading-container')).toHaveCount(0);
  await expect(page.locator('#printable-report')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Actualizar Reporte' })).toBeEnabled();
  await page.unroute(url);
  await page.getByRole('button', { name: 'Actualizar Reporte' }).click();
  await expect(page.locator('#printable-report table').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();
});

for (const role of ['alumno', 'docente'] as const) {
  test(`fallar al cambiar de ${role} nunca conserva el informe anterior`, async ({ page }) => {
    await reports(page);
    await page.getByLabel('Tipo de reporte').selectOption(role);
    const selector = page.getByLabel(
      role === 'alumno' ? 'Alumno del reporte' : 'Docente del reporte',
    );
    await expect(page.locator('.admin-status')).toHaveText('Reporte actualizado.');
    const secondId = await selector.locator('option').nth(1).getAttribute('value');
    expect(secondId).toBeTruthy();
    const url = `**/api/reportes/${role}/${secondId}`;
    await page.route(url, (route) =>
      route.fulfill({ status: 500, json: { error: 'Fallo al consultar la ficha' } }),
    );
    await selector.selectOption(secondId!);
    await expect(page.getByRole('alert')).toHaveText('Fallo al consultar la ficha');
    await expect(page.locator('#printable-report')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Guardar / Descargar PDF' })).toHaveCount(0);
    await page.unroute(url);
    await page.getByRole('button', { name: 'Actualizar Reporte' }).click();
    await expect(page.locator('.admin-status')).toHaveText('Reporte actualizado.');
    await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();
  });
}

test('un error al renderizar queda contenido y reintentar recupera el panel', async ({ page }) => {
  const url = '**/api/reportes/alumnos-por-curso';
  const uncaught: string[] = [];
  page.on('pageerror', (error) => uncaught.push(error.message));
  await page.route(url, (route) => route.fulfill({ json: [null] }));
  await reports(page);
  await expect(page.getByRole('alert')).toContainText('Ocurrió un error al cargar el contenido');
  await expect(page.getByRole('heading', { name: 'Gestión institucional' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled();
  await page.unroute(url);
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.locator('#printable-report table').first()).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(uncaught).toEqual([]);
});

test('una respuesta tardía no reemplaza la ficha seleccionada después', async ({ page }) => {
  await reports(page);
  await page.getByLabel('Tipo de reporte').selectOption('alumno');
  const selector = page.getByLabel('Alumno del reporte');
  await expect(page.locator('.admin-status')).toHaveText('Reporte actualizado.');
  const options = await selector.locator('option').evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: (node as HTMLOptionElement).value,
      name: node.textContent!.split(' (')[0],
    })),
  );
  let release!: () => void;
  let received!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    received = resolve;
  });
  await page.route(`**/api/reportes/alumno/${options[1].id}`, async (route) => {
    const response = await route.fetch();
    received();
    await held;
    await route.fulfill({ response }).catch(() => {}); // The client may already have aborted.
  });
  try {
    await selector.selectOption(options[1].id);
    await started;
    await expect(page.locator('#printable-report')).toHaveCount(0);
    await selector.selectOption(options[0].id);
    await expect(page.locator('#printable-report')).toContainText(options[0].name);
    release();
    await page.unrouteAll({ behavior: 'wait' });
    await expect(page.locator('#printable-report')).not.toContainText(options[1].name);
  } finally {
    release();
  }
});

test('el reporte rechaza JSON de estructura incorrecta y permite cambiar de tipo', async ({
  page,
}) => {
  await page.route('**/api/reportes/alumnos-por-curso', (route) =>
    route.fulfill({ json: { unexpected: true } }),
  );
  await reports(page);
  await expect(page.getByRole('alert')).toContainText('formato inválido');
  await page.getByLabel('Tipo de reporte').selectOption('alumnos-por-deporte');
  await expect(page.locator('#printable-report')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('la vista previa se cierra con Escape y el filtrado sin coincidencias se explica', async ({
  page,
}) => {
  await reports(page);
  await page.getByRole('button', { name: 'Imprimir / PDF' }).click();
  await expect(page.getByRole('dialog', { name: 'Vista previa del reporte' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Tipo de reporte').selectOption('alumno');
  await expect(page.locator('#printable-report')).toBeVisible();
  await page.getByLabel('Buscar en el reporte').fill('sin-coincidencias-zzzz');
  await expect(
    page.getByText('No hay resultados para la búsqueda.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled();
});
