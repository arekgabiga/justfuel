import type { Page, Locator } from '@playwright/test';

export interface NewFillupFormData {
  date: string;
  fuelAmount: string;
  totalPrice: string;
  odometer?: string;
  distance?: string;
}

export class NewFillupPage {
  readonly page: Page;
  private readonly carId: string;

  constructor(page: Page, carId: string) {
    this.page = page;
    this.carId = carId;
  }

  // Locators
  get form(): Locator {
    return this.page.getByTestId('new-fillup-form');
  }

  get dateInput(): Locator {
    return this.page.getByTestId('fillup-date-input');
  }

  get fuelAmountInput(): Locator {
    return this.page.getByTestId('fillup-fuel-amount-input');
  }

  get totalPriceInput(): Locator {
    return this.page.getByTestId('fillup-total-price-input');
  }

  get odometerInput(): Locator {
    return this.page.getByTestId('fillup-odometer-input');
  }

  get distanceInput(): Locator {
    return this.page.getByTestId('fillup-distance-input');
  }

  get warningsContainer(): Locator {
    return this.page.getByTestId('fillup-warnings-container');
  }

  get saveButton(): Locator {
    return this.page.getByTestId('save-fillup-button');
  }

  get cancelButton(): Locator {
    return this.page.getByTestId('cancel-fillup-button');
  }

  get backLink(): Locator {
    return this.page.getByTestId('back-to-car-details-link');
  }

  // Actions
  async fillFillupForm(data: NewFillupFormData): Promise<void> {
    // Fill basic fields with blur to trigger validation
    await this.dateInput.fill(data.date);
    await this.dateInput.blur();

    await this.fuelAmountInput.fill(data.fuelAmount);
    await this.fuelAmountInput.blur();

    await this.totalPriceInput.fill(data.totalPrice);
    await this.totalPriceInput.blur();

    // Fill mode-specific field
    if (data.odometer) {
      await this.odometerInput.fill(data.odometer);
      await this.odometerInput.blur();
    } else if (data.distance) {
      await this.distanceInput.fill(data.distance);
      await this.distanceInput.blur();
    }

    // Wait for validation to complete
    await this.page.waitForTimeout(100);
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async goBack(): Promise<void> {
    await this.backLink.click();
  }

  async goto(): Promise<void> {
    await this.page.goto(`/cars/${this.carId}/fillups/new`);
  }

  // Validation
  async isOnNewFillupPage(): Promise<boolean> {
    return await this.form.isVisible();
  }

  async hasWarnings(): Promise<boolean> {
    return await this.warningsContainer.isVisible();
  }

  async getWarnings(): Promise<string[]> {
    if (!(await this.hasWarnings())) {
      return [];
    }

    const warningElements = await this.warningsContainer.locator('li').all();
    const warnings: string[] = [];

    for (const element of warningElements) {
      warnings.push((await element.textContent()) || '');
    }

    return warnings;
  }
}
