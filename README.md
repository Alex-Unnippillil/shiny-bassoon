# Shiny Bassoon

Shiny Bassoon demonstrates a simple architecture combining a board store, a unified Web Worker‑based AI engine, and React components.

## Architecture
- **Board store**: The board state and orientation live in a dedicated store (`src/boardStore.js`) exposed through `BoardProvider`, `useBoardState`, and `useBoardActions`.
- **Worker-based AI**: Heavy AI logic runs inside a single Web Worker (`src/workers/engineWorker.ts`) accessed via helper utilities in `src/utils/ai.ts` to keep the UI responsive.
- **React components**: UI components communicate with the board store and can request moves from the worker.

## Board Store
`BoardProvider` wraps the app and provides hooks for interacting with the chessboard:

- `useBoardState` returns the current board layout and orientation.
- `useBoardActions` supplies `playerMove`, `aiMove`, and `flipOrientation` helpers.

The reducer‑based store centralises updates so the UI stays in sync.

## Getting Started
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`

## Linting, Testing, and Formatting
Run checks before committing code:

- Lint with ESLint: `npm run lint`
- Run unit tests: `npm test`
- Run end-to-end tests: `npm run e2e`
- Format with Prettier: `npm run format`

## Worker Development
The AI engine lives in `src/workers/engineWorker.ts`. Utility functions in `src/utils/ai.ts` create and communicate with the worker.

- Run `npm run dev` to rebuild the worker and app during development.
- Execute `npm test` to exercise worker logic through unit tests.

## Contribution Guidelines
- Create a feature branch for your work.
- Ensure linting and tests pass before submitting.
- Open a pull request with a clear description of your changes.

