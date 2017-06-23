'use strict'

const Buffer = require('safe-buffer').Buffer

const child = require('../child.js')
const path = require('path')
const requireInject = require('require-inject')
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

test('execCommand unit', t => {
  const whichBin = path.resolve(
    __dirname, '..', 'node_modules', '.bin', 'which'
  )
  return main._execCommand(null, {
    command: path.resolve(__dirname, '..', 'README.md')
  }).then(() => {
    throw new Error('should not have succeeded')
  }, err => {
    t.equal(err.code, 'EACCES', 'get a regular crash when the arg is invalid')
    const oldCode = process.exitCode
    delete process.exitCode
    return main._execCommand(null, {
      stdio: 'pipe',
      command: whichBin
    }).then(() => {
      t.equal(process.exitCode, 1, 'set code without crashing, on cmd fail')
      process.exitCode = oldCode
    })
  })
})

test('installPackages unit', t => {
  const installPkgs = requireInject('../index.js', {
    '../child.js': {
      spawn (npmPath, args) {
        if (args[1] === 'fail') {
          return Promise.reject(new Error('fail'))
        } else if (args[1] === 'codefail') {
          const err = new Error('npm failed')
          err.exitCode = 123
          return Promise.reject(err)
        } else {
          return Promise.resolve({
            stdout: JSON.stringify([].slice.call(arguments))
          })
        }
      }
    }
  })._installPackages
  const npxPath = path.resolve(__dirname, '..')
  const npmPath = path.join(npxPath, 'node_modules', '.bin', 'npm')
  return installPkgs(['installme@latest', 'file:foo'], 'myprefix', {
    npm: npmPath
  }).then(deets => {
    t.equal(deets[0], npmPath, 'spawn got the right path to npm')
    t.deepEqual(deets[1], [
      'install', 'installme@latest', 'file:foo',
      '--global',
      '--prefix', 'myprefix',
      '--loglevel', 'error',
      '--json'
    ], 'args to spawn were correct for installing requested package')
    t.deepEqual(deets[2].stdio, [0, 'pipe', 2], 'default stdio settings correct')
    return installPkgs(['fail'], 'myprefix', {
      npm: npmPath
    }).then(() => {
      throw new Error('should not have succeeded')
    }, err => {
      t.equal(err.message, 'fail', 'non-process failure reported intact')
    })
  }).then(() => {
    return installPkgs(['codefail'], 'myprefix', {
      npm: npmPath
    }).then(() => {
      throw new Error('should not have succeeded')
    }, err => {
      t.match(
        err.message,
        /Install for codefail failed with code 123/,
        'npm install failure has helpful error message'
      )
      t.equal(err.exitCode, 123, 'error has exitCode')
    })
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
  const userconfig = 'blah'
  const getCache = requireInject('../index.js', {
    '../child.js': {
      exec (cmd, args) {
        return Promise.resolve(`${cmd} ${args.join(' ')}\n`)
      },
      escapeArg (arg, asPath) {
        return `${arg}-escaped-as-path-${asPath}`
      }
    }
  })._getNpmCache
  return getCache({npm}).then(cache => {
    t.equal(cache, `${npm} config get cache`, 'requests cache from npm')
    return getCache({npm, userconfig})
  }).then(cache => {
    t.equal(
      cache,
      `${npm} config get cache --userconfig ${
        userconfig
      }-escaped-as-path-true`,
      'added userconfig if option present'
    )
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
  }).then(() => {
    return main._findNodeScript(null).then(bool => {
      t.notOk(bool, 'no node script found if existing is null')
    })
  }).then(() => {
    const findScript = requireInject('../index.js', {
      fs: {
        open (file, perm, cb) {
          cb(null, file)
        },
        read (fd, buf, offset, length, position, cb) {
          if (fd === 'fail') {
            cb(new Error('fail'))
          } else {
            Buffer.from(fd).copy(buf)
            cb(null)
          }
        },
        close (fd, cb) {
          cb()
        }
      }
    })._findNodeScript
    return findScript('fail').then(() => {
      throw new Error('should have failed')
    }, err => {
      t.equal(err.message, 'fail', 'close error rethrown')
    })
  })
})
