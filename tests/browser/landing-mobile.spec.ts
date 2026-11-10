import { test, expect } from '@playwright/test';

for (const width of [320, 360, 390, 430, 768, 1280]) {
  test(`la landing cabe en ${width} px sin desplazamiento horizontal`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const comprobarAncho = async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width + 1,
      );
    };
    await comprobarAncho();
    if (width < 1080) {
      await page.getByRole('button', { name: 'Abrir menú' }).click();
      await expect(
        page.getByRole('navigation', { name: 'Navegación móvil', exact: true }),
      ).toBeVisible();
      await comprobarAncho();
      await page.getByRole('button', { name: 'Abrir menú' }).click();
    }
    for (const section of await page
      .locator('.app-shell main > section, .app-shell footer')
      .all()) {
      await section.scrollIntoViewIfNeeded();
      await comprobarAncho();
    }
    // El correo debe entrar completo, con salto de línea, no quedar recortado.
    const correo = page
      .locator('.contact-cards p')
      .filter({ hasText: 'contacto@educarparatransformar.edu.ar' });
    await expect(correo).toBeVisible();
    expect(await correo.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    for (const campo of await page.locator('.contact-form input, .contact-form textarea').all()) {
      expect(
        await campo.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= innerWidth + 1;
        }),
      ).toBe(true);
    }
    if (width === 360) {
      await page.locator('#contacto').screenshot({ path: 'outputs/landing-contacto-360.png' });
      await page.locator('.footer').screenshot({ path: 'outputs/landing-footer-360.png' });
    }
  });
}
