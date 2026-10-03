# ArchLedger Walkthrough

Welcome to ArchLedger, your system architecture catalogue. This guide covers how to set up, run, and test the application.

## Prerequisites
- Node.js (v20+)
- `pnpm` package manager
- PostgreSQL (for local development)

## Getting Started

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgres://postgres:password@localhost:5432/archledger"
   BETTER_AUTH_SECRET="a-secure-random-string-for-auth"
   ```

3. **Initialize Database**
   Run the Prisma migrations to set up your schema and generate the client:
   ```bash
   pnpm db:migrate
   pnpm db:generate
   ```

4. **Seed the Database**
   Populate the database with sample components, decisions, and dependencies:
   ```bash
   pnpm db:seed
   ```

5. **Run the Development Server**
   Start the Next.js development server:
   ```bash
   pnpm dev
   ```
   Visit `http://localhost:3000` in your browser.

## Testing

The project uses Vitest for unit tests and Playwright for End-to-End tests.

- **Run Unit Tests**
  ```bash
  pnpm test
  ```

- **Run End-to-End Tests**
  ```bash
  pnpm e2e
  ```

- **Typecheck & Lint**
  ```bash
  pnpm typecheck
  pnpm lint
  ```

## Features

- **Dashboard**: View your system catalogue resources (Components, Decisions, Dependencies).
- **Architecture Graph**: Visualize the relationships between components at `/dashboard/graph`.
- **Health Metrics**: Check the automatically computed health scores of components at `/dashboard/metrics`.
- **Search**: Quickly find components using the search bar in the dashboard header.
- **ADR Export**: Export Architectural Decision Records (ADRs) as a Markdown bundle from `/api/export-adrs`.

Enjoy building and cataloguing with ArchLedger!
