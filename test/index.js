'use strict'

const child = require('../child.js')
const path = require('path')
const test = require('tap').test

const main = require('../index.js')

const NPX_PATH = path.resolve(__dirname, '..')

test('npx --shell-auto-fallback', t => {
  return child.spawn('node', [
    NPX_PATH, '--shell-auto-fallback', 'zsh'
  ], {stdio: 'pipe'}).then(res => {
    t.equal(res.code, 0, 'command succeeded')
    t.match(
      res.stdout, /command_not_found_handler\(\)/, 'got shell code in output'
    )
  })
})

test('npx no command', t => {
  return child.spawn('node', [
    NPX_PATH
  ], {stdio: 'pipe'}).then(res => {
    throw new Error('Should not have succeeded')
  }, err => {
    t.equal(err.exitCode, 1, 'got 1 as exit code')
    t.match(
      err.stderr,
      /ERROR: You must supply a command/,
      'got a useful error message'
    )
    t.match(err.stderr, /Execute binaries from npm/, 'npx help printed')
  })
})

test('npx existing subcommand', t => {
  return child.spawn('node', [
    NPX_PATH, 'which', 'npm'
  ], {stdio: 'pipe'}).then(res => {
    t.notOk(res.stderr, 'no stderr output')
    t.equal(
      res.stdout.trim(),
      path.resolve(NPX_PATH, 'node_modules', '.bin', 'npm'),
      'got the local npm binary'
    )
  })
})

test('getEnv', t => {
  const npm = path.resolve(__dirname, '..', 'node_modules', '.bin', 'npm')
  return main._getEnv({npm}).then(env => {
    t.ok(env, 'got the env')
    t.equal(env.npm_package_name, 'npx', 'env has run-script vars')
  })
})

test('getNpmCache', t => {
  const npm = path.resolve(__dirname, '..', 'node_modules', '.bin', 'npm')
  const currCache = process.env.npm_config_cache
  process.env.npm_config_cache = './mycacheishere'
  return main._getNpmCache({npm}).then(cache => {
    process.env.npm_config_cache = currCache
    t.equal(cache, path.resolve('./mycacheishere'))
  })
})

test('findNodeScript', t => {
  const scriptPath = path.resolve(__dirname, '..', 'index.js')
  return main._findNodeScript(scriptPath).then(script => {
    if (process.platform === 'win32') {
      t.notOk(script, 'win32 never detects Node scripts like this')
    } else {
      t.equal(script, scriptPath, 'existing returned as-is on *nix')
    }
    return main._findNodeScript(__filename).then(script => {
      t.notOk(script, 'files that are not standalone node scripts are false')
    })
  })
})
