'use strict'

const statAsync = promisify(require('fs').stat)
const path = require('path')

module.exports = getPrefix
function getPrefix (current, root) {
  if (!root) {
    const original = root = path.resolve(current)
    while (path.basename(root) === 'node_modules') {
      root = path.dirname(root)
    }
    if (original !== root) {
      return Promise.resolve(root)
    } else {
      return getPrefix(root, root)
    }
  }
  if (isRootPath(current)) {
    return Promise.resolve(root)
  } else {
    return Promise.all([
      fileExists(path.join(current, 'package.json')),
      fileExists(path.join(current, 'node_modules'))
    ]).then(args => {
      const hasPkg = args[0]
      const hasModules = args[1]
      if (hasPkg || hasModules) {
        return current
      } else {
        const parent = path.dirname(current)
        if (parent === current) {
          // This _should_ only happen for root paths, but we already
          // guard against that above. I think this is pretty much dead
          // code, but npm was doing it, and I'm paranoid :s
          return current
        } else {
          return getPrefix(parent, root)
        }
      }
    })
  }
}

function fileExists (f) {
  return statAsync(f).catch(err => {
    if (err.code !== 'ENOENT') {
      throw err
    }
  })
}

function isRootPath (p) {
  return process.platform === 'win32'
  ? p.match(/^[a-z]+:[/\\]?$/i)
  : p === '/'
}

function promisify (f) {
  const util = require('util')
  if (util.promisify) {
    return util.promisify(f)
  } else {
    return function () {
      return new Promise((resolve, reject) => {
        f.apply(this, [].slice.call(arguments).concat((err, val) => {
          err ? reject(err) : resolve(val)
        }))
      })
    }
  }
}
