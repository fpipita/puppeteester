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

## Debugging the example

Debugging is as easy as pointing your browser to `http://localhost:40000` and opening the dev tools.
