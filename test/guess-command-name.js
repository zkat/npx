'use strict'

const test = require('tap').test

const guessCmdName = require('../parse-args.js')._guessCmdName

test('guesses unscoped registry binaries', t => {
  t.equal(guessCmdName('foo'), 'foo')
  t.done()
})

test('guesses scoped registry binaries', t => {
  t.equal(guessCmdName('@user/foo'), 'foo')
  t.done()
})

test('guesses hosted git binaries', t => {
  t.equal(guessCmdName('user/foo'), 'foo')
  t.equal(guessCmdName('git+ssh://git@github.com:user/foo.git#semver:^1'), 'foo')
  t.done()
})

test('guesses git binaries', t => {
  t.equal(guessCmdName('git+ssh://myhost.com:user/foo.git#semver:^1'), 'foo')
  t.equal(guessCmdName('git://myhost.com:foo'), 'foo')
  t.done()
})

test('leaves local directory/file commands intact', t => {
  t.equal(guessCmdName('./foo'), './foo')
  t.equal(guessCmdName('./dir/foo'), './dir/foo')
  t.equal(guessCmdName('../../../dir/foo'), '../../../dir/foo')
  t.equal(
    guessCmdName('C:\\Program Files\\node\\foo'),
    'C:\\Program Files\\node\\foo'
  )
  t.done()
})

test('guesses remote tarballs', t => {
  t.equal(guessCmdName('https://registry.npmjs.org/foo/-/foo-1.2.3.tgz'), 'foo')
  t.equal(guessCmdName('http://registry.npmjs.org/foo/-/foo-1.2.3-prerelease.5+buildnum.tgz'), 'foo')
  t.equal(guessCmdName('https://github.com/tarball/blah/foo.tar.gz'), 'foo')
  t.done()
})

test('guesses local tarballs', t => {
  t.equal(guessCmdName('./foo-1.2.3.tgz'), 'foo')
  t.equal(guessCmdName('./dir/foo.tar.gz'), 'foo')
  t.equal(guessCmdName('C:\\Program Files\\dir/foo-bar.tar.gz'), 'foo-bar')
  t.done()
})

test('warns when something could not be guessed', t => {
  const oldErr = console.error
  console.error = str => {
    t.match(str, /Unable to guess a binary name/)
  }
  guessCmdName({})
  console.error = oldErr
  t.done()
})
