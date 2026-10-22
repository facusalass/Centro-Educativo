import { test, expect, type Page } from '@playwright/test';
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
}
test('administración protegida, edición persistente y reportes tabulares', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await login(page, 'admin@educar.com', 'admin123');
  await expect(page.getByRole('heading', { name: 'Gestión institucional' })).toBeVisible();
  await page.getByRole('button', { name: 'Materias', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo registro' }).click();
  await page.getByLabel('Nombre *', { exact: true }).fill('Robótica de prueba');
  await page.getByLabel('Descripción', { exact: true }).fill('Taller de ciencias y tecnología');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('cell', { name: 'Robótica de prueba', exact: true })).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: 'Robótica de prueba' });
  await row.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Nombre *', { exact: true }).fill('Robótica actualizada');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Materias', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Robótica actualizada', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reportes', exact: true }).click();
  await expect(page.locator('.report-table').first()).toBeVisible();
  await page.screenshot({ path: 'outputs/admin-reportes.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('familia registra cuenta, matricula e inscribe comedor sin duplicados', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/login');
  await page.getByRole('button', { name: 'Soy una familia nueva: crear cuenta' }).click();
  await page.getByLabel('Nombre del padre, madre o tutor').fill('Familia Navegador');
  await page.getByLabel('Email', { exact: true }).fill('navegador@test.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Navegador-Seguro-2027');
  await page.getByLabel('Nombre del hijo', { exact: true }).fill('Lucía');
  await page.getByLabel('Apellido del hijo', { exact: true }).fill('Prueba');
  await page.getByLabel('DNI del hijo').fill('58888999');
  await page.getByLabel('Curso solicitado').selectOption('2');
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Portal de familias' })).toBeVisible();
  const services = page;
  await services.getByRole('combobox', { name: 'Servicio', exact: true }).selectOption('comedor');
  await services.getByRole('button', { name: 'Confirmar inscripción' }).click();
  await expect(page.getByText('Inscripción confirmada.', { exact: true })).toBeVisible();
  await services.getByRole('button', { name: 'Confirmar inscripción' }).click();
  await expect(page.getByRole('alert')).toContainText('ya tiene este servicio');
  const matricula = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Matrícula lectiva' }) });
  await matricula.getByRole('combobox', { name: 'Curso', exact: true }).selectOption('2');
  await matricula.getByRole('button', { name: 'Confirmar matrícula' }).click();
  await expect(page.getByText('Matrícula confirmada.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Novedades', exact: true }).click();
  await expect(page.getByText('Matrícula confirmada', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'outputs/familia-novedades.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('docente crea evaluación y publica devolución; la familia la consulta', async ({ page }) => {
  await login(page, 'docente@educar.com', 'docente123');
  await expect(page.getByRole('heading', { name: 'Portal docente' })).toBeVisible();
  await expect(page.getByText('Grilla de Horario Semanal', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Evaluaciones', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Crear evaluación' }).click();
  await page.getByRole('combobox', { name: 'Asignación', exact: true }).selectOption('1');
  await page.getByLabel('Título', { exact: true }).fill('Exploramos el ambiente');
  await page.getByLabel('Fecha', { exact: true }).fill('2027-04-10');
  await page.getByRole('button', { name: 'Crear evaluación', exact: true }).click();
  await expect(page.getByText('Evaluación creada.', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Evaluación', exact: true }).selectOption({ index: 1 });
  await page.getByRole('combobox', { name: 'Alumno', exact: true }).selectOption('1');
  await page.getByLabel('Calificación (1 a 10)', { exact: true }).fill('9');
  await page.getByLabel('Devolución', { exact: true }).fill('Excelente observación y explicación.');
  await page.getByRole('button', { name: 'Publicar y notificar' }).click();
  await expect(
    page.getByText('Calificación y devolución publicadas.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await login(page, 'padre@educar.com', 'padre123');
  await page.getByRole('button', { name: 'Evaluaciones', exact: true }).click();
  await page.getByRole('combobox', { name: 'Evaluación', exact: true }).selectOption({ index: 1 });
  await expect(
    page.getByText('Excelente observación y explicación.', { exact: true }).first(),
  ).toBeVisible();
});
test('vista móvil conserva navegación y no desborda horizontalmente', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'admin@educar.com', 'admin123');
  await expect(page.getByRole('heading', { name: 'Gestión institucional' })).toBeVisible();
  await page.getByRole('button', { name: 'Usuarios y permisos', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Usuarios y permisos', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  await page.screenshot({ path: 'outputs/admin-movil.png', fullPage: true });
});
test('docente guarda asistencia y la recupera después de cambiar de sección', async ({ page }) => {
  await login(page, 'docente@educar.com', 'docente123');
  await page.getByRole('button', { name: 'Asistencias', exact: true }).click();
  await page.getByRole('button', { name: 'Cargar lista', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Presente' }).first().check();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Asistencia guardada.');
  await page.getByRole('button', { name: 'Mi actividad', exact: true }).click();
  await page.getByRole('button', { name: 'Asistencias', exact: true }).click();
  await page.getByRole('button', { name: 'Cargar lista', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Presente' }).first()).toBeChecked();
});
test('sitio institucional abre noticias y envía contacto real', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Noticias y Novedades' })).toBeVisible();
  await page.getByRole('button', { name: 'Leer más' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar noticia' }).click();
  const contact = page.locator('#contacto');
  await contact.getByLabel('Nombre', { exact: true }).fill('Consulta navegador');
  await contact.getByLabel('Email', { exact: true }).fill('consulta@test.com');
  await contact
    .getByLabel('Mensaje', { exact: true })
    .fill('Necesito información sobre la jornada extendida.');
  await contact.getByRole('button', { name: /Enviar/ }).click();
  await expect(contact.locator('.form-status')).toContainText(/recib|enviad|gracias/i);
});
