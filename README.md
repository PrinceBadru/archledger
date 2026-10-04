# ArchLedger

**ArchLedger** is a modern, interactive System Catalogue designed to help engineering teams visualize, track, and manage their system architecture. It serves as a single pane of glass for understanding how microservices, infrastructure, databases, and external APIs interconnect, while also keeping a historical log of Architecture Decision Records (ADRs).

---

## ✨ Features

- 🗺️ **Obsidian-Style Interactive Graph:** A fully interactive, drag-and-drop visual map of your entire system architecture. Zoom, pan, and freely explore components and their dependencies in real-time.
- 🧩 **Comprehensive Component Catalog:** Track all system components (e.g., API Gateways, Kafka Clusters, Core Services) with detailed metadata, tags, and lifecycle stages (Beta, Production, Deprecated).
- 🔗 **Dependency Mapping:** Understand the blast radius of changes by tracking upstream and downstream dependencies.
- 📜 **Architecture Decisions (ADRs):** Log and track historical architectural decisions directly alongside the components they affect, so your team always knows *why* a decision was made.
- 🛡️ **Security Events Tracking:** Monitor and catalog security events directly linked to specific infrastructure nodes.
- 📊 **Metrics & Costs Dashboard:** Built-in views to help measure and visualize operational metrics and infrastructure spending.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router)
- **Language:** TypeScript
- **Database & ORM:** PostgreSQL + [Prisma](https://www.prisma.io/)
- **Styling:** Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
- **Tooling:** [Flare Framework](https://flare-docs.codetotech.com) for rapid resource generation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- `pnpm` package manager
- Docker (for the local database container)

### 1. Environment Variables
Clone the repository and set up your environment variables by copying the example file:
```bash
cp .env.example .env
```
Ensure your `.env` contains valid credentials for `DATABASE_URL` and `BETTER_AUTH_SECRET`.

### 2. Database Setup
A local PostgreSQL database is required. If you're using Docker, you can spin up the required container:
```bash
docker run --name archledger-db -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d postgres
```
*(Make sure your `DATABASE_URL` in `.env` points to `postgresql://postgres:postgres@localhost:5433/archledger`)*

Apply the database migrations and seed the database with 1 year's worth of demo components, dependencies, and audit logs:
```bash
pnpm run db:migrate
pnpm run db:seed
```

### 3. Run the Development Server
Start the local Next.js development server:
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. You can sign into the dashboard using the seed demo account:
- **Email:** `demo@archledger.com`
- *(Use standard local authentication flow)*

---

## 📁 Key Commands

- `pnpm run dev` - Starts the local development server.
- `pnpm run build` - Builds the application for production.
- `pnpm run db:migrate` - Applies Prisma schema changes to the database.
- `pnpm run db:seed` - Populates the database with realistic demo architecture data.
- `pnpm run deploy` - Deploys the application directly to Vercel.

## 📚 Adding New Resources
If you define new data models using the Flare CLI (`flare gen resource`), you must run the following command to turn those new models inside `prisma/schema/resources.prisma` into active migrations:
```bash
pnpm run db:migrate
```

---
*Built with [Flare](https://flare-docs.codetotech.com).*
