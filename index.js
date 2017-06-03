#!/usr/bin/env node
'use strict'

const BB = require('bluebird')

const child = require('./child')
const getPrefix = require('./get-prefix.js')
const parseArgs = require('./parse-args.js')
const path = require('path')
const pkg = require('./package.json')
let rimraf
const updateNotifier = require('update-notifier')
const which = BB.promisify(require('which'))

const PATH_SEP = process.platform === 'win32' ? ';' : ':'

updateNotifier({pkg}).notify()
main(parseArgs())

module.exports = main
function main (argv) {
  const shell = argv['shell-auto-fallback']
  if (shell || shell === '') {
    const fallback = require('./auto-fallback.js')(
      shell, process.env.SHELL, argv
    )
    if (fallback) {
      console.log(fallback)
      process.exit(0)
    } else {
      process.exit(1)
    }
  }

  if (!argv.command || !argv.package) {
    console.error('\nERROR: You must supply a command.\n')
    parseArgs.showHelp()
    process.exit(1)
  }

  return localBinPath(process.cwd()).then(local => {
    process.env.PATH = `${local}${PATH_SEP}${process.env.PATH}`
    return getCmdPath(
      argv.command, argv.package, argv
    ).then(cmdPath => {
      return child.runCommand(cmdPath, argv.cmdOpts, argv)
    }).catch(err => {
      console.error(err.message)
      process.exit(err.exitCode || 1)
    })
  })
}

module.exports._localBinPath = localBinPath
function localBinPath (cwd) {
  return getPrefix(cwd).then(prefix => {
    return path.join(prefix, 'node_modules', '.bin')
  })
}

module.exports._getCmdPath = getCmdPath
function getCmdPath (command, specs, npmOpts) {
  return getExistingPath(command, npmOpts).then(cmdPath => {
    if (cmdPath) {
      return cmdPath
    } else {
      return (
        npmOpts.cache ? BB.resolve(npmOpts.cache) : getNpmCache(npmOpts)
      ).then(cache => {
        const prefix = path.join(cache, '_npx')
        if (!rimraf) { rimraf = BB.promisify(require('rimraf')) }
        // TODO: this is a bit heavy-handed but it's the safest one right now
        return rimraf(prefix).then(() => {
          return installPackages(specs, prefix, npmOpts).then(() => {
            process.env.PATH = `${
              path.join(prefix, 'bin')
            }${PATH_SEP}${process.env.PATH}`
            return which(command)
          })
        })
      })
    }
  })
}

module.exports._getExistingPath = getExistingPath
function getExistingPath (command, opts) {
  if (opts.cmdHadVersion || opts.packageRequested || opts.ignoreExisting) {
    return BB.resolve(false)
  } else {
    return which(command).catch({code: 'ENOENT'}, err => {
      if (!opts.install) {
        throw err
      }
    })
  }
}

module.exports._getNpmCache = getNpmCache
function getNpmCache (opts) {
  return which('npm').then(npmPath => {
    const args = ['config', 'get', 'cache']
    if (opts.userconfig) {
      args.push('--userconfig', opts.userconfig)
    }
    return child.exec(npmPath, ['config', 'get', 'cache'])
  }).then(cache => cache.trim())
}

module.exports._buildArgs = buildArgs
function buildArgs (specs, prefix, opts) {
  const args = ['install'].concat(specs)
  args.push('--global', '--prefix', prefix)
  if (opts.cache) args.push('--cache', opts.cache)
  if (opts.userconfig) args.push('--userconfig', opts.userconfig)
  args.push('--loglevel', 'error', '--json')

  return args
}

module.exports._installPackages = installPackages
function installPackages (specs, prefix, npmOpts) {
  const args = buildArgs(specs, prefix, npmOpts)
  return which('npm').then(npmPath => {
    return child.spawn(npmPath, args, {
      stdio: [0, 'ignore', 2] // pipe npm's output to stderr
    }).catch(err => {
      if (err.exitCode) {
        err.message = `Install for ${specs} failed with code ${err.exitCode}`
      }
      throw err
    })
  })
}
