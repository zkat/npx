'use strict'

const test = require('tap').test

const parseArgs = require('../parse-args.js')

test('parses basic command', t => {
  const parsed = parseArgs(['/node', '/npx', 'foo'])
  t.equal(parsed.command, 'foo')
  t.deepEqual(parsed.package, ['foo@latest'])
  t.equal(parsed.packageRequested, false)
  t.equal(parsed.cmdHadVersion, false)
  t.equal(parsed.npm, 'npm')
  t.deepEqual(parsed.cmdOpts, [])
  t.done()
})

test('parses command with version', t => {
  const parsed = parseArgs(['/node', '/npx', 'foo@1.2.3'])
  t.equal(parsed.command, 'foo')
  t.deepEqual(parsed.package, ['foo@1.2.3'])
  t.equal(parsed.packageRequested, false)
  t.equal(parsed.cmdHadVersion, true)
  t.done()
})

test('parses command opts', t => {
  const parsed = parseArgs(['/node', '/npx', 'foo', 'a', 'b'])
  t.equal(parsed.command, 'foo')
  t.deepEqual(parsed.package, ['foo@latest'])
  t.equal(parsed.packageRequested, false)
  t.equal(parsed.cmdHadVersion, false)
  t.deepEqual(parsed.cmdOpts, ['a', 'b'])
  t.done()
})

test('parses scoped package command opts', t => {
  const parsed = parseArgs(['/node', '/npx', '@user/foo', 'a', 'b'])
  t.equal(parsed.command, 'foo')
  t.deepEqual(parsed.package, ['@user/foo@latest'])
  t.equal(parsed.packageRequested, false)
  t.equal(parsed.cmdHadVersion, false)
  t.deepEqual(parsed.cmdOpts, ['a', 'b'])
  t.done()
})

test('ignores options after command', t => {
  const parsed = parseArgs(['/node', '/npx', 'foo', '-p', 'bar', 'a', 'b'])
  t.equal(parsed.command, 'foo')
  t.deepEqual(parsed.package, ['foo@latest'])
  t.equal(parsed.packageRequested, false)
  t.equal(parsed.cmdHadVersion, false)
  t.deepEqual(parsed.cmdOpts, ['-p', 'bar', 'a', 'b'])
  t.done()
})

test('assumes unknown args before cmd have values and ignores them', t => {
  const parsed = parseArgs(['/node', '/npx', '-p', 'bar', '--blahh', 'arg', '--ignore-existing', 'foo', 'a', 'b'])
  t.equal(parsed.command, 'foo')
  t.deepEqual(parsed.package, ['bar@latest'])
  t.equal(parsed.packageRequested, true)
  t.equal(parsed.cmdHadVersion, false)
  t.deepEqual(parsed.cmdOpts, ['a', 'b'])
  t.done()
})

test('parses package option', t => {
  const parsed = parseArgs(['/node', '/npx', '-p', 'bar', 'foo', 'a', 'b'])
  t.equal(parsed.command, 'foo')
  t.deepEqual(parsed.package, ['bar@latest'])
  t.equal(parsed.packageRequested, true)
  t.equal(parsed.cmdHadVersion, false)
  t.deepEqual(parsed.cmdOpts, ['a', 'b'])
  t.done()
})

test('parses multiple package options', t => {
  const parsed = parseArgs(['/node', '/npx', '-p', 'baz@1.2.3', '-p', 'bar', 'foo', 'a', 'b'])
  t.equal(parsed.command, 'foo')
  t.deepEqual(parsed.package, ['baz@1.2.3', 'bar@latest'])
  t.equal(parsed.packageRequested, true)
  t.equal(parsed.cmdHadVersion, false)
  t.deepEqual(parsed.cmdOpts, ['a', 'b'])
  t.done()
})

test('does not parse -c', t => {
  const parsed = parseArgs(['/node', '/npx', '-c', 'foo a b'])
  t.deepEqual(parsed.command, null, 'stays unparsed')
  t.deepEqual(parsed.package, [])
  t.equal(parsed.packageRequested, false)
  t.equal(parsed.cmdHadVersion, false)
  t.deepEqual(parsed.cmdOpts, null)
  t.done()
})

test('uses -p even with -c', t => {
  const parsed = parseArgs(['/node', '/npx', '-c', 'foo a b', '-p', 'bar'])
  t.deepEqual(parsed.command, null)
  t.deepEqual(parsed.package, ['bar@latest'])
  t.equal(parsed.packageRequested, true)
  t.equal(parsed.cmdHadVersion, false)
  t.deepEqual(parsed.cmdOpts, null)
  t.done()
})

test('-p prevents command parsing', t => {
  const parsed = parseArgs(['/node', '/npx', '-p', 'pkg', 'foo@1.2.3', 'a', 'b'])
  t.equal(parsed.command, 'foo@1.2.3')
  t.deepEqual(parsed.package, ['pkg@latest'])
  t.equal(parsed.packageRequested, true)
  t.equal(parsed.cmdHadVersion, false)
  t.deepEqual(parsed.cmdOpts, ['a', 'b'])
  t.done()
})

test('-- stops option parsing but still does command', t => {
  const parsed = parseArgs(['/node', '/npx', '--', '-foo', 'a', 'b'])
  t.equal(parsed.command, '-foo')
  t.deepEqual(parsed.package, ['-foo@latest'])
  t.equal(parsed.packageRequested, false)
  t.equal(parsed.cmdHadVersion, false)
  t.deepEqual(parsed.cmdOpts, ['a', 'b'])
  t.done()
})

test('-- still respects -p', t => {
  const parsed = parseArgs(['/node', '/npx', '-p', 'bar', '--', '-foo', 'a', 'b'])
  t.equal(parsed.command, '-foo')
  t.deepEqual(parsed.package, ['bar@latest'])
  t.equal(parsed.packageRequested, true)
  t.equal(parsed.cmdHadVersion, false)
  t.deepEqual(parsed.cmdOpts, ['a', 'b'])
  t.done()
})

test('allows configuration of npm binary', t => {
  const parsed = parseArgs(['/node', '/npx', '--npm', './mynpm', 'foo'])
  t.equal(parsed.npm, './mynpm')
  t.done()
})

test('treats directory-type commands specially', t => {
  let parsed = parseArgs(['/node', '/npx', './foo'])
  t.equal(parsed.command, './foo')
  t.deepEqual(parsed.package, [])
  t.equal(parsed.packageRequested, false)
  t.equal(parsed.cmdHadVersion, false)
  t.ok(parsed.isLocal)
  parsed = parseArgs(['/node', '/npx', '-p', 'x', '../foo/bar.sh'])
  t.equal(parsed.command, '../foo/bar.sh')
  t.ok(parsed.isLocal)
  t.deepEqual(parsed.package, ['x@latest'])
  t.equal(parsed.packageRequested, true)
  t.equal(parsed.cmdHadVersion, false)
  t.done()
})
