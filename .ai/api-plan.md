# REST API Plan for JustFuel

## 1. Resources

The API is organized around the following main resources, mapped to database tables:

| Resource     | Database Table/View     | Description                               |
| ------------ | ----------------------- | ----------------------------------------- |
| `cars`       | `cars`                  | User's vehicles with their configurations |
| `fillups`    | `fillups`               | Fuel fill-up entries for each car         |
| `statistics` | `car_statistics` (view) | Aggregated statistics for each car        |

## 2. API Endpoints

### 2.1. Authentication

#### Register New User

- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Description:** Creates a new user account with email and password
- **Authentication:** None (public endpoint)
- **Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

- **Success Response (201 Created):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-10-17T12:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

- **Error Responses:**
  - `400 Bad Request` - Invalid email format or password too short
  - `409 Conflict` - Email already exists

#### Login User

- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Description:** Authenticates user and creates a session
- **Authentication:** None (public endpoint)
- **Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

- **Success Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

- **Error Responses:**
  - `400 Bad Request` - Missing credentials
  - `401 Unauthorized` - Invalid credentials

#### Logout User

- **Method:** `POST`
- **Path:** `/api/auth/logout`
- **Description:** Terminates the current user session
- **Authentication:** Required (Bearer token)
- **Request Body:** None
- **Success Response (200 OK):**

```json
{
  "message": "Successfully logged out"
}
```

- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token

#### Get Current User

- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Description:** Returns information about the currently authenticated user
- **Authentication:** Required (Bearer token)
- **Request Body:** None
- **Success Response (200 OK):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "2025-10-17T12:00:00Z"
}
```

- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token

---

### 2.2. Cars

#### List All Cars

- **Method:** `GET`
- **Path:** `/api/cars`
- **Description:** Retrieves all cars for the authenticated user with their basic statistics
- **Authentication:** Required (Bearer token)
- **Query Parameters:**
  - `sort` (optional): Sort field - `name`, `created_at` (default: `created_at`)
  - `order` (optional): Sort order - `asc`, `desc` (default: `desc`)
- **Success Response (200 OK):**

```json
{
  "cars": [
    {
      "id": "uuid",
      "name": "My Audi A4",
      "initial_odometer": 50000,
      "mileage_input_preference": "odometer",
      "created_at": "2025-10-17T12:00:00Z",
      "statistics": {
        "total_fuel_cost": 2500.5,
        "total_fuel_amount": 500.25,
        "total_distance": 5000,
        "average_consumption": 8.5,
        "average_price_per_liter": 5.0,
        "fillup_count": 25
      }
    }
  ]
}
```

- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token

#### Get Single Car

- **Method:** `GET`
- **Path:** `/api/cars/{carId}`
- **Description:** Retrieves detailed information about a specific car
- **Authentication:** Required (Bearer token)
- **Success Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "My Audi A4",
  "initial_odometer": 50000,
  "mileage_input_preference": "odometer",
  "created_at": "2025-10-17T12:00:00Z",
  "statistics": {
    "total_fuel_cost": 2500.5,
    "total_fuel_amount": 500.25,
    "total_distance": 5000,
    "average_consumption": 8.5,
    "average_price_per_liter": 5.0,
    "fillup_count": 25
  }
}
```

- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token
  - `404 Not Found` - Car not found or doesn't belong to user

#### Create Car

- **Method:** `POST`
- **Path:** `/api/cars`
- **Description:** Creates a new car for the authenticated user
- **Authentication:** Required (Bearer token)
- **Request Body:**

```json
{
  "name": "My Audi A4",
  "initial_odometer": 50000,
  "mileage_input_preference": "odometer"
}
```

- **Success Response (201 Created):**

```json
{
  "id": "uuid",
  "name": "My Audi A4",
  "initial_odometer": 50000,
  "mileage_input_preference": "odometer",
  "created_at": "2025-10-17T12:00:00Z"
}
```

- **Error Responses:**
  - `400 Bad Request` - Validation errors (missing name, invalid mileage_input_preference)
  - `401 Unauthorized` - Invalid or expired token
  - `409 Conflict` - Car name already exists for this user

#### Update Car

- **Method:** `PATCH`
- **Path:** `/api/cars/{carId}`
- **Description:** Updates car information (currently only name and mileage preference)
- **Authentication:** Required (Bearer token)
- **Request Body:**

```json
{
  "name": "My Updated Audi A4",
  "mileage_input_preference": "distance"
}
```

- **Success Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "My Updated Audi A4",
  "initial_odometer": 50000,
  "mileage_input_preference": "distance",
  "created_at": "2025-10-17T12:00:00Z"
}
```

- **Error Responses:**
  - `400 Bad Request` - Validation errors
  - `401 Unauthorized` - Invalid or expired token
  - `404 Not Found` - Car not found or doesn't belong to user
  - `409 Conflict` - New name already exists for this user

#### Delete Car

- **Method:** `DELETE`
- **Path:** `/api/cars/{carId}`
- **Description:** Permanently deletes a car and all associated fillups
- **Authentication:** Required (Bearer token)
- **Request Body:**

```json
{
  "confirmation_name": "My Audi A4"
}
```

- **Success Response (200 OK):**

```json
{
  "message": "Car and all associated fillups deleted successfully"
}
```

- **Error Responses:**
  - `400 Bad Request` - Confirmation name doesn't match
  - `401 Unauthorized` - Invalid or expired token
  - `404 Not Found` - Car not found or doesn't belong to user

---

### 2.3. Fillups

#### List Fillups for a Car

- **Method:** `GET`
- **Path:** `/api/cars/{carId}/fillups`
- **Description:** Retrieves paginated fillup history for a specific car
- **Authentication:** Required (Bearer token)
- **Query Parameters:**
  - `limit` (optional): Number of results per page (default: 20, max: 100)
  - `cursor` (optional): Pagination cursor for next page
  - `sort` (optional): Sort field - `date`, `odometer` (default: `date`)
  - `order` (optional): Sort order - `asc`, `desc` (default: `desc`)
- **Success Response (200 OK):**

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
      "price_per_liter": 5.0,
      "created_at": "2025-10-17T12:05:00Z"
    }
  ],
  "pagination": {
    "next_cursor": "cursor_string",
    "has_more": true,
    "total_count": 150
  }
}
```

- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token
  - `404 Not Found` - Car not found or doesn't belong to user

#### Get Single Fillup

- **Method:** `GET`
- **Path:** `/api/cars/{carId}/fillups/{fillupId}`
- **Description:** Retrieves detailed information about a specific fillup
- **Authentication:** Required (Bearer token)
- **Success Response (200 OK):**

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
  "price_per_liter": 5.0,
  "created_at": "2025-10-17T12:05:00Z"
}
```

- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token
  - `404 Not Found` - Fillup or car not found, or doesn't belong to user

#### Create Fillup

- **Method:** `POST`
- **Path:** `/api/cars/{carId}/fillups`
- **Description:** Creates a new fillup entry for the specified car
- **Authentication:** Required (Bearer token)
- **Request Body (Option 1: Odometer):**

```json
{
  "date": "2025-10-17T12:00:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "odometer": 55000
}
```

- **Request Body (Option 2: Distance):**

```json
{
  "date": "2025-10-17T12:00:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "distance": 500
}
```

- **Success Response (201 Created):**

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
  "price_per_liter": 5.0,
  "created_at": "2025-10-17T12:05:00Z",
  "warnings": [
    {
      "field": "odometer",
      "message": "Odometer reading is lower than the previous fillup"
    }
  ]
}
```

- **Error Responses:**
  - `400 Bad Request` - Validation errors (negative values, missing required fields, both odometer and distance provided)
  - `401 Unauthorized` - Invalid or expired token
  - `404 Not Found` - Car not found or doesn't belong to user

#### Update Fillup

- **Method:** `PATCH`
- **Path:** `/api/cars/{carId}/fillups/{fillupId}`
- **Description:** Updates an existing fillup entry and recalculates dependent statistics
- **Authentication:** Required (Bearer token)
- **Request Body:**

```json
{
  "date": "2025-10-17T13:00:00Z",
  "fuel_amount": 46.0,
  "total_price": 230.0,
  "odometer": 55100
}
```

- **Success Response (200 OK):**

```json
{
  "id": "uuid",
  "car_id": "uuid",
  "date": "2025-10-17T13:00:00Z",
  "fuel_amount": 46.0,
  "total_price": 230.0,
  "odometer": 55100,
  "distance_traveled": 600,
  "fuel_consumption": 7.67,
  "price_per_liter": 5.0,
  "created_at": "2025-10-17T12:05:00Z",
  "updated_entries_count": 3,
  "warnings": []
}
```

- **Error Responses:**
  - `400 Bad Request` - Validation errors
  - `401 Unauthorized` - Invalid or expired token
  - `404 Not Found` - Fillup or car not found, or doesn't belong to user

#### Delete Fillup

- **Method:** `DELETE`
- **Path:** `/api/cars/{carId}/fillups/{fillupId}`
- **Description:** Deletes a fillup entry and recalculates statistics for subsequent entries
- **Authentication:** Required (Bearer token)
- **Success Response (200 OK):**

```json
{
  "message": "Fillup deleted successfully",
  "updated_entries_count": 2
}
```

- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token
  - `404 Not Found` - Fillup or car not found, or doesn't belong to user

---

### 2.4. Statistics and Charts

#### Get Car Statistics

- **Method:** `GET`
- **Path:** `/api/cars/{carId}/statistics`
- **Description:** Retrieves aggregated statistics for a specific car
- **Authentication:** Required (Bearer token)
- **Success Response (200 OK):**

```json
{
  "car_id": "uuid",
  "total_fuel_cost": 2500.5,
  "total_fuel_amount": 500.25,
  "total_distance": 5000,
  "average_consumption": 8.5,
  "average_price_per_liter": 5.0,
  "fillup_count": 25,
  "latest_fillup_date": "2025-10-17T12:00:00Z",
  "current_odometer": 55000
}
```

- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token
  - `404 Not Found` - Car not found or doesn't belong to user

#### Get Chart Data

- **Method:** `GET`
- **Path:** `/api/cars/{carId}/charts`
- **Description:** Retrieves time-series data for charts visualization
- **Authentication:** Required (Bearer token)
- **Query Parameters:**
  - `type` (required): Chart type - `consumption`, `price_per_liter`, `distance`
  - `start_date` (optional): Filter data from this date (ISO 8601 format)
  - `end_date` (optional): Filter data until this date (ISO 8601 format)
  - `limit` (optional): Maximum number of data points (default: 50)
- **Success Response (200 OK) - Consumption Chart:**

```json
{
  "type": "consumption",
  "data": [
    {
      "date": "2025-10-17T12:00:00Z",
      "value": 9.1,
      "odometer": 55000
    },
    {
      "date": "2025-10-15T08:30:00Z",
      "value": 8.3,
      "odometer": 54500
    }
  ],
  "average": 8.5,
  "metadata": {
    "count": 25,
    "min": 7.2,
    "max": 10.5
  }
}
```

- **Success Response (200 OK) - Price Per Liter Chart:**

```json
{
  "type": "price_per_liter",
  "data": [
    {
      "date": "2025-10-17T12:00:00Z",
      "value": 5.0,
      "odometer": 55000
    },
    {
      "date": "2025-10-15T08:30:00Z",
      "value": 4.95,
      "odometer": 54500
    }
  ],
  "average": 4.98,
  "metadata": {
    "count": 25,
    "min": 4.5,
    "max": 5.2
  }
}
```

- **Success Response (200 OK) - Distance Chart:**

```json
{
  "type": "distance",
  "data": [
    {
      "date": "2025-10-17T12:00:00Z",
      "value": 500,
      "odometer": 55000
    },
    {
      "date": "2025-10-15T08:30:00Z",
      "value": 450,
      "odometer": 54500
    }
  ],
  "average": 475,
  "metadata": {
    "count": 25,
    "min": 200,
    "max": 800
  }
}
```

- **Error Responses:**
  - `400 Bad Request` - Invalid chart type or date format
  - `401 Unauthorized` - Invalid or expired token
  - `404 Not Found` - Car not found or doesn't belong to user

---

## 3. Authentication and Authorization

### Authentication Mechanism

The API uses **Supabase Authentication** with JWT (JSON Web Tokens) for session management.

### Implementation Details

1. **Registration and Login:**
   - Uses Supabase Auth API to create users and manage sessions
   - Password requirements: minimum 8 characters
   - Email must be valid and unique

2. **Session Management:**
   - Access tokens are short-lived JWT tokens (expires in 1 hour by default)
   - Refresh tokens are provided for obtaining new access tokens
   - Tokens are passed via `Authorization: Bearer {token}` header

3. **Token Refresh:**
   - Clients should implement automatic token refresh using refresh tokens
   - Endpoint: `/api/auth/refresh` (POST) with refresh token in body

4. **Authorization:**
   - All protected endpoints require valid JWT token
   - User context is extracted from JWT token
   - Row-Level Security (RLS) policies in Supabase ensure data isolation
   - Users can only access their own cars and fillups

5. **Security Best Practices:**
   - Passwords are hashed using bcrypt (handled by Supabase)
   - JWT tokens are signed and verified
   - HTTPS required for all API calls in production
   - CORS configured to allow only frontend domain

---

## 4. Validation and Business Logic

### 4.1. Validation Rules

#### Cars Resource

- **name:**
  - Required
  - Type: string
  - Max length: 255 characters
  - Must be unique per user
  - Cannot be empty or whitespace only

- **initial_odometer:**
  - Optional
  - Type: numeric
  - Must be >= 0 if provided
  - Precision: up to 2 decimal places

- **mileage_input_preference:**
  - Required
  - Type: enum
  - Allowed values: `odometer`, `distance`
  - Default: `odometer`

#### Fillups Resource

- **date:**
  - Required
  - Type: ISO 8601 timestamp
  - Cannot be in the future (warning only)
  - Should be chronologically consistent with other fillups (warning only)

- **fuel_amount:**
  - Required
  - Type: numeric
  - Must be > 0
  - Precision: up to 2 decimal places
  - Typical range: 0.1 - 200 liters (warning if outside)

- **total_price:**
  - Required
  - Type: numeric
  - Must be > 0
  - Precision: up to 2 decimal places

- **odometer:**
  - Required when `distance` is not provided
  - Type: numeric
  - Must be > 0
  - Precision: up to 2 decimal places
  - Should be >= previous fillup odometer (soft validation - warning only)

- **distance:**
  - Required when `odometer` is not provided
  - Type: numeric
  - Must be > 0
  - Precision: up to 2 decimal places
  - Cannot provide both `odometer` and `distance`

### 4.2. Business Logic Implementation

#### Fillup Creation Logic

1. **Input Validation:**
   - Validate required fields and data types
   - Ensure either `odometer` or `distance` is provided, but not both

2. **Odometer Calculation:**
   - If `distance` is provided:
     - Fetch the most recent fillup for the car (by date)
     - Calculate `odometer = previous_fillup.odometer + distance`
     - If no previous fillup exists and car has `initial_odometer`, use that
     - If neither exists, return error

3. **Distance Calculation:**
   - Fetch the previous fillup (by date and odometer)
   - Calculate `distance_traveled = current_odometer - previous_odometer`
   - If no previous fillup, `distance_traveled = NULL`

4. **Consumption Calculation:**
   - If `distance_traveled` is available:
     - `fuel_consumption = (fuel_amount / distance_traveled) * 100` (L/100km)
   - Else: `fuel_consumption = NULL`

5. **Price Per Liter Calculation:**
   - `price_per_liter = total_price / fuel_amount`

6. **Soft Validation Warnings:**
   - Check if odometer is lower than previous fillup → add warning
   - Check if date is in the future → add warning
   - Check if consumption is unusually high/low (>20 or <2) → add warning
   - Return warnings array in response (does not prevent save)

#### Fillup Update Logic

1. **Validate Changes:**
   - Apply same validation as creation
   - Calculate new denormalized values

2. **Recalculate Affected Entries:**
   - Find all subsequent fillups (by date)
   - Recalculate their `distance_traveled` and `fuel_consumption`
   - Update them in the database
   - Return count of updated entries

#### Fillup Delete Logic

1. **Find Subsequent Entries:**
   - Locate all fillups after the deleted one (by date)

2. **Recalculate Chain:**
   - Recalculate `distance_traveled` and `fuel_consumption` for each
   - If deleted entry was the first, subsequent entry becomes first (nulls its distance/consumption)
   - Update affected entries
   - Return count of updated entries

#### Statistics Calculation

- Aggregations are performed using the `car_statistics` view
- View automatically recalculates when fillups change
- Cached on the application layer for performance (short TTL ~5 minutes)

#### Chart Data Generation

1. **Fetch Fillups:**
   - Query fillups within date range (if specified)
   - Order by date ascending
   - Limit results for performance

2. **Transform Data:**
   - Extract relevant field based on chart type
   - Format for frontend charting library
   - Calculate average and metadata

3. **Handle Insufficient Data:**
   - Return empty data array with appropriate message
   - Minimum 2 data points required for meaningful chart

### 4.3. Error Handling

#### Standard Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific validation error details"
    }
  }
}
```

#### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required or failed
- `FORBIDDEN` - User doesn't have access to resource
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (e.g., duplicate name)
- `INTERNAL_ERROR` - Unexpected server error

### 4.4. Performance Considerations

1. **Pagination:**
   - Cursor-based pagination for fillups list (infinite scroll)
   - Default page size: 20 items
   - Maximum page size: 100 items

2. **Caching:**
   - Statistics view results cached for 5 minutes
   - Car list cached for 1 minute
   - ETags for conditional requests

3. **Database Optimization:**
   - Indexes on frequently queried columns (user_id, car_id, date)
   - Denormalized fields in fillups table for read performance
   - RLS policies use indexed columns

4. **Rate Limiting:**
   - Per-user rate limiting: 100 requests per minute
   - Stricter limits for write operations: 30 requests per minute
   - Rate limit headers included in responses

5. **Query Optimization:**
   - Use database views for complex aggregations
   - Fetch only required fields (avoid SELECT \*)
   - Batch updates when recalculating multiple fillups

---

## 5. API Versioning

- Current version: `v1`
- Version prefix not included in URLs for MVP
- Future versions will use URL path versioning: `/api/v2/...`
- Breaking changes will require new version

---

## 6. Response Headers

All responses include standard headers:

- `Content-Type: application/json`
- `X-RateLimit-Limit` - Request limit per window
- `X-RateLimit-Remaining` - Remaining requests in window
- `X-RateLimit-Reset` - Time when rate limit resets (Unix timestamp)
- `ETag` - Entity tag for caching (where applicable)

---

## 7. Additional Considerations

### 7.1. Timezone Handling

- All timestamps stored as `timestamptz` in database
- API accepts and returns ISO 8601 format with timezone
- Server converts to UTC for storage
- Client responsible for displaying in user's local timezone

### 7.2. Decimal Precision

- Monetary values: 2 decimal places
- Fuel amounts: 2 decimal places
- Odometer readings: 2 decimal places
- Consumption calculations: 2 decimal places

### 7.3. Soft Deletes

- Hard deletes used (as per PRD requirements)
- Cascading deletes handled by database constraints
- No recovery mechanism in MVP

### 7.4. Audit Trail

- `created_at` timestamp on all records
- No `updated_at` in MVP (can be added later if needed)
- No change history tracking in MVP
