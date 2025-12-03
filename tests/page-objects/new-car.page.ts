import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export interface NewCarFormData {
  name: string;
  initialOdometer?: string;
  mileagePreference: "odometer" | "distance";
}

export class NewCarPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Locators
  get form(): Locator {
    return this.page.getByTestId("new-car-form");
  }

  get nameInput(): Locator {
    return this.page.getByTestId("car-name-input");
  }

  get initialOdometerInput(): Locator {
    return this.page.getByTestId("car-initial-odometer-input");
  }

  get mileagePreferenceSelect(): Locator {
    return this.page.getByTestId("car-mileage-preference-select");
  }

  get saveButton(): Locator {
    return this.page.getByTestId("save-car-button");
  }

  get cancelButton(): Locator {
    return this.page.getByTestId("cancel-car-button");
  }

  get backLink(): Locator {
    return this.page.getByTestId("back-to-cars-link");
  }

  // Actions
  async fillCarForm(data: NewCarFormData): Promise<void> {
    // Use pressSequentially instead of fill to ensure React onChange fires properly
    await this.nameInput.click();
    await this.nameInput.clear();
    await this.nameInput.pressSequentially(data.name, { delay: 50 });
    await this.page.waitForTimeout(100);

    if (data.initialOdometer) {
      await this.initialOdometerInput.fill(data.initialOdometer);
      await this.page.waitForTimeout(100);
    }

    await this.selectMileagePreference(data.mileagePreference);
    // Wait for validation to complete
    await this.page.waitForTimeout(300);
  }

  async selectMileagePreference(preference: "odometer" | "distance"): Promise<void> {
    await this.mileagePreferenceSelect.click();
    await this.page
      .getByRole("option", { name: preference === "odometer" ? "Stan licznika" : "Przejechany dystans" })
      .click();
  }

  async submit(): Promise<void> {
    // Wait for the button to be enabled (validation runs async with setTimeout)
    await this.saveButton.waitFor({ state: "visible" });
    await expect(this.saveButton).toBeEnabled({ timeout: 2000 });
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async goBack(): Promise<void> {
    await this.backLink.click();
  }

  async goto(): Promise<void> {
    await this.page.goto("/cars/new");
  }

  // Validation
  async isOnNewCarPage(): Promise<boolean> {
    return await this.form.isVisible();
  }
}
