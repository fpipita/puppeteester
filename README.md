# puppeteester [![Build Status](https://travis-ci.com/fpipita/puppeteester.svg?branch=master)](https://travis-ci.com/fpipita/puppeteester)

Run client side tests within a headless Chrome instance.

### TODO

- [ ] docs: add docker-compose example usage
- [ ] feat: use a websocket connection to live-reload the test page when source files change
- [x] chore: don't inject Chai into the test webpage environment
- [ ] feat: add the possibility to specify Mocha's interface (bdd, tdd, etc) through an environment variable or something
- [x] build: add versioning hooks
- [x] build: add conventional changelog
- [ ] feat: provide watch and single run modes
- [ ] feat: use a single volume for both client side node_modules and source code and use some kind of mechanism to exclude/include folders containing the tests to run
