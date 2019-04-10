# Caffeine

[![Build Status](https://travis-ci.org/DD-DeCaF/caffeine-vue.svg?branch=devel)](https://travis-ci.org/DD-DeCaF/caffeine-vue)
[![DOI](https://zenodo.org/badge/137465781.svg)](https://zenodo.org/badge/latestdoi/137465781)

This is the frontend client for Caffeine, a state-of-the-art web platform with the goal to put model-guided and data-driven design into practice in industrial biotechnology.

For more information, see [dd-decaf.eu](http://dd-decaf.eu/) or visit the platform at [caffeine.dd-decaf.eu](https://caffeine.dd-decaf.eu/).

## Technology stack

* Frontend framework: [Vue](https://vuejs.org/)
* State management: [Vuex](https://vuex.vuejs.org/)
* Linting: [eslint](https://eslint.org/), [prettier](https://prettier.io/)
* Unit testing: [mocha](https://mochajs.org/) + [jsdom](https://github.com/jsdom/jsdom), assertion library is [chai](https://www.chaijs.com/) (see [vue-test-utils](https://vue-test-utils.vuejs.org/) for useful testing utilities)

## Project setup
`npm install`

### Development server
`npx vue-cli-service serve`

### Lint and fix files
`npx vue-cli-service lint`

### Run unit tests
`npx vue-cli-service test:unit`

### Run end-to-end tests
`npx vue-cli-service test:e2e`
