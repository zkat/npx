'use strict'

const test = require('tap').test

const child = require('../child.js')
const requireInject = require('require-inject')

test('escapeArg on *nix', t => {
  const origPlatform = process.platform
  Object.defineProperty(process, 'platform', {value: 'linux'})
  t.equal(child.escapeArg('foo'), 'foo', 'standard arg left intact')
  t.equal(child.escapeArg('foo bar'), '\'foo bar\'', '\'-escaped on *nix')
  t.equal(
    child.escapeArg('/foo bar/baz\'quux.JPg', true),
    '\'/foo bar/baz\'"\'"\'quux.JPg\'',
    'paths escaped as usual'
  )
  Object.defineProperty(process, 'platform', {value: origPlatform})
  t.done()
})

test('escapeArg on win32', t => {
  const origPlatform = process.platform
  Object.defineProperty(process, 'platform', {value: 'win32'})
  t.equal(child.escapeArg('foo'), '"foo"', 'standard arg escaped')
  t.equal(child.escapeArg('foo bar'), '"foo bar"', '"-escaped on win32')
  t.equal(
    child.escapeArg('C:\\Foo bar\\baz\'"\\quux.JPg', true),
    'C:\\"Foo bar"\\baz\'"\\quux.JPg',
    'paths escaped as usual'
  )
  Object.defineProperty(process, 'platform', {value: origPlatform})
  t.done()
})

test('exec', t => {
  const child = requireInject('../child.js', {
    'child_process': {
      exec (cmd, opts, cb) {
        if (opts.fail) {
          cb(new Error('exec failure requested'))
        } else {
          cb(null, {cmd, opts})
        }
      }
    }
  })
  const origPlatform = process.platform
  return child.exec('cmd', ['arg1', 'arg2'], {opt: 1}).then(ret => {
    t.equal(ret.cmd, 'cmd arg1 arg2', 'command string concatenated')
    t.deepEqual(ret.opts, {opt: 1}, 'options received!')
    Object.defineProperty(process, 'platform', {value: 'linux'})
    return child.exec('/foo bar/baz .quux\\', ['arg1', 'arg 2'])
  }).then(ret => {
    t.equal(ret.cmd, "'/foo bar/baz .quux\\' arg1 arg 2", 'unix-style escapes')
    Object.defineProperty(process, 'platform', {value: 'win32'})
    return child.exec('C:\\foo bar\\baz .quux\\a', ['arg1', 'arg 2'])
  }).then(ret => {
    t.equal(ret.cmd, 'C:\\"foo bar"\\"baz .quux"\\a arg1 arg 2', 'win32-style escapes')
    Object.defineProperty(process, 'platform', {value: origPlatform})
  }).then(() => {
    return child.exec('fail', [], {fail: true}).then(() => {
      throw new Error('was supposed to fail')
    }, err => {
      t.equal(err.message, 'exec failure requested', 'got error')
    })
  })
})

test('exec (integration)', t => {
  return child.exec('node', ['-p', '1+1']).then(stdout => {
    t.equal(stdout.trim(), '2', 'node ran successfully')
    return child.exec('node', ['-e', '"process.exit(123)"']).then(() => {
      throw new Error('was not supposed to succeed')
    }, err => {
      t.equal(err.exitCode, 123, 'got the exit code from subproc')
    })
  })
})

test('spawn', t => {
  return child.spawn('node', ['-p', '1+1']).then(res => {
    t.deepEqual(res, {
      code: 0,
      stdout: '2\n',
      stderr: ''
    })
    return child.spawn('node', ['-e', 'process.exit(123)']).then(() => {
      throw new Error('was not supposed to succeed')
    }, err => {
      t.equal(err.exitCode, 123, 'got the exit code from ')
    })
  })
})

test('runCommand with command arg', t => {
  return child.runCommand('node', {
    cmdOpts: ['-p', '1+1'],
    stdio: 'pipe'
  }).then(res => {
    t.deepEqual(res, {
      code: 0,
      stdout: '2\n',
      stderr: ''
    })
    return child.runCommand('node', {
      cmdOpts: ['-e', 'process.exit(123)']
    }).then(() => {
      throw new Error('was not supposed to succeed')
    }, err => {
      t.equal(err.exitCode, 123, 'got the exit code from subproc')
    })
  }).then(() => {
    return child.runCommand('./not-a-command-at-all', {
      stdio: 'pipe'
    }).then(() => {
      throw new Error('was not supposed to succeed')
    }, err => {
      if (process.platform === 'win32') {
        t.match(err.message, /Command failed/, 'error message reports failure')
        t.match(err.stderr, /not recognized as an internal or external command/, 'stderr reports command not found')
      } else {
        t.match(err.message, /command not found/, 'error message reports ENOENT')
        t.equal(err.exitCode, 127, '"not found" has code 127')
      }
    })
  })
})

test('runCommand with opts.command', t => {
  return child.runCommand(null, {
    command: 'node',
    cmdOpts: ['-p', '1+1'],
    stdio: 'pipe'
  }).then(res => {
    t.deepEqual(res, {
      code: 0,
      stdout: '2\n',
      stderr: ''
    })
  })
})

test('runCommand with opts.call and opts.shell', {
  skip: process.platform === 'win32' && 'Windows passes different flags to shell'
}, t => {
  return child.runCommand(null, {
    shell: 'node',
    call: './child.js',
    stdio: 'pipe'
  }).then(res => {
    t.deepEqual(res, {
      code: 0,
      stdout: '',
      stderr: ''
    })
  })
})
