#!/usr/bin/env node
'use strict'

const BB = require('bluebird')

const autoFallback = require('./auto-fallback.js')
const cp = require('child_process')
const getPrefix = require('./get-prefix.js')
const parseArgs = require('./parse-args.js')
const path = require('path')
const pkg = require('./package.json')
const updateNotifier = require('update-notifier')
const which = BB.promisify(require('which'))
const yargs = require('yargs')

const PATH_SEP = process.platform === 'win32' ? ';' : ':'

updateNotifier({pkg}).notify()
main(parseArgs())

function main (argv) {
  const shell = argv['shell-auto-fallback']
  if (shell || shell === '') {
    console.log(autoFallback(shell))
    process.exit(0)
  }

  if (!argv.command || !argv.package) {
    console.error('\nERROR: You must supply a command.\n')
    yargs.showHelp()
    process.exit(1)
  }

  return localBinPath(process.cwd()).then(local => {
    process.env.PATH = `${local}${PATH_SEP}${process.env.PATH}`
    return getCmdPath(
      argv.command, argv.package, argv
    ).then(cmdPath => {
      return runCommand(cmdPath, argv.cmdOpts, argv)
    }).catch(err => {
      console.error(err.message)
      process.exit(err.exitCode || 1)
    })
  })
}

function localBinPath (cwd) {
  return getPrefix(cwd).then(prefix => {
    return path.join(prefix, 'node_modules', '.bin')
  })
}

function getCmdPath (command, spec, npmOpts) {
  return getExistingPath(command, npmOpts).then(cmdPath => {
    if (cmdPath) {
      return cmdPath
    } else {
      return (
        npmOpts.cache ? BB.resolve(npmOpts.cache) : getNpmCache(npmOpts)
      ).then(cache => {
        const prefix = path.join(cache, '_npx')
        return installPackage(spec, prefix, npmOpts).then(() => {
          process.env.PATH = `${
            path.join(prefix, 'bin')
          }${PATH_SEP}${process.env.PATH}`
          return which(command)
        })
      })
    }
  })
}

function getExistingPath (command, opts) {
  if (opts.cmdHadVersion || opts.packageRequested || opts.ignoreExisting) {
    return BB.resolve(false)
  } else {
    return which(command).catch({code: 'ENOENT'}, () => false)
  }
}

function getNpmCache (opts) {
  return which('npm').then(npmPath => {
    return BB.fromNode(cb => {
      cp.exec(`${escapeArg(npmPath, true)} config get cache${
        opts.userconfig
        ? ` --userconfig ${escapeArg(opts.userconfig)}`
        : ''
      }`, {}, cb)
    }).then(cache => cache.trim())
  })
}

function buildArgs (spec, prefix, opts) {
  const args = ['install', spec]
  args.push('--global', '--prefix', prefix)
  if (opts.cache) args.push('--cache', opts.cache)
  if (opts.userconfig) args.push('--userconfig', opts.userconfig)
  args.push('--loglevel', 'error')

  return args
}

function installPackage (spec, prefix, npmOpts) {
  const args = buildArgs(spec, prefix, npmOpts)
  return which('npm').then(npmPath => {
    return BB.fromNode(cb => {
      const child = cp.spawn(npmPath, args, {
        stdio: [0, 2, 2] // pipe npm's output to stderr
      })
      child.on('error', cb)
      child.on('close', code => {
        if (code === 0) {
          cb()
        } else {
          cb(new Error(`Install for ${spec} failed with code ${code}`))
        }
      })
    })
  })
}

function runCommand (cmdPath, cmdOpts, opts) {
  return spawn(cmdPath, cmdOpts, {
    shell: opts.shell || !!opts.call,
    stdio: 'inherit'
  }).catch({code: 'ENOENT'}, () => {
    throw new Error(`npx: command not found: ${path.basename(cmdPath)}`)
  })
}

function spawn (cmd, args, opts) {
  return BB.fromNode(cb => {
    const child = cp.spawn(cmd, args, opts)
    child.on('error', cb)
    child.on('close', code => {
      if (code) {
        const err = new Error(`Command failed: ${cmd} ${args}`)
        err.exitCode = code
        cb(err)
      } else {
        cb()
      }
    })
  })
}

function escapeArg (str, asPath) {
  return process.platform === 'win32' && asPath
  ? path.normalize(str)
  .split(/\\/)
  .map(s => s.match(/\s+/) ? `"${s}"` : s)
  : process.platform === 'win32'
  ? `"${path.normalize(str)}"`
  : str.match(/[^-_.~/\w]/)
  ? `'${str.replace(/'/g, "'\"'\"'")}'`
  : str
}
