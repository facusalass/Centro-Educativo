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
        
        # -> Open the “Quiénes Somos” section from the landing-page navigation.
        # Quiénes Somos link
        elem = page.get_by_label("Navegación principal").get_by_role("link", name="Quiénes Somos")
        await elem.click(timeout=10000)
        
        # -> Open the “Niveles” section from the public landing-page navigation.
        # Niveles link
        elem = page.get_by_role("link", name="Niveles", exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the “Solicitud de Inscripcion” enrollment section from the landing page.
        # Solicitud de Inscripcion link
        elem = page.get_by_role("link", name="Solicitud de Inscripcion")
        await elem.click(timeout=10000)
        
        # -> Complete the required enrollment form fields with the specified inquiry details and the additional required applicant and telephone information.
        # text field
        elem = page.get_by_role("textbox", name="Nombre del tutor")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Ana P\u00e9rez")
        
        # -> Complete the required enrollment form fields with the specified inquiry details and the additional required applicant and telephone information.
        # text field
        elem = page.get_by_role("textbox", name="Nombre del aspirante")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Aspirante de prueba")
        
        # -> Complete the required enrollment form fields with the specified inquiry details and the additional required applicant and telephone information.
        # email field
        elem = page.locator("#inscripcion").get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("ana.perez@example.com")
        
        # -> Complete the required enrollment form fields with the specified inquiry details and the additional required applicant and telephone information.
        # tel field
        elem = page.locator("#inscripcion").get_by_role("textbox", name="Teléfono")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("123-456-7890")
        
        # -> Complete the required enrollment form fields with the specified inquiry details and the additional required applicant and telephone information.
        # text area
        elem = page.get_by_label("MensajeI would like")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("I would like information about enrollment for next term.")
        
        # -> Submit the completed enrollment inquiry using the “Enviar solicitud” button and check for a visible confirmation.
        # Enviar solicitud button
        elem = page.get_by_role("button", name="Enviar solicitud")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> A receipt confirmation is displayed for the submitted enrollment inquiry.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The enrollment inquiry receipt confirmation is displayed.
        await expect(page.locator("#root").nth(0)).to_contain_text("Solicitud recibida. El estado inicial del tr\u00e1mite es \"recibida\".", timeout=15000), "The enrollment inquiry receipt confirmation is displayed."
        
        # --> The guardian-name field is cleared after the inquiry is submitted.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The guardian-name field is cleared after submission.
        await expect(page.get_by_role("textbox", name="Nombre del tutor").nth(0)).to_have_value("", timeout=15000), "The guardian-name field is cleared after submission."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    