'use strict'

const Buffer = require('safe-buffer').Buffer

const child = require('../child.js')
const path = require('path')
const requireInject = require('require-inject')
const test = require('tap').test

const main = require('../index.js')

const isWindows = process.platform === 'win32'

const NPX_PATH = path.resolve(__dirname, 'util', 'npx-bin.js')
const NPM_PATH = path.resolve(__dirname, '..', 'node_modules', 'npm', 'bin', 'npm-cli.js')

const NPX_ESC = isWindows ? child.escapeArg(NPX_PATH) : NPX_PATH

test('npx --always-spawn', t => {
  return child.spawn('node', [
    NPX_ESC, '--always-spawn', 'echo-cli', 'hewwo'
  ], {stdio: 'pipe'}).then(res => {
    t.equal(res.stdout.trim(), 'hewwo')
  })
})

test('npx --always-spawn resolves promise after command is executed', t => {
  const _runCommand = child.runCommand
  const parsed = main.parseArgs([
    process.argv[0],
    '[fake arg]',
    '--always-spawn',
    'echo-cli',
    'hewwo'
  ], NPM_PATH)
  child.runCommand = (command, opts) => {
    child.runCommand = _runCommand
    return Promise.resolve([command, opts])
  }
  return main(parsed)
    .then(args => {
      const command = args[0]
      const opts = args[1]
      t.ok(command.includes('node'), 'node executes the command')
      t.equal(opts.alwaysSpawn, true, 'set opts.alwaysSpawn')
      t.equal(opts.command, 'echo-cli', 'set opts.command')
      t.ok(opts.cmdOpts[0].includes('echo-cli'), 'set opts.cmdOpts[0]')
      t.equal(opts.cmdOpts[1], 'hewwo', 'set opts.cmdOpts[1]')
    })
})

test('npx --shell-auto-fallback', t => {
  return child.spawn('node', [
    NPX_ESC, '--shell-auto-fallback', 'zsh'
  ], {stdio: 'pipe'}).then(res => {
    t.equal(res.code, 0, 'command succeeded')
    t.match(
      res.stdout, /command_not_found_handler\(\)/, 'got shell code in output'
    )
  })
})

test('npx no command', t => {
  return child.spawn('node', [
    NPX_ESC
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

test('npx existing subcommand', {
  skip: isWindows && 'Windows fail this test when run via nyc, but not when run directly'
}, t => {
  return child.spawn('node', [
    NPX_ESC, 'which', 'npm'
  ], {stdio: 'pipe'}).then(res => {
    t.notOk(res.stderr, 'no stderr output')
    t.ok(res.stdout.trim(), 'got output from command')
  })
})

test('execCommand unit', {
  skip: isWindows && 'need a workaround for obnoxious auto-open of .md file on Windows'
}, t => {
  let whichBin = path.resolve(
    __dirname, '..', 'node_modules', '.bin', 'which'
  )
  if (isWindows) {
    whichBin += '.CMD'
  }
  return main._execCommand(null, {
    command: path.resolve(__dirname, '..', 'README.md')
  }).then(res => {
    if (isWindows) {
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
        if (args[2] === 'fail') {
          return Promise.reject(new Error('fail'))
        } else if (args[2] === 'codefail') {
          const err = new Error('npm failed')
          err.exitCode = 123
          return Promise.reject(err)
        } else if (args[2] === 'pathTest') {
          return Promise.resolve({
            stdout: JSON.stringify(npmPath)
          })
        } else {
          return Promise.resolve({
            stdout: JSON.stringify([].slice.call(arguments))
          })
        }
      },
      escapeArg (arg) {
        if (arg === '/f@ke_/path to/node') {
          return '\'/f@ke_/path to/node\''
        } else if (arg === 'C:\\f@ke_\\path to\\node') {
          return '"C:\\f@ke_\\path to\\node"'
        }
        return arg
      }
    }
  })._installPackages
  return installPkgs(['installme@latest', 'file:foo'], 'myprefix', {
    npm: NPM_PATH
  }).then(deets => {
    t.deepEqual(deets[1], [
      NPM_PATH,
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
  }).then(() => {
    const nodePath = process.argv[0]
    process.argv[0] = isWindows ? 'C:\\f@ke_\\path to\\node' : '/f@ke_/path to/node'
    return installPkgs(['pathTest'], 'myprefix', {
      npm: NPM_PATH
    }).then((npmPath) => {
      process.argv[0] = nodePath
      if (isWindows) {
        t.equal(npmPath, '"C:\\f@ke_\\path to\\node"', 'incorrectly escaped path win32')
      } else {
        t.equal(npmPath, '/f@ke_/path to/node', 'incorrectly escaped path *nix')
      }
    }, (e) => {
      process.argv[0] = nodePath
      throw new Error('should not have failed')
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
        return `${arg}-escaped-as-path-${!!asPath}`
      }
    }
  })._getNpmCache
  return getCache({npm: NPM_PATH}).then(cache => {
    t.equal(cache, `${process.argv[0]} ${NPM_PATH}-escaped-as-path-false config get cache --parseable`, 'requests cache from npm')
    return getCache({npm: NPM_PATH, userconfig})
  }).then(cache => {
    t.equal(
      cache,
      `${process.argv[0]} ${NPM_PATH}-escaped-as-path-false config get cache --parseable --userconfig ${
        userconfig
      }-escaped-as-path-true`,
      'added userconfig if option present'
    )
  })
})

test('findNodeScript', t => {
  return main._findNodeScript(NPX_PATH).then(script => {
    if (isWindows) {
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
      if (isWindows) {
        t.notOk(f, 'win32 gives no fucks')
      } else {
        throw new Error('should have failed')
      }
    }, err => {
      t.equal(err.message, 'fail', 'close error rethrown')
    })
  })
})

test('npx with custom installer stdio', t => {
  const NPX_PATH = path.resolve(__dirname, 'util', 'npx-bin-inherit-stdio.js')
  const NPX_ESC = isWindows ? child.escapeArg(NPX_PATH) : NPX_PATH

  return child.spawn('node', [
    NPX_ESC, 'say-shalom@1.2.7'
  ], {stdio: 'pipe'}).then(res => {
    t.equal(res.code, 0, 'command succeeded')
    t.match(
      res.stdout.toString(), /"added":/, 'installer output printed directly to console'
    )
    t.end()
  })
})

test('noisy npx with --quiet arg on windows', {
  skip: !isWindows && 'Only on Windows does the path to the downloaded module get printed'
}, t => {
  return child.spawn('node', [
    NPX_ESC, '--quiet', 'echo-cli', 'hewwo'
  ], {stdio: 'pipe'}).then(res => {
    t.equal(res.stdout.trim(), 'hewwo')
    t.end()
  })
})

test('nice error message when no binaries on windows', {
  skip: !isWindows && 'Only on Windows is the error message inscrutable'
}, t => {
  return child.spawn('node', [
    NPX_ESC, '0'
  ], {stdio: 'pipe'}).then(res => {
    throw new Error('Should not have succeeded')
  }, err => {
    t.equal(err.stderr.split('\n')[1].trim(), 'command not found: 0')
    t.end()
  })
})

test('--node-arg works on Windows', {
  skip: !isWindows && 'Only on Windows does --node-arg have issues'
}, t => {
  return child.spawn('node', [
    NPX_ESC, '--quiet',
    '--node-arg', '--no-deprecation',
    'echo-cli', 'hewwo'
  ], {stdio: 'pipe'}).then(res => {
    t.equal(res.stdout.trim(), 'hewwo')
    t.end()
  })
})
