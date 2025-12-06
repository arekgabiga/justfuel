import type { Page, Locator } from '@playwright/test';

export class CarDetailsPage {
  readonly page: Page;
  private readonly carId: string;

  constructor(page: Page, carId: string) {
    this.page = page;
    this.carId = carId;
  }

  // Locators
  get carHeader(): Locator {
    return this.page.getByTestId('car-header');
  }

  get editButton(): Locator {
    return this.page.getByTestId('car-edit-button');
  }

  get deleteButton(): Locator {
    return this.page.getByTestId('car-delete-button');
  }

  get backButton(): Locator {
    return this.page.getByTestId('back-to-cars-button');
  }

  get optionsMenuButton(): Locator {
    return this.page.getByTestId('car-options-menu-button');
  }

  // Actions
  async clickEdit(): Promise<void> {
    await this.optionsMenuButton.click();
    await this.editButton.click();
  }

  async clickDelete(): Promise<void> {
    await this.optionsMenuButton.click();
    await this.deleteButton.click();
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  async goto(): Promise<void> {
    await this.page.goto(`/cars/${this.carId}`);
  }

  // Validation
  async isOnCarDetailsPage(): Promise<boolean> {
    return await this.carHeader.isVisible();
  }
}
