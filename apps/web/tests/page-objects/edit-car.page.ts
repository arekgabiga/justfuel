import { Page, Locator } from '@playwright/test';

export interface EditCarFormData {
  name?: string;
  mileagePreference?: 'odometer' | 'distance';
}

export class EditCarPage {
  readonly page: Page;
  private readonly carId: string;

  constructor(page: Page, carId: string) {
    this.page = page;
    this.carId = carId;
  }

  // Locators
  get form(): Locator {
    return this.page.getByTestId('edit-car-form');
  }

  get nameInput(): Locator {
    return this.page.getByTestId('edit-car-name-input');
  }

  get mileagePreferenceSelect(): Locator {
    return this.page.getByTestId('edit-car-mileage-preference-select');
  }

  get saveButton(): Locator {
    return this.page.getByTestId('edit-car-save-button');
  }

  get cancelButton(): Locator {
    return this.page.getByTestId('edit-car-cancel-button');
  }

  get deleteButton(): Locator {
    return this.page.getByTestId('edit-car-delete-button');
  }

  get backLink(): Locator {
    return this.page.getByTestId('back-to-car-details-link');
  }

  // Actions
  async updateCarName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async selectMileagePreference(preference: 'odometer' | 'distance'): Promise<void> {
    await this.mileagePreferenceSelect.click();
    await this.page
      .getByRole('option', { name: preference === 'odometer' ? 'Stan licznika' : 'Przejechany dystans' })
      .click();
  }

  async updateCar(data: EditCarFormData): Promise<void> {
    if (data.name) {
      await this.updateCarName(data.name);
    }

    if (data.mileagePreference) {
      await this.selectMileagePreference(data.mileagePreference);
    }
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async clickDelete(): Promise<void> {
    await this.deleteButton.click();
  }

  async goBack(): Promise<void> {
    await this.backLink.click();
  }

  async goto(): Promise<void> {
    await this.page.goto(`/cars/${this.carId}/edit`);
  }

  // Validation
  async isOnEditCarPage(): Promise<boolean> {
    return await this.form.isVisible();
  }
}
