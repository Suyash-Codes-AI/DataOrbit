# DataOrbit

DataOrbit is an AI-powered data intelligence platform for exploring databases, CSV files, API-backed data sources, and document knowledge through a unified workspace.

[Live Demo](https://dataorbitt.netlify.app) · [GitHub Repository](https://github.com/Suyash-Codes-AI/DataOrbit)

## What DataOrbit Does

DataOrbit helps analysts and teams turn connected data into understandable insights without switching between multiple tools. Users can inspect data sources, ask questions in natural language, generate visualizations, and preserve useful queries for later use.

The platform supports:

- Database schema and metadata exploration
- CSV upload, parsing, and analysis
- Document and knowledge-base exploration
- Natural-language questions over connected data
- AI-assisted insights through Google Gemini
- Charts and visual analysis
- Saved queries and query history
- Dashboard monitoring for data health and activity
- Role-aware analyst and administrator experiences

## User Flow

The following flow describes the primary journey through DataOrbit:

```text
+------------------+
| Open DataOrbit   |
+--------+---------+
         |
         v
+------------------+
| View Dashboard   |
| Stats and health |
+--------+---------+
         |
         v
+-------------------------------+
| Select or connect a data source|
+---------------+---------------+
                |
       +--------+--------+----------------+
       |                 |                |
       v                 v                v
+-------------+   +-------------+  +-------------+
| Database    |   | CSV file    |  | Documents   |
| Explorer    |   | Upload      |  | and RAG     |
+------+------+   +------+------+  +------+------+ 
       |                 |                |
       +-----------------+----------------+
                         |
                         v
              +----------------------+
              | Analyst Workspace    |
              | Ask a natural-language|
              | question              |
              +----------+-----------+
                         |
                         v
              +----------------------+
              | Gemini analysis and  |
              | deterministic data   |
              | processing            |
              +----------+-----------+
                         |
             +-----------+------------+
             |                        |
             v                        v
     +---------------+        +---------------+
     | AI insights   |        | Visualizations|
     | and answers   |        | and charts    |
     +-------+-------+        +-------+-------+
             |                        |
             +-----------+------------+
                         |
                         v
              +----------------------+
              | Save query, review   |
              | history, and share   |
              | findings              |
              +----------------------+
```

## How the Application Works

1. A user opens the dashboard and reviews system status, data statistics, and recent activity.
2. The user selects a database, uploads a CSV file, or accesses document knowledge.
3. DataOrbit prepares the source using its database, CSV, deterministic processing, or retrieval services.
4. The user asks a question from the analyst workspace using natural language.
5. The backend combines application logic, relevant data, and Gemini capabilities to produce an answer.
6. The result can be reviewed as text, explored through visualizations, and saved in query history.

## Architecture

```text
+--------------------------------------------------+
| React Frontend                                   |
| Vite, TypeScript, Tailwind CSS                   |
| Dashboard | Analyst | Database | CSV | Documents |
+-------------------------+------------------------+
                          | HTTP / API
                          v
+--------------------------------------------------+
| Express Backend                                  |
| Routes | Security | Deterministic Processing     |
| Database Access | Agent Workflows | RAG Services |
+----------------------+---------------------------+
                       |
          +------------+-------------+
          |                          |
          v                          v
+------------------+          +------------------+
| PostgreSQL or    |          | Google Gemini   |
| PGLite data      |          | AI integration  |
| storage          |          | and insights    |
+------------------+          +--------+---------+
                                        |
                                        v
                              +------------------+
                              | Retrieval and   |
                              | agent workflows |
                              +------------------+
```

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19 | Component-based user interface |
| Build tool | Vite | Development server and production builds |
| Language | TypeScript | Type-safe application and server code |
| Styling | Tailwind CSS | Responsive interface styling |
| Backend | Express | API routes and server-side application logic |
| AI | Google Gemini through `@google/genai` | Natural-language analysis and insights |
| CSV processing | Papa Parse | Parsing and processing CSV datasets |
| Database support | PostgreSQL-compatible access and PGLite | Persistent and local data operations |
| Runtime | Node.js 18+ or Bun | Local development and production execution |

## Project Structure

```text
DataOrbit/
├── src/                  # Frontend React application
│   ├── components/       # Reusable UI components
│   ├── context/          # Theme and application state
│   ├── types/            # Shared TypeScript types
│   ├── views/            # Feature pages and screens
│   ├── App.tsx           # Main application orchestration
│   ├── index.css         # Global styles
│   └── main.tsx          # Frontend entry point
├── server/               # Backend services and logic
│   ├── agent/            # Agentic workflows
│   ├── db/               # Database access logic
│   ├── deterministic/    # Deterministic processing
│   ├── gemini/           # Gemini integration
│   ├── rag/              # Retrieval and knowledge flows
│   ├── routes/           # API route definitions
│   └── security/         # Security-related logic
├── .env.example          # Environment variable template
├── index.html            # Vite HTML entry
├── metadata.json         # Application metadata
├── package.json          # Scripts and dependencies
├── server.ts             # Express entry point
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── bun.lock              # Bun lockfile
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm or Bun package manager
- A valid Google Gemini API key

### Install dependencies

Using npm:

```bash
npm install
```

Using Bun:

```bash
bun install
```

### Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update the values in `.env`:

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | API key for Gemini-powered analysis |
| `GEMINI_MODEL` | Optional | Gemini model name configured by the application |
| `APP_URL` | Recommended | Public application URL, such as `https://dataorbitt.netlify.app` |
| `PORT` | Optional | Server port for local production mode |

### Run the application

Development mode:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Available Scripts

```bash
npm run dev      # Start the development server
npm run build    # Build the application for production
npm run preview  # Preview the production build locally
npm run start    # Start the Express production server
npm run lint     # Run TypeScript checks
npm run clean    # Remove build outputs
```

## Typical Usage

1. Launch DataOrbit.
2. Configure Gemini access.
3. Connect to a database, upload a CSV file, or open document knowledge.
4. Ask a natural-language question from the analyst view.
5. Review the answer and generated insights.
6. Create or inspect visualizations.
7. Save useful queries and revisit query history.
8. Use the dashboard to monitor data activity and health.

## Troubleshooting

### Gemini is not configured

- Confirm that `GEMINI_API_KEY` exists in `.env`.
- Verify that the configured model is available for the API key.
- Restart the development server after changing environment variables.

### Build issues

```bash
rm -rf node_modules package-lock.json
npm install
npm run lint
npm run build
```

### Server does not start

- Confirm that the configured port is available.
- Check that `.env` exists and is valid.
- Verify that all dependencies are installed.
- Review the server output for missing runtime configuration.

## Roadmap

Potential future improvements include:

- Stronger authentication and user management
- Role-based access control
- Additional database and API connectors
- Advanced export and sharing features
- More charting and analytical workflows
- Improved document ingestion and retrieval accuracy
- Production deployment templates

## License

This repository does not currently include a license file. Add an appropriate license before distributing the project publicly.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes with clear commit messages.
4. Run `npm run lint` and `npm run build`.
5. Open a pull request with a detailed description.

## Summary

DataOrbit combines data exploration, AI-assisted analysis, visualization, document retrieval, and query history in one workspace. It is built with React, Vite, TypeScript, Express, Tailwind CSS, Google Gemini, Papa Parse, PostgreSQL-compatible data access, and PGLite.

Visit the live application at [dataorbitt.netlify.app](https://dataorbitt.netlify.app).
