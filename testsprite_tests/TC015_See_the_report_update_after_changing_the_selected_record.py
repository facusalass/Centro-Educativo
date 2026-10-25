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
        
        # -> Open the staff panel using the visible “Panel” link.
        # Panel link
        elem = page.get_by_role("link", name="Panel")
        await elem.click(timeout=10000)
        
        # -> Sign in with the provided administrator email and password using the visible login form.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@educar.com")
        
        # -> Sign in with the provided administrator email and password using the visible login form.
        # password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin123")
        
        # -> Sign in with the provided administrator email and password using the visible login form.
        # Ingresar button
        elem = page.get_by_role("button", name="Ingresar")
        await elem.click(timeout=10000)
        
        # -> Open the “Reportes” module from the administrative navigation.
        # Reportes button
        elem = page.get_by_role("button", name="Reportes")
        await elem.click(timeout=10000)
        
        # -> Inspect the available report types and identify one that requires choosing an individual student or teacher record.
        # [internal] get_dropdown_options: index=
        
        # -> Select “8. Ficha Integral por Alumno” and inspect the controls that appear for choosing a student.
        # 1. Alumnos por Curso / Grado 2. Alumnos por... dropdown
        elem = page.locator("xpath=/html/body/div/div/main/div[3]/div/section/div/div/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Inspect the student choices in the selector, then switch from Valentina Gomez to another student.
        # [internal] get_dropdown_options: index=
        
        # -> Select Pereyra, Tomas in the student selector and verify the personalized report updates to that student.
        # Gomez , Valentina ( Secundario - 1ro ) Pereyra... dropdown
        elem = page.locator("xpath=/html/body/div/div/main/div[3]/div/section/div/div/select[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # --> Assertions to verify final state
        
        # --> The report now shows the selected student, Pereyra, Tomas.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The report should show the selected student, Pereyra, Tomas.
        await expect(page.locator("#root").nth(0)).to_contain_text("Datos del Alumno: Pereyra , Tomas", timeout=15000), "The report should show the selected student, Pereyra, Tomas."
        
        # --> Personalized academic data remains visible in the report.
        await page.get_by_role("row", name="Matematica Martes 09:00 - 11:").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Personalized academic data should remain visible in the report.
        await expect(page.get_by_role("row", name="Matematica Martes 09:00 - 11:").nth(0)).to_be_visible(timeout=15000), "Personalized academic data should remain visible in the report."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    