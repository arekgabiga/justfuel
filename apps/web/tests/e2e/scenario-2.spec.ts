import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { CarsListPage } from '../page-objects/cars-list.page';
import { NewCarPage } from '../page-objects/new-car.page';
import { EditCarPage } from '../page-objects/edit-car.page';
import { CarDetailsPage } from '../page-objects/car-details.page';
import { NewFillupPage } from '../page-objects/new-fillup.page';
import { DeleteCarDialog } from '../page-objects/delete-car-dialog';

test.describe('Scenario 2: Zarządzanie Samochodami', () => {
  let loginPage: LoginPage;
  let carsListPage: CarsListPage;
  let newCarPage: NewCarPage;
  let editCarPage: EditCarPage;
  let carDetailsPage: CarDetailsPage;
  let newFillupPage: NewFillupPage;
  let deleteCarDialog: DeleteCarDialog;

  let createdCarId: string;

  test.beforeEach(async ({ page }) => {
    // Initialize all page objects
    loginPage = new LoginPage(page);
    carsListPage = new CarsListPage(page);
    newCarPage = new NewCarPage(page);
    deleteCarDialog = new DeleteCarDialog(page);

    // Step 1: Logowanie
    await loginPage.goto();

    const username = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!username || !password) {
      throw new Error('E2E_USERNAME and E2E_PASSWORD must be set in .env.test');
    }

    await loginPage.login(username, password);

    // Verify we're on the cars list page after login
    await expect(page).toHaveURL('/');
    await expect(carsListPage.addCarButton).toBeVisible();
  });

  test('complete car management flow', async ({ page }) => {
    const testCarName = `Test Car ${Date.now()}`;
    const updatedCarName = `Updated ${testCarName}`;

    // Step 2: Dodanie nowego samochodu
    await carsListPage.clickAddCar();
    await expect(newCarPage.form).toBeVisible();

    await newCarPage.fillCarForm({
      name: testCarName,
      initialOdometer: '50000',
      mileagePreference: 'distance',
    });
    await newCarPage.submit();

    // Verify redirect to cars list
    await expect(page).toHaveURL('/cars');
    await expect(page.getByText(testCarName)).toBeVisible();

    // Get the created car ID from the page
    // (In a real scenario, you might need to extract this from the URL or DOM)
    const carCardLocator = page.locator(`[data-test-id^="car-card-"]`).filter({ hasText: testCarName }).first();
    const carCardId = await carCardLocator.getAttribute('data-test-id');
    createdCarId = carCardId?.replace('car-card-', '') || '';

    // Step 3 & 4: Edycja nazwy samochodu i przełączenie na tryb "distance"
    await carsListPage.clickCarCard(createdCarId);

    carDetailsPage = new CarDetailsPage(page, createdCarId);
    await expect(carDetailsPage.carHeader).toBeVisible();

    await carDetailsPage.clickEdit();

    editCarPage = new EditCarPage(page, createdCarId);
    await expect(editCarPage.form).toBeVisible();

    await editCarPage.updateCar({
      name: updatedCarName,
    });
    await editCarPage.submit();

    // Step 5: Wyświetlenie szczegółów samochodu
    await expect(page).toHaveURL(`/cars/${createdCarId}`);
    await expect(page.getByText(updatedCarName)).toBeVisible();

    // Step 6: Dodanie kilku tankowań
    newFillupPage = new NewFillupPage(page, createdCarId);

    // First fillup - use distance mode since car preference is "distance"
    await newFillupPage.goto();
    await newFillupPage.fillFillupForm({
      date: '2024-01-15',
      fuelAmount: '45.5',
      totalPrice: '250.00',
      distance: '500',
    });
    await newFillupPage.submit();

    // Verify redirect back to car details (may include query params like ?tab=fillups)
    await expect(page).toHaveURL(new RegExp(`/cars/${createdCarId}(\\?.*)?$`));

    // Second fillup
    await newFillupPage.goto();
    await newFillupPage.fillFillupForm({
      date: '2024-02-01',
      fuelAmount: '40.0',
      totalPrice: '220.00',
      distance: '450',
    });
    await newFillupPage.submit();

    // Step 7 & 8: Weryfikacja obliczenia spalania i aktualizacji statystyk
    // Verify we're back on car details page (may include query params like ?tab=fillups)
    await expect(page).toHaveURL(new RegExp(`/cars/${createdCarId}(\\?.*)?$`));

    // Step 8: Weryfikacja statystyk na liście samochodów
    await carDetailsPage.goBack();
    await expect(page).toHaveURL('/');

    // Verify statistics on the car card
    const statsText = await carsListPage.getCarStatistics(createdCarId);

    // Expected values based on fillups:
    // 1. 500km, 45.5L
    // 2. 450km, 40.0L
    // Total distance: 950km
    // Total fuel: 85.5L
    // Total cost: 470.00 PLN
    // Avg consumption: (85.5 / 950) * 100 = 9.0 L/100km

    expect(statsText).toContain('8.99 L/100km');
    expect(statsText).toContain('470.00 zł');
    expect(statsText).toContain('950 km');
    expect(statsText).toContain('2 tankowań'); // fillup count

    // Step 9: Usunięcie samochodu (z potwierdzeniem)
    // Musimy wrócić do szczegółów, aby usunąć
    await carsListPage.clickCarCard(createdCarId);
    await expect(page).toHaveURL(`/cars/${createdCarId}`);

    await carDetailsPage.clickDelete();

    // Verify delete dialog is visible
    await expect(deleteCarDialog.dialog).toBeVisible();

    await deleteCarDialog.confirmDeletion(updatedCarName);

    // Verify redirect to cars list after deletion
    await expect(page).toHaveURL('/cars');

    // Verify car is no longer in the list
    await expect(page.getByText(updatedCarName)).not.toBeVisible();
  });

  test('cancel car creation', async ({ page }) => {
    await carsListPage.clickAddCar();
    await expect(newCarPage.form).toBeVisible();

    await newCarPage.fillCarForm({
      name: 'This car will not be created',
      mileagePreference: 'odometer',
    });
    await newCarPage.cancel();

    // Verify we're back on cars list
    await expect(page).toHaveURL('/cars');
  });

  test('cancel car deletion', async ({ page }) => {
    const testCarName = `Test Car ${Date.now()}`;

    // First create a car
    await carsListPage.clickAddCar();
    await newCarPage.fillCarForm({
      name: testCarName,
      mileagePreference: 'odometer',
    });
    await newCarPage.submit();

    // Wait for the car to appear in the list
    await expect(page.getByText(testCarName)).toBeVisible();

    // Navigate to car details
    const carCardLocator = page.locator(`[data-test-id^="car-card-"]`).filter({ hasText: testCarName }).first();
    const carCardId = await carCardLocator.getAttribute('data-test-id');
    createdCarId = carCardId?.replace('car-card-', '') || '';

    carDetailsPage = new CarDetailsPage(page, createdCarId);
    await carDetailsPage.goto();

    // Try to delete but cancel
    await carDetailsPage.clickDelete();
    await expect(deleteCarDialog.dialog).toBeVisible();
    await deleteCarDialog.cancel();

    // Verify dialog is closed and we're still on car details page
    await expect(deleteCarDialog.dialog).not.toBeVisible();
    await expect(page).toHaveURL(`/cars/${createdCarId}`);
  });
});
