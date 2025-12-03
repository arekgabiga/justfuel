import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Locators
  get emailInput(): Locator {
    return this.page.getByTestId('login-email-input');
  }

  get passwordInput(): Locator {
    return this.page.getByTestId('login-password-input');
  }

  get submitButton(): Locator {
    return this.page.getByTestId('login-submit-button');
  }

  // Actions
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    // Wait for successful login redirect
    await this.page.waitForURL('/');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login', { waitUntil: 'networkidle' });
  }

  // Validation
  async isOnLoginPage(): Promise<boolean> {
    return await this.submitButton.isVisible();
  }
}
