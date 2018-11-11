'use strict'

const child = require('../child.js')
const exec = require('child_process').exec
const path = require('path')
const test = require('tap').test

const NPX_BIN = child.escapeArg(path.join(__dirname, 'util', 'npx-bin.js'))

test('not called with option', (t) =>
  exec(`node ${NPX_BIN}`, (err, stdout, stderr) => {
    t.equal(err.code, 1)
    t.notOk(stdout)
    t.match(stderr, /--shell-auto-fallback/g)
    t.end()
  })
)

test('detect: SHELL ~= fish', (t) =>
  exec(`node ${NPX_BIN} --shell-auto-fallback`, {
    env: {
      SHELL: '/usr/bin/fish'
    }
  }, (err, stdout, stderr) => {
    if (err) { throw err }
    if (stderr) t.comment('stderr: %s', stderr);
    t.match(stdout, /function __fish_command_not_found/)
    t.notOk(stderr)
    t.end()
  })
)

test('detect: SHELL ~= bash', (t) =>
  exec(`node ${NPX_BIN} --shell-auto-fallback`, {
    env: {
      SHELL: '/bin/bash'
    }
  }, (err, stdout, stderr) => {
    if (err) { throw err }
    if (stderr) t.comment('stderr: %s', stderr);
    t.match(stdout, /command_not_found_handle\(/)
    t.notOk(stderr)
    t.end()
  })
)

test('detect: SHELL ~= zsh', (t) =>
  exec(`node ${NPX_BIN} --shell-auto-fallback`, {
    env: {
      SHELL: '/usr/local/bin/zsh'
    }
  }, (err, stdout, stderr) => {
    if (err) { throw err }
    if (stderr) t.comment('stderr: %s', stderr);
    t.match(stdout, /command_not_found_handler\(/)
    t.notOk(stderr)
    t.end()
  })
)

test('detect: no SHELL', (t) =>
  exec(`node ${NPX_BIN} --shell-auto-fallback`, {
    env: {}
  }, (err, stdout, stderr) => {
    t.equal(err.code, 1)
    t.notOk(stdout)
    t.match(stderr, /Only .+ shells are supported :\(/)
    t.end()
  })
)

test('detect: SHELL ~= unsupported', (t) =>
  exec(`node ${NPX_BIN} --shell-auto-fallback`, {
    env: {
      SHELL: '/sbin/nope'
    }
  }, (err, stdout, stderr) => {
    t.equal(err.code, 1)
    t.notOk(stdout)
    t.match(stderr, /Only .+ shells are supported :\(/)
    t.end()
  })
)

test('given: fish', (t) =>
  exec(`node ${NPX_BIN} --shell-auto-fallback fish`, (err, stdout, stderr) => {
    if (err) { throw err }
    if (stderr) t.comment('stderr: %s', stderr);
    t.match(stdout, /function __fish_command_not_found/)
    t.notOk(stderr)
    t.end()
  })
)

test('given: bash', (t) =>
  exec(`node ${NPX_BIN} --shell-auto-fallback bash`, (err, stdout, stderr) => {
    if (err) { throw err }
    if (stderr) t.comment('stderr: %s', stderr);
    t.match(stdout, /command_not_found_handle\(/)
    t.notOk(stderr)
    t.end()
  })
)

test('given: zsh', (t) =>
  exec(`node ${NPX_BIN} --shell-auto-fallback zsh`, (err, stdout, stderr) => {
    if (err) { throw err }
    if (stderr) t.comment('stderr: %s', stderr);
    t.match(stdout, /command_not_found_handler\(/)
    t.notOk(stderr)
    t.end()
  })
)

test('given: unsupported', (t) =>
  exec(`node ${NPX_BIN} --shell-auto-fallback nope`, (err, stdout, stderr) => {
    t.equal(err.code, 1)
    t.notOk(stdout)
    t.match(stderr, /Invalid values:\s+Argument: shell-auto-fallback/)
    t.end()
  })
)
