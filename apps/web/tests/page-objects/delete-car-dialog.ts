import type { Page, Locator } from '@playwright/test';

export class DeleteCarDialog {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Locators
  get dialog(): Locator {
    return this.page.getByTestId('delete-car-dialog');
  }

  get confirmationInput(): Locator {
    return this.page.getByTestId('delete-car-confirmation-input');
  }

  get confirmButton(): Locator {
    return this.page.getByTestId('delete-car-confirm-button');
  }

  get cancelButton(): Locator {
    return this.page.getByTestId('delete-car-cancel-button');
  }

  // Actions
  async confirmDeletion(carName: string): Promise<void> {
    await this.confirmationInput.fill(carName);
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  // Validation
  async isVisible(): Promise<boolean> {
    return await this.dialog.isVisible();
  }
}
