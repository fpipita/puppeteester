# Puppeteester example

This example shows how you would use this package to quickly test a real world application.

## System requirements

In order to run this example, you'll need:

- `docker-compose` supporting compose file version `3`;
- `docker`;
- `node` version `12` or above;

## Running the example

Open a terminal and point it to the `example` folder.

Run `yarn` to install the app's dependencies as you'd do for your own app.

Run `docker-compose run --service-ports --rm test` to start the test runner.

The test runner will load the specs from any `.spec.js` files located under the `src/` folder, run them and report the results in the terminal.

Any time changes are detected in the `src/` folder, a new test run is automatically scheduled.

## Debugging your tests

You have two options:

1. Point your browser to `http://localhost:40000` and inspect the page through its development tools.
2. If you are a Chrome user, a better option is to connect to the Chrome instance managed by Puppeteer through the remote debugging protocol. You can do it by visiting the `chrome://inspect` url and by adding the host `127.0.0.1:9222` to the target discovery servers list. After doing so, you will get two new targets showing up in the remote target list, the one to inspect is the tab whose address is `http://localhost:3000/`.
