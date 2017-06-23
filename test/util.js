'use strict'

const test = require('tap').test

test('promisify with existing util.promisify', t => {
  const promisify = require('../util.js').promisify
  const util = require('util')
  const origProm = util.promisify
  util.promisify = x => x
  t.equal(promisify('success'), 'success', 'used existing promisify fn')
  util.promisify = origProm
  t.done()
})

test('promisify without existing util.promisify', t => {
  const promisify = require('../util.js').promisify
  const util = require('util')
  const origProm = util.promisify
  util.promisify = null
  const promisified = promisify((a, cb) => {
    if (a) {
      cb(null, a)
    } else {
      cb(new Error('fail'))
    }
  })
  const p = promisified('yay')
  util.promisify = origProm
  t.ok(p.then, 'got a thenable')
  return p.then(val => {
    t.equal(val, 'yay', 'value passed through successfully')
    return promisified(false).then(() => {
      throw new Error('should have failed')
    }, err => {
      t.equal(err.message, 'fail', 'got the error!')
    })
  })
})
