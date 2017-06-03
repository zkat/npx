'use strict'

const mkdirp = require('mkdirp')
const path = require('path')
const rimraf = require('rimraf')
const tap = require('tap')

const cacheDir = path.resolve(__dirname, '../cache')

module.exports = testDir
function testDir (filename) {
  const base = path.basename(filename, '.js')
  const dir = path.join(cacheDir, base)
  tap.beforeEach(cb => {
    reset(dir, err => {
      if (err) { throw err }
      cb()
    })
  })
  if (!process.env.KEEPCACHE) {
    tap.tearDown(() => {
      process.chdir(__dirname)
      // This is ok cause this is the last
      // thing to run in the process
      rimraf(dir, () => {})
    })
  }
  return dir
}

module.exports.reset = reset
function reset (testDir, cb) {
  process.chdir(__dirname)
  rimraf(testDir, function (err) {
    if (err) { return cb(err) }
    mkdirp(testDir, function (err) {
      if (err) { return cb(err) }
      process.chdir(testDir)
      cb()
    })
  })
}
