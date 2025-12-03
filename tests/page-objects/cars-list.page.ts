import { Page, Locator } from '@playwright/test';

export class CarsListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Locators
  get addCarButton(): Locator {
    return this.page.getByTestId('add-car-button');
  }

  get carsGrid(): Locator {
    return this.page.getByTestId('cars-grid');
  }

  carCard(carId: string): Locator {
    return this.page.getByTestId(`car-card-${carId}`);
  }

  // Actions
  async clickAddCar(): Promise<void> {
    await this.addCarButton.click();
  }

  async clickCarCard(carId: string): Promise<void> {
    await this.carCard(carId).click();
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  // Validation
  async isOnCarsListPage(): Promise<boolean> {
    return await this.addCarButton.isVisible();
  }

  async getCarCards(): Promise<number> {
    return await this.carsGrid.locator('[data-test-id^="car-card-"]').count();
  }

  async getCarStatistics(carId: string): Promise<string> {
    return (await this.carCard(carId).getByTestId('car-statistics-container').textContent()) || '';
  }
}
