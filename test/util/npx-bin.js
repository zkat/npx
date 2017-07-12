#!/usr/bin/env node

const npx = require('../../index.js')
const path = require('path')

const NPM_PATH = path.join(__dirname, '../..', 'node_modules', 'npm', 'bin', 'npm-cli.js')

npx(npx.parseArgs(process.argv, NPM_PATH))
