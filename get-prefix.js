'use strict'

const BB = require('bluebird')

const statAsync = BB.promisify(require('fs').stat)
const path = require('path')

module.exports = getPrefix
function getPrefix (current, root) {
  if (!root) {
    const original = root = path.resolve(current)
    while (path.basename(root) === 'node_modules') {
      root = path.dirname(root)
    }
    if (original !== root) {
      return BB.resolve(root)
    } else {
      return getPrefix(root, root)
    }
  }
  if (isRootPath(current)) {
    return BB.resolve(root)
  } else {
    return BB.join(
      fileExists(path.join(current, 'package.json')),
      fileExists(path.join(current, 'node_modules')),
      (hasPkg, hasModules) => {
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
      }
    )
  }
}

function fileExists (f) {
  return statAsync(f).catch({code: 'ENOENT'}, () => false)
}

function isRootPath (p) {
  return process.platform === 'win32'
  ? p.match(/^[a-z]+:[/\\]?$/i)
  : p === '/'
}
