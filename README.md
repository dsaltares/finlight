# 💸 Budget app

Simple budgetting app built with Next.js.

## 🏎️ Get started

Install dependencies:

- [Docker](https://www.docker.com/)
- node (ideally via [fnm](https://github.com/Schniz/fnm))

Create a new Next.js project using this starter template. You can use either `yarn` or `npm`.

```
yarn create next-app --example https://github.com/dsaltares/next-starter <your_app_name>
```

```
npx create-next-app --example https://github.com/dsaltares/next-starter <your_app_name>
```

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

## ✍️ Contributing

Please understand this is my personal Next.js starter template. Although I welcome issues and PRs with suggestions, I may reject them if they do not match the technologies I use or my preferred workflows.

Please do not be offended nor surprised if your contribution is not accepted.

By all means, feel free to draw inspiration from this template for your own project setup.
