# 💸 Finlight

Simple budgetting app built with Next.js.

## 🏎️ Get started

Install dependencies:

- [Docker](https://www.docker.com/)
- node (ideally via [fnm](https://github.com/Schniz/fnm))
- `yarn`

Set up your local environment variables.

```
cp .env.sample .env
```

Spin up infrastructure dependencies locally.

```
yarn docker:up
```

Start the development server.

```
yarn dev
```

Run all tests, only unit tests or only integration tests.

```
yarn test
yarn test:unit
yarn test:integration
```

Run tests in watch mode and break stuff!

```
yarn test:unit --watch
```

The local development database is persisted locally in the `database` folder.
