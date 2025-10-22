# JustFuel

![MVP Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow)

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
   - [In Scope](#in-scope)
   - [Out of Scope](#out-of-scope)
6. [Project Status](#project-status)
7. [License](#license)

## Project Description

JustFuel is a minimalist web application designed to simplify manual tracking of fuel consumption and costs. It provides an intuitive interface for logging refuels, managing multiple vehicles, and visualizing key statistics—without unnecessary complexity.

## Tech Stack

- **Frontend**: Astro 5 with React 19 components
- **Language**: TypeScript 5
- **Styling**: Tailwind 4 & Shadcn/ui
- **State & Utilities**: clsx, class-variance-authority, lucide-react, tailwind-merge
- **Backend**: Supabase (PostgreSQL, Auth, SDK)
- **CI/CD**: GitHub Actions
- **Hosting**: DigitalOcean (Docker)

## Getting Started Locally

### Prerequisites

- [Node.js 22.14.0](https://nodejs.org/) (managed via NVM)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- A Supabase project with API URL and Anon Key

### Setup

```bash
# Use the Node version defined in .nvmrc
nvm install
nvm use

# Clone the repository
git clone https://github.com/your-org/justfuel.git
cd justfuel

# Install dependencies
npm install

# Create a .env file with the following variables:
# SUPABASE_URL=<your-supabase-url>
# SUPABASE_KEY=<your-supabase-anon-key>

# Start the development server
npm run dev
```

Open `http://localhost:3000` in your browser to see the app.

### Development Auth Fallback (optional)

During early development you can bypass Bearer auth for server endpoints by enabling a fallback user.

Add the following to your `.env` to enable the fallback:

```bash
DEV_AUTH_FALLBACK=true
```

Behavior when enabled:

- If an incoming request lacks a valid `Authorization: Bearer <token>` header, the backend will scope queries to the development user id defined as `DEFAULT_USER_ID` in `src/db/supabase.client.ts`.
- When a valid Bearer token is present, normal RLS-based auth is used.

Endpoint example (dev fallback enabled, no token):

```bash
curl -X GET "http://localhost:3000/api/cars"
```

Endpoint example (production-like):

```bash
curl -H "Authorization: Bearer <token>" -X GET "http://localhost:3000/api/cars"
```

### API Endpoints

#### GET /api/cars

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

#### GET /api/cars/{carId}

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

#### PATCH /api/cars/{carId}

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

#### DELETE /api/cars/{carId}

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

#### GET /api/cars/{carId}/fillups

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

#### GET /api/cars/{carId}/fillups/{fillupId}

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

#### POST /api/cars/{carId}/fillups

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

## Available Scripts

In the project directory, run:

- `npm run dev`  
  Launches the Astro dev server with hot reload.

- `npm run build`  
  Builds the production-ready site to `dist/`.

- `npm run preview`  
  Serves the build output locally for testing.

- `npm run astro`  
  Access Astro CLI commands.

- `npm run lint`  
  Runs ESLint on the codebase.

- `npm run lint:fix`  
  Runs ESLint and auto-fixes issues.

- `npm run format`  
  Formats code with Prettier.

## Project Scope

### In Scope

- **User Account Management**: register, login, logout.
- **Vehicle Management (CRUD)**: add, list, edit, delete vehicles (with confirmation).
- **Fuel Entry Management (CRUD)**:
  - Log refuels with date, volume, cost, odometer or distance.
  - Infinite scroll grid of entries, color-coded consumption.
  - Edit/delete entries with auto-recalculation of stats.
- **Statistics & Visualizations**:
  - Compute L/100km, cost per liter, distance between refuels.
  - Color-coded fuel consumption based on deviation from average.
  - Three charts: consumption over time, price per liter, distance per refuel.
- **Onboarding**: guide new users to add first vehicle and refuel entry.

### Out of Scope

- Data export (CSV/PDF).
- Social features or data sharing.
- Native mobile apps (iOS/Android).
- In-app feedback collection.
- Automatic GPS/OBD-II integrations.

## Project Status

This project is currently in **MVP development**. Core features are implemented; UI and UX improvements, testing, and documentation are ongoing.

## Logging and Diagnostics

- Correlate requests using `x-request-id` header. If present, include it in all server logs for the request lifecycle (e.g., `console.error("[GET /api/cars/{carId}] requestId=...", err)`).
- Log only non-sensitive context. Avoid PII such as raw Authorization headers, tokens, or user emails. Prefer IDs and counts.
- Favor structured messages that include: route, requestId, outcome (success/error), and brief reason on error.
- On validation failures (Zod), include parser message in `details.issues` of `ErrorResponseDTO`; avoid logging user-provided payloads.
- For upstream errors (e.g., Supabase failures), log the error object and return `INTERNAL_ERROR` with a generic message.
- In development, surface stack traces in the console; in production, keep responses minimal and leverage external log collectors if needed.

## License

MIT
