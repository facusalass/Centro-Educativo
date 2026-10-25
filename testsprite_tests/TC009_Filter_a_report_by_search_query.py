import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:5173/")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Open the staff panel using the visible “Panel” navigation link.
        # Panel link
        elem = page.get_by_role("link", name="Panel")
        await elem.click(timeout=10000)
        
        # -> Enter the provided staff email and password in the sign-in form, then submit using “Ingresar.”
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@educar.com")
        
        # -> Enter the provided staff email and password in the sign-in form, then submit using “Ingresar.”
        # password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin123")
        
        # -> Enter the provided staff email and password in the sign-in form, then submit using “Ingresar.”
        # Ingresar button
        elem = page.get_by_role("button", name="Ingresar")
        await elem.click(timeout=10000)
        
        # -> Open the administrative “Reportes” module to inspect the report type selector and filtering controls.
        # Reportes button
        elem = page.get_by_role("button", name="Reportes")
        await elem.click(timeout=10000)
        
        # -> Inspect the available report types in the “Reportes Institucionales” selector.
        # [internal] get_dropdown_options: index=
        
        # -> Switch the report to “2. Alumnos por Deporte” and inspect the updated report once it loads.
        # 1. Alumnos por Curso / Grado 2. Alumnos por... dropdown
        elem = page.locator("xpath=/html/body/div/div/main/div[3]/div/section/div/div/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Enter “Ramirez” in the report search field and verify that the displayed results are narrowed to matching records.
        # Buscar en el reporte text field
        elem = page.get_by_role("textbox", name="Buscar en el reporte")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Ramirez")
        
        # --> Assertions to verify final state
        
        # --> The “Ramirez” filter narrows the sports report to the matching student, Ramirez, Sofia.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The filtered report displays the matching student.
        await expect(page.locator("tbody").nth(0)).to_contain_text("Ramirez", timeout=15000), "The filtered report displays the matching student."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    