import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, role: 'alumno' | 'docente') {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(`${role}@educar.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill(`${role}123`);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
}

test('el alumno consulta su legajo en modo lectura y puede recuperar una consulta fallida', async ({
  page,
}) => {
  const url = '**/api/reportes/alumno/1';
  await page.route(url, (route) =>
    route.fulfill({ status: 503, json: { error: 'Ficha temporalmente no disponible' } }),
  );
  await login(page, 'alumno');
  await expect(page.getByRole('heading', { name: 'Portal estudiantil' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('Ficha temporalmente no disponible');
  await page.unroute(url);
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Mi Legajo Académico/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Materias y Docentes Asignados' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Actividades Deportivas Inscriptas' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar inscripción' })).toHaveCount(0);
  const blocked = await page.request.get('/api/reportes/alumno/2');
  expect(blocked.status()).toBe(403);
});

test('el portal del alumno contiene errores de renderizado y recupera la ficha', async ({
  page,
}) => {
  const url = '**/api/reportes/alumno/1';
  await page.route(url, (route) => route.fulfill({ json: { alumno: null } }));
  await login(page, 'alumno');
  await expect(page.getByRole('alert')).toContainText('Ocurrió un error al cargar el contenido');
  await expect(page.getByRole('heading', { name: 'Portal estudiantil' })).toBeVisible();
  await page.unroute(url);
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Mi Legajo Académico/ })).toBeVisible();
});

test('el docente recupera su panel y ve el miércoles aunque la base no use tilde', async ({
  page,
}) => {
  const url = '**/api/reportes/docente/1';
  await page.route(url, (route) =>
    route.fulfill({ status: 503, json: { error: 'Horario no disponible' } }),
  );
  await login(page, 'docente');
  await expect(page.getByRole('alert')).toHaveText('Horario no disponible');
  await page.unroute(url);
  await page.route(url, async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.cursos = [{ ...data.cursos[0], materia: 'Materia de prueba miércoles', dia: 'Miercoles' }];
    await route.fulfill({ json: data });
  });
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Grilla de Horario Semanal' })).toBeVisible();
  await expect(page.getByText('Materia de prueba miércoles', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Deportes a Cargo' }).click();
  await expect(
    page.getByRole('heading', { name: 'Comisiones y Grupos Deportivos a Cargo' }),
  ).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'DNI', exact: true }).first()).toBeVisible();
});
