'use strict'

const os = require('os')
const path = require('path')
const requireInject = require('require-inject')
const Tacks = require('tacks')
const test = require('tap').test
const testDir = require('./util/test-dir.js')(__filename)

const Dir = Tacks.Dir
const File = Tacks.File

const getPrefix = require('../get-prefix.js')

test('navigates out of `node_modules` without fs nav', t => {
  return getPrefix(
    path.join(testDir, 'node_modules', 'node_modules')
  ).then(val => {
    t.equal(val, testDir, 'navigates out of node_modules')
  })
})

test('detects if currently in an npm package using package.json', t => {
  const fixture = new Tacks(Dir({
    'package.json': File({name: 'foo', version: '1.2.3'})
  }))
  fixture.create(testDir)
  return getPrefix(testDir).then(prefix => {
    t.equal(prefix, testDir, 'current dir worked out')
  })
})

test('detects if currently in an npm package using node_modules', t => {
  const fixture = new Tacks(Dir({
    'node_modules': Dir({})
  }))
  fixture.create(testDir)
  return getPrefix(testDir).then(prefix => {
    t.equal(prefix, testDir, 'current dir worked out')
  })
})

test('returns false if no package was found in parent dirs', t => {
  // Hopefully folks' tmpdir isn't inside an npm package ;)
  const tmp = os.tmpdir()
  return getPrefix(tmp).then(prefix => {
    t.equal(prefix, false, 'returned the false')
  })
})

test('navigates up the filesystem until it finds a package', t => {
  const fixture = new Tacks(Dir({
    'node_modules': Dir({}),
    'a': Dir({'b': Dir({'c': Dir({'d': Dir({})})})})
  }))
  fixture.create(testDir)
  return getPrefix(path.join(testDir, 'a', 'b', 'c')).then(prefix => {
    t.equal(prefix, testDir, 'navigated all the way up')
  })
})

test('doesn\'t go too far while navigating up', t => {
  const fixture = new Tacks(Dir({
    'node_modules': Dir({}),
    'a': Dir({'node_modules': Dir({}), 'b': Dir({'c': Dir({'d': Dir({})})})})
  }))
  fixture.create(testDir)
  return getPrefix(path.join(testDir, 'a', 'b', 'c')).then(prefix => {
    t.equal(prefix, path.join(testDir, 'a'), 'stopped before root')
  })
})

test('fileExists unit', t => {
  const fileExists = requireInject('../get-prefix.js', {
    fs: {
      stat (todo, cb) {
        if (todo === 'exists') {
          cb(null, {name: 'yay'})
        } else if (todo === 'enoent') {
          const err = new Error('not found')
          err.code = 'ENOENT'
          cb(err)
        } else {
          cb(new Error('idk'))
        }
      }
    }
  })._fileExists
  return Promise.all([
    fileExists('exists'),
    fileExists('enoent'),
    fileExists('kaboom').then(() => {
      throw new Error('nope')
    }, err => err)
  ]).then(results => {
    t.deepEqual(results[0], {name: 'yay'}, 'existing stat returned')
    t.notOk(results[1], 'missing file succeeds with falsy')
    t.match(results[2].message, /^idk$/, 'other errors thrown')
  })
})

test('isRootPath unit', t => {
  const isRoot = getPrefix._isRootPath
  t.ok(isRoot('C:\\', 'win32'), 'detected root on windows')
  t.notOk(isRoot('C:\\foo', 'win32'), 'detected non-root on windows')
  t.ok(isRoot('/', 'darwin'), 'detected root on darwin')
  t.notOk(isRoot('/foo', 'darwin'), 'detected non-root on darwin')
  t.ok(isRoot('/', 'linux'), 'detected root on linux')
  t.notOk(isRoot('/foo', 'linux'), 'detected non-root on linux')
  t.done()
})
