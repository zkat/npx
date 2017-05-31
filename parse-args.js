'use strict'

const npa = require('npm-package-arg')
const yargs = require('yargs')

const usage = `$0 [--package|-p <package>] [--cache <path>] [--save-dev|-D] [--save-prod|-P] [--save-optional|-O] [--save-bundle|-B] [--save-exact|-E] [--global|-g] [--prefix|-C] [--userconfig <path>] [-c <string>] [--version|-v] [--] <command>[@version] [command-arg]...
$0 --shell-auto-fallback [<shell>]`

module.exports = parseArgs
function parseArgs () {
  const parser = yargs
  .usage(`Execute a binary from an npm package\n${usage}`)
  .option('package', {
    alias: 'p',
    type: 'string',
    describe: 'package to be installed'
  })
  .option('cache', {
    type: 'string',
    describe: 'location of the npm cache'
  })
  .option('save-prod', {
    alias: 'P',
    type: 'boolean',
    describe: 'add to project\'s dependencies'
  })
  .option('save-dev', {
    alias: 'D',
    type: 'boolean',
    describe: 'add to project\'s devDependencies'
  })
  .option('save-optional', {
    alias: 'O',
    type: 'boolean',
    describe: 'add to project\'s optionalDependencies'
  })
  .option('save-bundle', {
    alias: 'B',
    type: 'boolean',
    describe: 'add to project\'s bundleDependencies'
  })
  .option('save-exact', {
    alias: 'E',
    type: 'boolean',
    describe: 'save the exact specifier instead of a semver range'
  })
  .option('global', {
    alias: 'g',
    type: 'boolean',
    describe: 'install the package globally'
  })
  .option('prefix', {
    alias: 'C',
    type: 'boolean',
    describe: 'location to install global items, or where to run the install if not used with -g'
  })
  .option('userconfig', {
    type: 'string',
    describe: 'path to user npmrc'
  })
  .option('call', {
    alias: 'c',
    type: 'string',
    describe: 'execute string as if inside `npm run-script`'
  })
  .option('shell-auto-fallback', {
    choices: ['detect', 'bash', 'fish', 'zsh'],
    describe: 'generate shell code to use npx as the "command not found" fallback',
    default: 'detect',
    requiresArg: false,
    type: 'string'
  })
  .version()
  .alias('version', 'v')

  const opts = parser.getOptions()
  const bools = new Set(opts.boolean)
  const raw = process.argv

  let cmdIndex
  let hasDashDash
  for (let i = 2; i < raw.length; i++) {
    const opt = raw[i]
    if (opt === '--') {
      hasDashDash = true
      break
    } else if (opt[0] === '-') {
      if (!bools.has(opt.replace(/^--?/, ''))) {
        i++
      }
    } else {
      cmdIndex = i
      break
    }
  }
  if (cmdIndex) {
    const parsed = parser.parse(process.argv.slice(0, cmdIndex))
    parsed.command = parsed.package
    ? process.argv[cmdIndex]
    : npa(process.argv[cmdIndex]).name
    parsed.cmdOpts = process.argv.slice(cmdIndex + 1)
    const pkg = parsed.package || process.argv[cmdIndex]
    parsed.p = parsed.package = npa(pkg).toString()
    return parsed
  } else {
    const parsed = parser.argv
    if (parsed.call) {
      const splitCmd = parsed.call.trim().split(/\s+/)
      parsed.command = parsed.package
      ? splitCmd[0]
      : npa(splitCmd[0]).name
      parsed.cmdOpts = splitCmd.slice(1)
      const pkg = parsed.package || splitCmd[0]
      parsed.p = parsed.package = npa(pkg).toString()
    } else if (hasDashDash) {
      const splitCmd = parsed._
      parsed.command = parsed.package
      ? splitCmd[0]
      : npa(splitCmd[0]).name
      parsed.cmdOpts = splitCmd.slice(1)
    }
    return parsed
  }
}
