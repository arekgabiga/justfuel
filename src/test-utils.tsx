import React from "react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { CarWithStatisticsDTO, CarDetailsDTO, FillupDTO, ValidationWarningDTO } from "./types";

/**
 * Custom render function with providers
 * Add any global providers here (ThemeProvider, etc.) if needed
 */
export function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { ...options });
}

/**
 * Setup user-event for user interactions
 */
export function setupUser() {
  return userEvent.setup();
}

/**
 * Mock window.location.href for navigation tests
 */
export function mockWindowLocation() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).location;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.location = { href: "" } as any;
}

/**
 * Mock localStorage
 */
export function setupLocalStorage() {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.localStorage = localStorageMock as any;

  return localStorageMock;
}

/**
 * Helper to create mock CarWithStatisticsDTO
 */
export function createMockCar(overrides: Partial<CarWithStatisticsDTO> = {}): CarWithStatisticsDTO {
  return {
    id: "test-car-id",
    name: "Test Car",
    initial_odometer: 50000,
    mileage_input_preference: "odometer" as const,
    statistics: {
      total_fuel_cost: 1500,
      total_fuel_amount: 300,
      total_distance: 3000,
      average_consumption: 7.5,
      average_price_per_liter: 5.0,
      fillup_count: 10,
    },
    ...overrides,
  };
}

/**
 * Helper to create mock CarDetailsDTO
 */
export function createMockCarDetails(overrides: Partial<CarDetailsDTO> = {}): CarDetailsDTO {
  return {
    ...createMockCar(overrides),
    created_at: "2024-01-01T00:00:00Z",
  };
}

/**
 * Helper to create mock FillupDTO
 */
export function createMockFillup(overrides: Partial<FillupDTO> = {}): FillupDTO {
  return {
    id: "test-fillup-id",
    car_id: "test-car-id",
    date: "2024-01-15T10:00:00Z",
    fuel_amount: 45.5,
    total_price: 227.5,
    odometer: 55000,
    distance_traveled: 500,
    fuel_consumption: 9.1,
    price_per_liter: 5.0,
    ...overrides,
  };
}

/**
 * Helper to create mock ValidationWarningDTO
 */
export function createMockWarning(field: string, message: string): ValidationWarningDTO {
  return { field, message };
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react";
export { userEvent };
