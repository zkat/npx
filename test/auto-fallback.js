'use strict'

const exec = require('child_process').exec
const test = require('tap').test

test('not called with option', (t) =>
  exec('node .', (err, stdout, stderr) => {
    t.equal(err.code, 1)
    t.notOk(stdout)
    t.match(stderr, /--shell-auto-fallback/)
    t.end()
  })
)

test('no-install: fish', t => {
  exec('node . --no-install --shell-auto-fallback fish', (err, stdout, stderr) => {
    if (err) { throw err }
    t.match(stdout, /--no-install/i)
    t.notOk(stderr)
    t.end()
  })
})

test('no-install: bash', t => {
  exec('node . --no-install --shell-auto-fallback bash', (err, stdout, stderr) => {
    if (err) { throw err }
    t.match(stdout, /--no-install/i)
    t.notOk(stderr)
    t.end()
  })
})

test('no-install: zsh', t => {
  exec('node . --no-install --shell-auto-fallback zsh', (err, stdout, stderr) => {
    if (err) { throw err }
    t.match(stdout, /--no-install/i)
    t.notOk(stderr)
    t.end()
  })
})

test('detect: SHELL ~= fish', (t) =>
  exec('node . --shell-auto-fallback', {
    env: {
      SHELL: '/usr/bin/fish'
    }
  }, (err, stdout, stderr) => {
    if (err) { throw err }
    t.match(stdout, /function __fish_command_not_found/)
    t.notMatch(stdout, /--no-install/i)
    t.notOk(stderr)
    t.end()
  })
)

test('detect: SHELL ~= bash', (t) =>
  exec('node . --shell-auto-fallback', {
    env: {
      SHELL: '/bin/bash'
    }
  }, (err, stdout, stderr) => {
    if (err) { throw err }
    t.match(stdout, /command_not_found_handle\(/)
    t.notMatch(stdout, /--no-install/i)
    t.notOk(stderr)
    t.end()
  })
)

test('detect: SHELL ~= zsh', (t) =>
  exec('node . --shell-auto-fallback', {
    env: {
      SHELL: '/usr/local/bin/zsh'
    }
  }, (err, stdout, stderr) => {
    if (err) { throw err }
    t.match(stdout, /command_not_found_handler\(/)
    t.notMatch(stdout, /--no-install/i)
    t.notOk(stderr)
    t.end()
  })
)

test('detect: no SHELL', (t) =>
  exec('node . --shell-auto-fallback', {
    env: {}
  }, (err, stdout, stderr) => {
    t.equal(err.code, 1)
    t.notOk(stdout)
    t.match(stderr, /Only .+ shells are supported :\(/)
    t.end()
  })
)

test('detect: SHELL ~= unsupported', (t) =>
  exec('node . --shell-auto-fallback', {
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
  exec('node . --shell-auto-fallback fish', (err, stdout, stderr) => {
    if (err) { throw err }
    t.match(stdout, /function __fish_command_not_found/)
    t.notMatch(stdout, /--no-install/i)
    t.notOk(stderr)
    t.end()
  })
)

test('given: bash', (t) =>
  exec('node . --shell-auto-fallback bash', (err, stdout, stderr) => {
    if (err) { throw err }
    t.match(stdout, /command_not_found_handle\(/)
    t.notMatch(stdout, /--no-install/i)
    t.notOk(stderr)
    t.end()
  })
)

test('given: zsh', (t) =>
  exec('node . --shell-auto-fallback zsh', (err, stdout, stderr) => {
    if (err) { throw err }
    t.match(stdout, /command_not_found_handler\(/)
    t.notMatch(stdout, /--no-install/i)
    t.notOk(stderr)
    t.end()
  })
)

test('given: unsupported', (t) =>
  exec('node . --shell-auto-fallback nope', (err, stdout, stderr) => {
    t.equal(err.code, 1)
    t.notOk(stdout)
    t.match(stderr, /Invalid values:\s+Argument: shell-auto-fallback/)
    t.end()
  })
)
