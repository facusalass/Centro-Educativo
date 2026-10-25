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
        
        # -> Sign in using the provided administrative email and password.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@educar.com")
        
        # -> Sign in using the provided administrative email and password.
        # password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin123")
        
        # -> Sign in using the provided administrative email and password.
        # Ingresar button
        elem = page.get_by_role("button", name="Ingresar")
        await elem.click(timeout=10000)
        
        # -> Open the “Reportes” module from the administration navigation.
        # Reportes button
        elem = page.get_by_role("button", name="Reportes")
        await elem.click(timeout=10000)
        
        # -> Inspect the available report types in the report selector so I can choose a different one.
        # [internal] get_dropdown_options: index=
        
        # -> Select “2. Alumnos por Deporte” in the report selector and verify the report viewer updates.
        # 1. Alumnos por Curso / Grado 2. Alumnos por... dropdown
        elem = page.locator("xpath=/html/body/div/div/main/div[3]/div/section/div/div/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # --> Assertions to verify final state
        
        # --> The active report shows the Alumnos por Deporte report after switching.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The active report should display the Alumnos por Deporte report.
        await expect(page.locator("#root").nth(0)).to_contain_text("N\u00f3mina de Alumnos por Deporte y Comisiones", timeout=15000), "The active report should display the Alumnos por Deporte report."
        
        # --> The reports viewer remains open after switching reports.
        await page.get_by_role("combobox").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The report selector should remain visible in the open viewer.
        await expect(page.get_by_role("combobox").nth(0)).to_be_visible(timeout=15000), "The report selector should remain visible in the open viewer."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    