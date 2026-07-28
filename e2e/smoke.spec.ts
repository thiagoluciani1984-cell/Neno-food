import { test, expect, type Page } from "@playwright/test";

// Visitante não logado vê o popup de cadastro (roleta de desconto) assim
// que a página termina de hidratar — fecha antes de checar o conteúdo por
// trás, igual um usuário real faria. O popup aparece de forma assíncrona
// (depois da hidratação), então espera de verdade em vez de checar na hora.
async function dismissSignupPromoIfPresent(page: Page) {
  const dismissPromo = page.getByRole("button", { name: /continuar sem conta/i });
  await dismissPromo.waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
  if (await dismissPromo.isVisible().catch(() => false)) {
    await dismissPromo.click();
  }
}

test.describe("Páginas públicas", () => {
  test("homepage carrega", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Nenos Food/i);

    await dismissSignupPromoIfPresent(page);

    await expect(page.getByRole("heading", { name: /restaurantes populares/i })).toBeVisible();
  });

  test("login renderiza formulário", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /bem-vindo/i })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
  });

  test("páginas legais", async ({ page }) => {
    await page.goto("/privacy");
    await dismissSignupPromoIfPresent(page);
    await expect(page.getByRole("heading", { name: /política de privacidade/i })).toBeVisible();

    await page.goto("/terms");
    await dismissSignupPromoIfPresent(page);
    await expect(page.getByRole("heading", { name: /termos de uso/i })).toBeVisible();
  });

  test("recuperação de senha", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /recuperar senha/i })).toBeVisible();
  });
});

test.describe("Checkout", () => {
  test("carrinho vazio redireciona mensagem", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByText(/carrinho está vazio/i)).toBeVisible();
  });
});
