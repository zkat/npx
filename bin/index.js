#!/usr/bin/env node

const npx = require('libnpx')
const path = require('path')

const NPM_PATH = path.join(__dirname, 'node_modules', '.bin', 'npm')

npx(npx.parseArgs(process.argv, NPM_PATH))
