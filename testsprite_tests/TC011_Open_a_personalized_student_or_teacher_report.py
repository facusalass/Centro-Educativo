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
        
        # -> Open the staff panel using the “Panel” link in the site navigation.
        # Panel link
        elem = page.get_by_role("link", name="Panel")
        await elem.click(timeout=10000)
        
        # -> Enter the provided staff email and password in the sign-in form, then select “Ingresar.”
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@educar.com")
        
        # -> Enter the provided staff email and password in the sign-in form, then select “Ingresar.”
        # password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin123")
        
        # -> Enter the provided staff email and password in the sign-in form, then select “Ingresar.”
        # Ingresar button
        elem = page.get_by_role("button", name="Ingresar")
        await elem.click(timeout=10000)
        
        # -> Open the administrative reports viewer using the “Reportes” module.
        # Reportes button
        elem = page.get_by_role("button", name="Reportes")
        await elem.click(timeout=10000)
        
        # -> Review the report-type choices and select a report that requires a particular student or teacher.
        # [internal] get_dropdown_options: index=
        
        # -> Select “8. Ficha Integral por Alumno” and inspect the report viewer for its student-selection controls.
        # 1. Alumnos por Curso / Grado 2. Alumnos por... dropdown
        elem = page.locator("xpath=/html/body/div/div/main/div[3]/div/section/div/div/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Inspect the available student records in the student selector for the personalized report.
        # [internal] get_dropdown_options: index=
        
        # -> Choose “Pereyra, Tomas (Primario - 4to)” from the student selector to load and verify a different personalized report.
        # Gomez , Valentina ( Secundario - 1ro ) Pereyra... dropdown
        elem = page.locator("xpath=/html/body/div/div/main/div[3]/div/section/div/div/select[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # --> Assertions to verify final state
        
        # --> The personalized student report displays academic data.
        await page.get_by_role("row", name="Matematica Martes 09:00 - 11:").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The personalized report displays academic information.
        await expect(page.get_by_role("row", name="Matematica Martes 09:00 - 11:").nth(0)).to_be_visible(timeout=15000), "The personalized report displays academic information."
        
        # --> The report reflects the selected student, Pereyra, Tomas.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The report identifies the selected student as Pereyra, Tomas.
        await expect(page.locator("#root").nth(0)).to_contain_text("Pereyra , Tomas", timeout=15000), "The report identifies the selected student as Pereyra, Tomas."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    