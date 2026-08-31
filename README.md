# nabu-web-page-core

Nabu web page core module.

## Tests

Tests are written with [Jest](https://jestjs.io/).

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or 20.x
- npm

### Running tests

Install dependencies (once):

```bash
npm install
```

Run all tests:

```bash
npm test
```

Run tests in watch mode (re-run on file changes):

```bash
npm run test:watch
```

### Test location

Tests live next to the code they cover, in `__tests__` directories:

- `v2/component/public/bundled/services/__tests__/Formatter.test.js` — tests for the Formatter service (including the `duration` method)

### CI

Tests run automatically on every push and pull request via [GitHub Actions](.github/workflows/test.yml).
