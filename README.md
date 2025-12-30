# JustFuel

![MVP Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow)

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Monorepo Structure](#monorepo-structure)
4. [Getting Started Locally](#getting-started-locally)
5. [Available Scripts](#available-scripts)
6. [Project Scope](#project-scope)
   - [In Scope](#in-scope)
   - [Out of Scope](#out-of-scope)
7. [Project Status](#project-status)
8. [License](#license)

## Project Description

JustFuel is a comprehensive solution designed to simplify manual tracking of fuel consumption and costs. It provides an intuitive interface for logging refuels, managing multiple vehicles, and visualizing key statistics—without unnecessary complexity.

The project is structured as a **Monorepo**, sharing core logic between:

- **Web App**: A modern, responsive web application for desktop and mobile browsers.
- **Mobile App**: A native mobile application (using Expo) for on-the-go tracking.

## Tech Stack

### Shared (`packages/shared`)

- **Language**: TypeScript 5
- **Logic**: Shared types (DTOs), database definitions, and calculation logic.

### Frontend Web (`apps/web`)

- **Framework**: Astro 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 & Shadcn/ui
- **State & Utilities**: clsx, class-variance-authority, lucide-react, tailwind-merge
- **Backend**: Supabase (PostgreSQL, Auth, SDK)
- **Testing**: Vitest (Unit), Playwright (E2E)

### Mobile App (`apps/mobile`)

- **Framework**: Expo (React Native 0.81)
- **UI Library**: React Native Paper
- **Persistence**: Expo SQLite (Local-First architecture)
- **Navigation**: React Navigation 7
- **Charts**: React Native Chart Kit

### Infrastructure

- **CI/CD**: GitHub Actions
- **Hosting**: Vercel (Web), EAS/Local Build (Mobile)

## Monorepo Structure

This project uses **npm workspaces** to manage multiple packages:

```text
justfuel/
├── apps/
│   ├── web/            # Astro + React Web App
│   └── mobile/         # Expo + React Native Mobile App
├── packages/
│   └── shared/         # Shared Types and Calculations
├── package.json        # Root configuration
└── README.md
```

## Getting Started Locally

### Prerequisites

- [Node.js 22.14.0](https://nodejs.org/) (managed via NVM)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- A Supabase project with API URL and Anon Key (for Web App)

### Setup

1.  **Clone repositories and install dependencies**:

    ```bash
    # Use the Node version defined in .nvmrc
    nvm install
    nvm use

    # Clone the repository
    git clone https://github.com/your-org/justfuel.git
    cd justfuel

    # Install dependencies for all workspaces
    npm install
    ```

2.  **Web App Setup**:

    Create `apps/web/.env` with your Supabase credentials:

    ```bash
    SUPABASE_URL=<your-supabase-url>
    SUPABASE_KEY=<your-supabase-anon-key>
    ```

3.  **Shared Package Build**:

    The shared package must be built before starting applications:

    ```bash
    npm run build --workspace=@justfuel/shared
    # OR from root
    npm run build
    ```

4.  **Start Development Servers**:
    - **Web App**:

      ```bash
      npm run web
      # Opens http://localhost:3000
      ```

    - **Mobile App**:

      ```bash
      npm run mobile
      # Press 'a' for Android, 'i' for iOS (requires simulator)

      # If you encounter issues, try clearing the cache:
      npx expo start --clear --android
      ```

## Available Scripts

Run these from the **root directory**:

- `npm run web`  
  Starts the Astro web app in development mode.

- `npm run mobile`  
  Starts the Expo mobile app.

- `npm run build`  
  Builds all workspaces (Shared, Web).

- `npm run clean`  
  Removes `node_modules` and build artifacts from all workspaces.

- `npm run lint`  
  Runs ESLint across all workspaces.

## API Endpoints (Web App)

### GET /api/cars

Returns a list of user's cars with aggregated statistics.

Query params:

- `sort`: `name | created_at` (default: `created_at`)
- `order`: `asc | desc` (default: `desc`)

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "My car",
      "initial_odometer": 10000,
      "mileage_input_preference": "odometer",
      "statistics": {
        "total_fuel_cost": 0,
        "total_fuel_amount": 0,
        "total_distance": 0,
        "average_consumption": 0,
        "average_price_per_liter": 0,
        "fillup_count": 0
      }
    }
  ]
}
```

### GET /api/cars/{carId}

Returns a single car with aggregated statistics and creation timestamp.

Path params:

- `carId`: UUID

Response:

```json
{
  "id": "uuid",
  "name": "My car",
  "initial_odometer": 10000,
  "mileage_input_preference": "odometer",
  "created_at": "2025-01-01T00:00:00.000Z",
  "statistics": {
    "total_fuel_cost": 0,
    "total_fuel_amount": 0,
    "total_distance": 0,
    "average_consumption": 0,
    "average_price_per_liter": 0,
    "fillup_count": 0
  }
}
```

### PATCH /api/cars/{carId}

Updates an existing car's information. Allows partial updates of car name and mileage input preference.

Path params:

- `carId`: UUID

Request body (at least one field required):

```json
{
  "name": "Updated Car Name",
  "mileage_input_preference": "odometer"
}
```

Response (200 OK):

```json
{
  "id": "uuid",
  "name": "Updated Car Name",
  "initial_odometer": 10000,
  "mileage_input_preference": "odometer",
  "created_at": "2025-01-01T00:00:00.000Z",
  "statistics": {
    "total_fuel_cost": 0,
    "total_fuel_amount": 0,
    "total_distance": 0,
    "average_consumption": 0,
    "average_price_per_liter": 0,
    "fillup_count": 0
  }
}
```

Error responses:

- `400 Bad Request` - Invalid request body or carId format
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Car not found or doesn't belong to user
- `409 Conflict` - Car name already exists for this user
- `500 Internal Server Error` - Server error

### DELETE /api/cars/{carId}

Permanently deletes a car and all associated fillups. Requires confirmation by providing the exact car name.

Path params:

- `carId`: UUID

Request body:

```json
{
  "confirmation_name": "My Audi A4"
}
```

Response (200 OK):

```json
{
  "message": "Car and all associated fillups deleted successfully"
}
```

Error responses:

- `400 Bad Request` - Invalid request body, carId format, or confirmation name doesn't match
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Car not found or doesn't belong to user
- `500 Internal Server Error` - Server error

### GET /api/cars/{carId}/fillups

Returns a paginated list of fillups for a specific car, sorted by date or odometer.

Path params:

- `carId`: UUID

Query params:

- `limit`: number (optional, default: 20, max: 100) - Number of results per page
- `cursor`: string (optional) - Pagination cursor for fetching next page
- `sort`: `date | odometer` (optional, default: `date`) - Field to sort by
- `order`: `asc | desc` (optional, default: `desc`) - Sort order

Response (200 OK):

```json
{
  "fillups": [
    {
      "id": "uuid",
      "car_id": "uuid",
      "date": "2025-10-17T12:00:00Z",
      "fuel_amount": 45.5,
      "total_price": 227.5,
      "odometer": 55000,
      "distance_traveled": 500,
      "fuel_consumption": 9.1,
      "price_per_liter": 5.0
    }
  ],
  "pagination": {
    "next_cursor": "base64_encoded_cursor",
    "has_more": true,
    "total_count": 42
  }
}
```

Error responses:

- `400 Bad Request` - Invalid carId format or query parameters
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Car not found or doesn't belong to user
- `500 Internal Server Error` - Server error

### GET /api/cars/{carId}/fillups/{fillupId}

Returns detailed information about a specific fillup for a car.

Path params:

- `carId`: UUID
- `fillupId`: UUID

Response (200 OK):

```json
{
  "id": "uuid",
  "car_id": "uuid",
  "date": "2025-10-17T12:00:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "odometer": 55000,
  "distance_traveled": 500,
  "fuel_consumption": 9.1,
  "price_per_liter": 5.0
}
```

Error responses:

- `400 Bad Request` - Invalid UUID format for carId or fillupId
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Fillup not found, doesn't belong to car, or car doesn't belong to user
- `500 Internal Server Error` - Server error

### POST /api/cars/{carId}/fillups

Creates a new fillup for a specific car. Supports two input methods: odometer reading or distance traveled (mutually exclusive).

Path params:

- `carId`: UUID

Request body (one of the two variants):

**Variant 1 - With odometer reading:**

```json
{
  "date": "2025-01-15T10:30:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "odometer": 55000
}
```

**Variant 2 - With distance traveled:**

```json
{
  "date": "2025-01-15T10:30:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "distance": 500
}
```

Response (201 Created):

```json
{
  "id": "uuid",
  "car_id": "uuid",
  "date": "2025-01-15T10:30:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "odometer": 55000,
  "distance_traveled": 500,
  "fuel_consumption": 9.1,
  "price_per_liter": 5.0,
  "warnings": [
    {
      "field": "odometer",
      "message": "Odometer reading is lower than the previous fillup"
    }
  ]
}
```

Error responses:

- `400 Bad Request` - Invalid request body, carId format, or validation errors (e.g., negative values, both odometer and distance provided)
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Car not found or doesn't belong to user
- `500 Internal Server Error` - Server error

### PATCH /api/cars/{carId}/fillups/{fillupId}

Updates an existing fillup for a specific car. Supports partial updates and two input methods: odometer reading or distance traveled (mutually exclusive).

Path params:

- `carId`: UUID
- `fillupId`: UUID

Request body (all fields optional):

```json
{
  "date": "2025-01-15T10:30:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "odometer": 55000
}
```

Response (200 OK):

```json
{
  "id": "uuid",
  "car_id": "uuid",
  "date": "2025-01-15T10:30:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "odometer": 55000,
  "distance_traveled": 500,
  "fuel_consumption": 9.1,
  "price_per_liter": 5.0,
  "updated_entries_count": 2,
  "warnings": []
}
```

Error responses:

- `400 Bad Request` - Invalid request body, carId/fillupId format, or validation errors
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Fillup not found, doesn't belong to car, or car doesn't belong to user
- `500 Internal Server Error` - Server error

### DELETE /api/cars/{carId}/fillups/{fillupId}

Deletes a specific fillup for a specific car. Automatically recalculates statistics for subsequent fillups to maintain data consistency.

Path params:

- `carId`: UUID
- `fillupId`: UUID

Response (200 OK):

```json
{
  "message": "Fillup deleted successfully",
  "updated_entries_count": 2
}
```

Error responses:

- `400 Bad Request` - Invalid carId or fillupId format
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Fillup or car not found, or doesn't belong to user
- `500 Internal Server Error` - An unexpected error occurred while deleting fillup

## Project Scope

### In Scope

- **User Account Management**: register, login, logout (Web).
- **Vehicle Management (CRUD)**: add, list, edit, delete vehicles.
- **Fuel Entry Management (CRUD)**:
  - Log refuels with date, volume, cost, odometer or distance.
  - Infinite scroll grid of entries, color-coded consumption.
  - Edit/delete entries with auto-recalculation of stats.
- **Statistics & Visualizations**:
  - Compute L/100km, cost per liter, distance between refuels.
  - Color-coded fuel consumption based on deviation from average.
  - Charts: consumption over time, price per liter, distance per refuel.
- **Cross-Platform Access**: Web and Mobile interfaces sharing core business logic.

### Out of Scope

- Social features or data sharing.
- In-app feedback collection.
- Automatic GPS/OBD-II integrations.

## Project Status

This project is currently in **MVP development**. Core features are implemented for both Web and Mobile platforms. Refactoring to a Monorepo structure has been completed to facilitate code sharing.

## License

MIT
