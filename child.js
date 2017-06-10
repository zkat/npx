'use strict'

const BB = require('bluebird')

const cp = require('child_process')
const path = require('path')
const Y = require('./y.js')

module.exports.runCommand = runCommand
function runCommand (cmdPath, cmdOpts, opts) {
  return spawn(cmdPath, cmdOpts, {
    shell: opts.shell || !!opts.call,
    stdio: opts.stdio || 'inherit'
  }).catch({code: 'ENOENT'}, () => {
    const err = new Error(Y`npx: command not found: ${path.basename(cmdPath)}`)
    err.exitCode = 127
    throw err
  })
}

module.exports.spawn = spawn
function spawn (cmd, args, opts) {
  return BB.fromNode(cb => {
    const child = cp.spawn(cmd, args, opts)
    child.on('error', cb)
    child.on('close', code => {
      if (code) {
        const err = new Error(Y`Command failed: ${cmd} ${args.join(' ')}`)
        err.exitCode = code
        cb(err)
      } else {
        cb()
      }
    })
  })
}

module.exports.exec = exec
function exec (cmd, args, opts) {
  opts = opts || {}
  return BB.fromNode(cb => {
    cp.exec(`${escapeArg(cmd, true)} ${
      args.map(arg => escapeArg(arg)).join(' ')
    }`, opts, cb)
  })
}

module.exports._escapeArg = escapeArg
function escapeArg (str, asPath) {
  return process.platform === 'win32' && asPath
  ? path.normalize(str)
  .split(/\\/)
  .map(s => s.match(/\s+/) ? `"${s}"` : s)
  .join('\\')
  : process.platform === 'win32'
  ? `"${path.normalize(str)}"`
  : str.match(/[^-_.~/\w]/)
  ? `'${str.replace(/'/g, "'\"'\"'")}'`
  : str
}
