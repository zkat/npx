'use strict'

const cp = require('child_process')
const path = require('path')

module.exports.runCommand = runCommand
function runCommand (command, opts) {
  const cmd = opts.call || command || opts.command
  const copts = (opts.call ? [] : opts.cmdOpts) || []
  return spawn(cmd, copts, {
    shell: opts.shell || !!opts.call,
    stdio: opts.stdio || 'inherit'
  }).catch(err => {
    if (err.code === 'ENOENT') {
      err = new Error(
        require('./y.js')`npx: command not found: ${path.basename(cmd)}`
      )
      err.exitCode = 127
    }
    throw err
  })
}

module.exports.spawn = spawn
function spawn (cmd, args, opts) {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(cmd, args, opts)
    let stdout = ''
    let stderr = ''
    child.stdout && child.stdout.on('data', d => { stdout += d })
    child.stderr && child.stderr.on('data', d => { stderr += d })
    child.on('error', reject)
    child.on('close', code => {
      if (code) {
        const err = new Error(
          require('./y.js')`Command failed: ${cmd} ${args.join(' ')}`
        )
        err.exitCode = code
        reject(err)
      } else {
        resolve({code, stdout, stderr})
      }
    })
  })
}

module.exports.exec = exec
function exec (cmd, args, opts) {
  opts = opts || {}
  return new Promise((resolve, reject) => {
    cp.exec(`${escapeArg(cmd, true)} ${
      args.join(' ')
    }`, opts, (err, stdout) => err ? reject(err) : resolve(stdout))
  })
}

module.exports.escapeArg = escapeArg
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
