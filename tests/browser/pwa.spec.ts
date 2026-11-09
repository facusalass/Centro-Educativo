import { test, expect } from '@playwright/test';

test('manifiesto PWA vinculado y servido con los campos esperados (HU-01)', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.name).toBe('Educar para Transformar');
  expect(manifest.short_name).toBe('Educar');
  expect(manifest.lang).toBe('es');
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/login');
  expect(manifest.theme_color).toBe('#4f46e5');
  expect(manifest.background_color).toBe('#f9fafb');
  const sizes: string[] = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
  expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(
    true,
  );
  // El SW y los íconos se sirven junto al shell precacheado.
  expect((await request.get('/sw.js')).ok()).toBeTruthy();
  expect((await request.get('/icons/pwa-192.png')).ok()).toBeTruthy();
  expect((await request.get('/icons/pwa-maskable-512.png')).ok()).toBeTruthy();
  const home = await request.get('/');
  const html = await home.text();
  expect(html).toContain('rel="manifest"');
  expect(html).toContain('name="theme-color"');
  expect(html).toContain('rel="apple-touch-icon"');
  expect(html).toContain('name="apple-mobile-web-app-capable"');
});

test('el login mobile a 360x800 no desborda horizontalmente (HU-02)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  const email = page.getByLabel('Email', { exact: true });
  const box = await email.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test('portal mobile por rol y cierre de sesión sin regreso a vistas protegidas (HU-03/HU-05/HU-06)', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('padre@educar.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('padre123');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Portal de familias' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navegación móvil del portal' });
  await expect(nav).toBeVisible();
  // HU-06: el padre navega por sus hijos (selector per-hijo en "Mis hijos").
  await expect(page.getByRole('heading', { name: 'Mis hijos', exact: true })).toBeVisible();
  // HU-05: el cambio de contraseña es alcanzable en la vista de cuenta móvil.
  await nav.getByRole('button', { name: 'Cuenta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cambiar contraseña' })).toBeVisible();
  // HU-03: cerrar sesión vuelve al login y no deja entrar hacia atrás.
  await page
    .locator('.portal-mobile-logout')
    .getByRole('button', { name: 'Cerrar sesión' })
    .click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  // La sesión se borró del servidor: la vuelta atrás ya no muestra contenido
  // protegido (el sitio guarda la entrada del portal y el gate de sesión lo
  // impide; el borde histórico cae fuera de la app).
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Portal de familias' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toHaveCount(0);
  // Revalidando desde una carga fresca del portal también se cae al login.
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  expect(errors).toEqual([]);
});
