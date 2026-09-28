# DataOrbit

DataOrbit is an AI-powered data intelligence platform for exploring databases, CSVs, API-backed data sources, and document knowledge through a unified workspace. It combines a modern React frontend with an Express API layer and Gemini-powered analysis workflows to help users ask questions, investigate datasets, and generate visual insights faster.

## Overview

DataOrbit is designed for teams that need a single interface for:

- querying and understanding database schemas
- exploring CSV and structured data files
- working with document-based knowledge
- asking natural-language questions over connected data sources
- visualizing insights and tracking prior queries

The application includes a dashboard, analyst workflow, database explorer, visualization studio, document center, query history, and settings area.

## Key Features

- AI-assisted analyst workflow for natural-language questions
- Dashboard for system health, database stats, and recent activity
- Database explorer for schema and metadata inspection
- CSV intelligence workflow for uploaded and parsed datasets
- Visualization studio for chart-driven analysis
- Document center for knowledge-backed exploration
- Saved queries and historical query tracking
- Role-aware user experience with analyst/admin-style states
- Gemini integration for AI-powered insights

## Architecture

DataOrbit is composed of:

- Frontend: React + Vite + TypeScript
- UI styling: Tailwind CSS
- Backend: Express + TypeScript
- AI layer: Google Gemini via `@google/genai`
- Data access: database and CSV utilities, plus document-related services
- Storage: PostgreSQL-compatible data access combined with local app state

## Tech Stack

- React 19
- Vite
- TypeScript
- Express
- Tailwind CSS
- Google Gemini API
- Papa Parse for CSV processing
- PGLite support via `@electric-sql/pglite`

## Project Structure

```text
DataOrbit/
├── src/                  # Frontend React application
│   ├── components/       # Reusable UI components
│   ├── context/          # Theme and app state context
│   ├── types/            # Shared TypeScript types
│   ├── views/            # Feature pages and screens
│   ├── App.tsx           # Main app router and screen state
│   ├── index.css         # Global styles
│   └── main.tsx          # App entry point
├── server/               # Backend services and logic
│   ├── agent/            # Agentic workflows
│   ├── db/               # Database access logic
│   ├── deterministic/    # Deterministic processing / logic
│   ├── gemini/           # Gemini integrations
│   ├── rag/              # Retrieval and knowledge flow
│   ├── routes/           # API route definitions
│   ├── security/         # Security-related logic
│   └── ...
├── .env.example          # Environment variable template
├── index.html            # Vite HTML entry
├── metadata.json         # App metadata
├── package.json          # Scripts and dependencies
├── server.ts             # Express entry point
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite configuration
├── bun.lock              # Bun lockfile
├── README.md             # Project documentation
└── ...
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js 18+
- npm or Bun
- A valid Gemini API key

### 1) Install dependencies

Using npm:

```bash
npm install
```

Using Bun:

```bash
bun install
```

### 2) Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then update the values in `.env`:

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | API key used for Gemini-powered analysis |
| `GEMINI_MODEL` | Optional | Gemini model name, defaults to `gemini-3.8-flash` |
| `APP_URL` | Recommended | Public app URL used for callbacks and self-referential links |
| `PORT` | Optional | Server port for local production mode |

### 3) Run the app in development mode

```bash
npm run dev
```

This starts the Vite dev server and serves the app on port `3000`.

### 4) Build for production

```bash
npm run build
```

### 5) Start the production server

```bash
npm run start
```

This runs the Express server and serves the built frontend from the `dist` directory.

## Available Scripts

```bash
npm run dev      # Start the frontend dev server on port 3000
npm run build    # Build the app for production
npm run preview  # Preview the production build locally
npm run start    # Start the Express server
npm run lint     # Run TypeScript type checks
npm run clean    # Remove build outputs
```

## Typical Usage

1. Launch the app.
2. Configure Gemini access.
3. Connect or inspect a database source.
4. Upload or reference a CSV dataset.
5. Ask a natural-language query in the analyst view.
6. Explore charts and saved query history.
7. Use the dashboard to monitor data health and activity.

## Notes on Configuration

This project expects a working Gemini configuration for the AI-powered analytical experience. If the model is not configured correctly, AI-driven features may not function as expected.

## Troubleshooting

### Gemini not configured

- Check that `GEMINI_API_KEY` is set correctly in your environment file.
- Verify the model name in `GEMINI_MODEL`.
- Ensure your API key has the necessary permissions.

### Project build issues

- Reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

- Run type checks:

```bash
npm run lint
```

### Local server not starting

- Confirm ports are available.
- Check the `.env` values.
- Verify there are no missing runtime dependencies.

## Roadmap

Potential enhancements for future iterations include:

- stronger authentication and user management
- expanded connectors for more database systems
- richer export and sharing features
- more advanced charting and analytical workflows
- improved document ingestion and retrieval accuracy
- production deployment templates

## License

This repository does not currently include a license file. If you plan to distribute or publish the project publicly, add a license before release.

## Contributing

Contributions are welcome. A typical workflow is:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run validation checks
5. Submit a pull request with a clear description

## Summary

DataOrbit is a full-stack AI data intelligence workspace built to bring together data exploration, business analysis, visualization, and Gemini-powered decision support in one application.
