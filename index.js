#!/usr/bin/env node
'use strict'

const BB = require('bluebird')

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
      return runCommand(cmdPath, argv.cmdOpts)
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
  if (
    opts.saveProd ||
    opts.saveDev ||
    opts.saveOptional ||
    opts.saveBundle ||
    opts.saveExact ||
    opts.global ||
    opts.prefix ||
    opts.cmdHadVersion ||
    opts.packageRequested
  ) {
    return BB.resolve(false)
  } else {
    return which(command).catch({code: 'ENOENT'}, () => false)
  }
}

function getNpmCache (opts) {
  return which('npm').then(npmPath => {
    return BB.fromNode(cb => {
      cp.exec(`${npmPath} config get cache${
        opts.userconfig ? ` --userconfig ${opts.userconfig}` : ''
      }`, {}, cb)
    }).then(cache => cache.trim())
  })
}

function buildArgs (spec, prefix, opts) {
  const args = ['install', spec]
  if (opts.saveProd) args.push('--save', '--save-prod')
  if (opts.saveDev) args.push('--save-dev')
  if (opts.saveOptional) args.push('--save-optional')
  if (opts.saveBundle) args.push('--save-bundle')
  if (opts.saveExact) args.push('--save-exact')
  if (opts.global) args.push('--global')
  if (opts.prefix) args.push('--prefix', opts.prefix)
  if (args.length === 2) {
    // No save opts passed in. Save it to the SUPERSEKRIT cache
    args.push('--global', '--prefix', prefix)
  }
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

function runCommand (cmdPath, cmdOpts) {
  return spawn(cmdPath, cmdOpts, {
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
