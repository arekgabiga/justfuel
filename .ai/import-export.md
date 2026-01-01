# Import/Export Feature Plan

## Overview

This document outlines the plan for implementing Import/Export functionality for **Fillups** (scoped to a single Car) in the JustFuel application.

## Goals

- **Scope**: Per-Car Import/Export of Fillups only.
- **User Flow**: User selects a car -> Settings (3 dots) -> Export/Import Fillups.
- **Conflict Resolution**: **Append Only**. We do NOT delete any existing records. Imported rows are added to the database. The user is responsible for manually deleting duplicates if they occur.
- **Format**: Unique JustFuel CSV format.

## Data Structures

### CSV Format

**Required Header Row:** `date,fuel_amount,total_price,odometer,distance` (flexible order, case-insensitive).
**Export Only Columns**: `price_per_liter`, `fuel_consumption`.
**Filenaming**: `justfuel_[car_name]_[yyyy-mm-dd].csv`
**Date Format**: `DD.MM.YYYY` (Strict enforcement).

**Column Logic**:

- `date`: Required.
- `fuel_amount`: Required.
- `total_price`: Required.
- `price_per_liter`: Ignored on import. Calculated/Included on export.
- `odometer` / `distance`:
  - If Car Preference = **Odometer**:
    - `odometer` is **MANDATORY**. Missing odometer = Validation Error.
  - If Car Preference = **Distance**:
    - `distance` is **MANDATORY**. Missing distance = Validation Error.

## Implementation Strategy

### 1. Shared Logic (`packages/shared/src/import-export`)

- **Dependencies**: `papaparse`, `date-fns`.
- **Modules**:
  - `types.ts`: CSV Row interface.
  - `parser.ts`: Parse CSV.
  - `validator.ts`: Check logic based on Car Preference (Strict Rules).
  - `processor.ts`: Prepare "Insert" list.

### 2. Mobile Implementation

- **UI**: ActionSheet or Menu in Car Details -> "Export CSV", "Import CSV".
- **Export**: Query SQLite -> Generate CSV -> `Sharing.shareAsync`.
- **Import**:
  - `DocumentPicker` -> Read file.
  - Run Shared Parser/Validator.
  - **Preview Modal**:
    - "Ready to import 15 fillups."
    - Note: "New entries will be added to your history."
  - Confirm -> Execute SQLite Transaction (Insert all).

### 3. Web Implementation

- **UI**: Menu in Car Details (Header).
- **Export**: Browser download.
- **Import**:
  - File Input -> Parse.
  - **Preview Modal**: Same logic.
  - **API**:
    - `POST /api/cars/{carId}/import`.
    - Backend inserts all records.

## Workflow Details

1.  **Duplicate/Overwrite Logic (Append Only)**
    - No deletion of existing records.
    - All valid rows from the CSV are inserted as new fillups.
    - _User Responsibility_: User handles duplicate cleanup manually in the app list view.

2.  **Validation Rules**
    - If **Any** row is invalid -> Block Import.
    - **Config Mismatch Errors**:
      - Car `odometer` + missing `odometer` = Error.
      - Car `distance` + missing `distance` = Error.
