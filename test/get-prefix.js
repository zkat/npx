'use strict'

const os = require('os')
const path = require('path')
const Tacks = require('tacks')
const test = require('tap').test
const testDir = require('./util/test-dir.js')(__filename)

const Dir = Tacks.Dir
const File = Tacks.File

const getPrefix = require('../get-prefix.js')

test('navigates out of `node_modules` without fs nav', t => {
  return getPrefix('/foo/bar/baz/node_modules/node_modules').then(val => {
    t.equal(val, '/foo/bar/baz', 'navigates out of node_modules')
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

test('returns the same path if no package was found in parent dirs', t => {
  // Hopefully folks' tmpdir isn't inside an npm package ;)
  const tmp = os.tmpdir()
  return getPrefix(tmp).then(prefix => {
    t.equal(prefix, tmp, 'returned the same path')
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

test('returns root if we get there', t => {
  let root = '/'
  if (process.platform === 'win32') {
    const currentDrive = process.cwd().match(/^([a-z]+):/i)[1]
    root = `${currentDrive}:\\`
  }
  return getPrefix(root).then(prefix => {
    t.equal(prefix, root, 'used the same root')
  })
})
