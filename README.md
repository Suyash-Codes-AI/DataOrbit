# DataOrbit

DataOrbit is an enterprise-style data intelligence and visualization platform that brings together relational databases, CSV extracts, API sources, and document knowledge with AI-assisted analytics. The app combines a React frontend with an Express API layer and AI-powered querying workflows to help users explore, analyze, and visualize data.

## Features

- Multi-source data workspace for databases, CSV files, and document knowledge
- AI-powered analyst workflow for natural-language queries
- Visualization studio for charting and insight exploration
- Query history and saved query tracking
- Database health and metadata monitoring
- Role-aware data experience for analyst and admin workflows
- Express backend with API endpoints for health, database stats, and query lifecycle

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- AI: Google Gemini via `@google/genai`
- Database: PostgreSQL-compatible access layer with PGLite support
- Styling: Tailwind CSS

## Project Structure

- `src/` – React app and views
- `server/` – backend services, routes, AI integrations, and database logic
- `server.ts` – Express server entry point
- `vite.config.ts` – Vite configuration
- `.env.example` – environment variable template
- `metadata.json` – app metadata

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A configured Gemini API key

### 1) Install dependencies

```bash
npm install
```

Or with Bun:

```bash
bun install
```

### 2) Configure environment variables

Copy the example file and update the values:

```bash
cp .env.example .env
```

Then set:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional)
- `APP_URL`

### 3) Run the app

Start the frontend development server:

```bash
npm run dev
```

This runs Vite on port `3000`.

To run the production server locally:

```bash
npm run build
npm run start
```

## Available Scripts

```bash
npm run dev      # run Vite dev server on port 3000
npm run build    # build the frontend for production
npm run preview  # preview the production build
npm run start    # start the Express server
npm run lint     # run TypeScript checks
npm run clean    # remove dist and generated server file
```

## Environment Notes

The project expects a Gemini API configuration for AI-backed analytics. The provided `.env.example` file includes the required keys and default model configuration.

## License

This project does not currently include a license file. Add one if you plan to publish or distribute the code publicly.

## Notes

This repository appears to be an internal or prototype data intelligence app, so exact deployment behavior may depend on your local environment, database configuration, and Gemini access setup.
