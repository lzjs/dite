#!/usr/bin/env node

require('v8-compile-cache')
require('@dite/cli')

require('../dist/bin/dite.js').run().catch((e) => {
  console.error(e)
})
