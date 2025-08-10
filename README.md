# Shiny Bassoon

Shiny Bassoon is a small React application that demonstrates a worker-based AI chess opponent.

## Architecture

### Store
Game state such as board positions and player turns is kept in a central store so that the UI and AI remain in sync.

### Worker-based AI
A Web Worker performs the AI calculations off the main thread. The `worker.js` file defines the worker and `WorkerComponent` ensures it is created once and cleaned up when unmounted.

### React Components
React components render the chess board and handle user interactions. `WorkerComponent` shows how the worker hooks into the React tree.

## Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Unit Tests
```bash
npm test
```

### End-to-End Tests
```bash
npm run e2e
```

## Linting and Formatting
Use Prettier and ESLint to keep the codebase consistent.

```bash
npx prettier . --check
npx eslint .
```

Automatically format files:

```bash
npx prettier . --write
```

## Contributing
1. Fork the repository and create a feature branch.
2. Format your code and ensure all tests pass.
3. Open a pull request with a clear description of your changes.

