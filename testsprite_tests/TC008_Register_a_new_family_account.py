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
        
        # -> Open the “Solicitud de Inscripcion” page and inspect its form.
        # Solicitud de Inscripcion link
        elem = page.get_by_role("link", name="Solicitud de Inscripcion")
        await elem.click(timeout=10000)
        
        # -> Fill the visible family registration fields with test details, including a message that meets the minimum length.
        # text field
        elem = page.get_by_role("textbox", name="Nombre del tutor")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Familia Torres")
        
        # -> Fill the visible family registration fields with test details, including a message that meets the minimum length.
        # text field
        elem = page.get_by_role("textbox", name="Nombre del aspirante")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Sof\u00eda Torres")
        
        # -> Fill the visible family registration fields with test details, including a message that meets the minimum length.
        # email field
        elem = page.locator("#inscripcion").get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("familia.torres@example.com")
        
        # -> Fill the visible family registration fields with test details, including a message that meets the minimum length.
        # tel field
        elem = page.locator("#inscripcion").get_by_role("textbox", name="Teléfono")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("123-456-7890")
        
        # -> Fill the visible family registration fields with test details, including a message that meets the minimum length.
        # text area
        elem = page.get_by_label("MensajeSolicitamos informació")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Solicitamos informaci\u00f3n sobre la inscripci\u00f3n de Sof\u00eda para el ciclo lectivo 2027.")
        
        # -> Submit the family registration using “Enviar solicitud” and verify the resulting confirmation message.
        # Enviar solicitud button
        elem = page.get_by_role("button", name="Enviar solicitud")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The family registration submission shows a receipt confirmation.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The page shows the family registration receipt confirmation.
        await expect(page.locator("#root").nth(0)).to_contain_text("Solicitud recibida. El estado inicial del tr\u00e1mite es", timeout=15000), "The page shows the family registration receipt confirmation."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    