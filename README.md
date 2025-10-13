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
# SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Start the development server
npm run dev
```

Open `http://localhost:3000` in your browser to see the app.

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

## License

MIT
