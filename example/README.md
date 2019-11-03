# Puppeteester example

This example shows how you would use this package to quickly test a real world application.

## System requirements

In order to run this example, you'll need `Chrome` installed and `Node` version `13` or above.

## Running the example

Open a terminal, point it to the `example` folder and run `yarn && yarn test`.

The test runner will load the specs from any `.spec.js` files located under the `src/` folder, run them and report the results in the terminal.

## Debugging your tests

Run `yarn debug`, then open Chrome, visit the `chrome://inspect` url and add the host `127.0.0.1:9222` to the target discovery servers list. Finally, inspect the `Puppeteester` target to debug your source code and specs.
