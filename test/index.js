'use strict'

const Buffer = require('safe-buffer').Buffer

const child = require('../child.js')
const path = require('path')
const requireInject = require('require-inject')
const test = require('tap').test

const main = require('../index.js')

const NPX_PATH = path.resolve(__dirname, 'util', 'npx-bin.js')
let NPM_PATH = path.resolve(__dirname, '..', 'node_modules', '.bin', 'npm')
if (process.platform === 'win32') {
  NPM_PATH += '.CMD'
}

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
    t.ok(res.stdout.trim(), 'got output from command')
  })
})

test('execCommand unit', t => {
  let whichBin = path.resolve(
    __dirname, '..', 'node_modules', '.bin', 'which'
  )
  if (process.platform === 'win32') {
    whichBin += '.CMD'
  }
  return main._execCommand(null, {
    command: path.resolve(__dirname, '..', 'README.md')
  }).then(res => {
    if (process.platform === 'win32') {
      t.equal(res.code, 0, 'cmd.exe opened the file via its associated executable and returned success')
    } else {
      throw new Error('should not have succeeded')
    }
  }, err => {
    t.equal(
      typeof err.code, 'string', 'get a regular crash when the arg is invalid'
    )
  }).then(() => {
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
      },
      escapeArg (arg) {
        return arg
      }
    }
  })._installPackages
  return installPkgs(['installme@latest', 'file:foo'], 'myprefix', {
    npm: NPM_PATH
  }).then(deets => {
    t.equal(deets[0], NPM_PATH, 'spawn got the right path to npm')
    t.deepEqual(deets[1], [
      'install', 'installme@latest', 'file:foo',
      '--global',
      '--prefix', 'myprefix',
      '--loglevel', 'error',
      '--json'
    ], 'args to spawn were correct for installing requested package')
    t.deepEqual(deets[2].stdio, [0, 'pipe', 2], 'default stdio settings correct')
    return installPkgs(['fail'], 'myprefix', {
      npm: NPM_PATH
    }).then(() => {
      throw new Error('should not have succeeded')
    }, err => {
      t.equal(err.message, 'fail', 'non-process failure reported intact')
    })
  }).then(() => {
    return installPkgs(['codefail'], 'myprefix', {
      npm: NPM_PATH
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
  return main._getEnv({npm: NPM_PATH}).then(env => {
    t.ok(env, 'got the env')
    t.equal(env.npm_package_name, 'libnpx', 'env has run-script vars')
  })
})

test('getNpmCache', t => {
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
  return getCache({npm: NPM_PATH}).then(cache => {
    t.equal(cache, `${NPM_PATH} config get cache --parseable`, 'requests cache from npm')
    return getCache({npm: NPM_PATH, userconfig})
  }).then(cache => {
    t.equal(
      cache,
      `${NPM_PATH} config get cache --parseable --userconfig ${
        userconfig
      }-escaped-as-path-true`,
      'added userconfig if option present'
    )
  })
})

test('findNodeScript', t => {
  return main._findNodeScript(NPX_PATH).then(script => {
    if (process.platform === 'win32') {
      t.notOk(script, 'win32 never detects Node scripts like this')
    } else {
      t.equal(script, NPX_PATH, 'existing returned as-is on *nix')
    }
    return main._findNodeScript(__filename).then(script => {
      t.notOk(script, 'files that are not standalone node scripts are false')
    })
  }).then(() => {
    return main._findNodeScript(null).then(bool => {
      t.notOk(bool, 'no node script found if existing is null')
    })
  }).then(() => {
    return main._findNodeScript(NPX_PATH, {isLocal: true}).then(script => {
      t.equal(script, NPX_PATH, 'resolved dir dep to index.js')
    })
  }).then(() => {
    const findScript = requireInject('../index.js', {
      fs: {
        stat (file, cb) {
          cb(null, {
            isDirectory () { return !file.indexOf('./') }
          })
        },
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
    return findScript('fail').then(f => {
      if (process.platform === 'win32') {
        t.notOk(f, 'win32 gives no fucks')
      } else {
        throw new Error('should have failed')
      }
    }, err => {
      t.equal(err.message, 'fail', 'close error rethrown')
    })
  })
})
