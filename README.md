# puppeteester [![Build Status](https://travis-ci.com/fpipita/puppeteester.svg?branch=master)](https://travis-ci.com/fpipita/puppeteester)

Run client side tests within a headless Chrome instance.

### TODO

- [ ] docs: add puppeteester documentation
- [x] docs: add docker-compose example usage
- [x] chore: don't inject Chai into the test webpage environment
- [x] feat: add the possibility to set Mocha's ui option
- [x] build: add versioning hooks
- [x] build: add conventional changelog
- [x] feat: provide watch and single run modes
- [ ] feat: use a single volume for both client side node_modules and source code and use some kind of mechanism to exclude/include folders containing the tests to run
- [ ] feat: handle exceptions
- [x] feat: expose headless Chrome debugging port to host
- [ ] fix: don't schedule new test run on atime events (if any)
- [x] feat: add possibility to set Chrome's default viewport
- [ ] feat: add possibility to set Chrome's timeout
- [ ] feat: add code coverage support
- [x] perf: find a more efficient way to detect test completion
- [ ] feat: add a way to load styles (to test layouts)
