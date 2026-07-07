import { test, expect } from "@playwright/test";

test.describe("Páginas públicas", () => {
  test("homepage carrega", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Nenos Food/i);
    await expect(page.getByRole("heading", { name: /categorias/i })).toBeVisible();
  });

  test("login renderiza formulário", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /bem-vindo/i })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
  });

  test("páginas legais", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /política de privacidade/i })).toBeVisible();

    await page.goto("/terms");
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
