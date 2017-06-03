'use strict'

const BB = require('bluebird')

const cp = require('child_process')
const path = require('path')

module.exports.runCommand = runCommand
function runCommand (cmdPath, cmdOpts, opts) {
  return spawn(cmdPath, cmdOpts, {
    shell: opts.shell || !!opts.call,
    stdio: opts.stdio || 'inherit'
  }).catch({code: 'ENOENT'}, () => {
    throw new Error(`npx: command not found: ${path.basename(cmdPath)}`)
  })
}

module.exports.spawn = spawn
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
  : process.platform === 'win32'
  ? `"${path.normalize(str)}"`
  : str.match(/[^-_.~/\w]/)
  ? `'${str.replace(/'/g, "'\"'\"'")}'`
  : str
}
