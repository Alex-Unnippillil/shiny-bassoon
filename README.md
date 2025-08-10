# Shiny Bassoon

Shiny Bassoon demonstrates a simple architecture combining a central store, a Web Worker based AI engine, and React components.

## Architecture
- **Store**: Application state lives in a central store so components can access shared data.
- **Worker-based AI**: Heavy AI logic runs inside a Web Worker (`src/worker.js`) to keep the UI responsive.
- **React components**: Components such as `src/WorkerComponent.js` interact with the store and post messages to the worker.

## Getting Started
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Run unit tests: `npm test`
4. Run end-to-end tests: `npm run e2e`

## Linting and Formatting
Run linters and formatters before committing code:
- Lint with ESLint: `npm run lint`
- Format with Prettier: `npm run format`

## Contribution Guidelines
- Create a feature branch for your work.
- Ensure linting and tests pass before submitting.
- Open a pull request with a clear description of your changes.

