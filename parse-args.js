'use strict'

const npa = require('npm-package-arg')
const path = require('path')
const yargs = require('yargs')
const Y = require('./y.js')

const usage = `
$0 [options] <command>[@version] [command-arg]...

$0 [options] [-p|--package <pkg>]... <command> [command-arg]...

$0 [options] -c '<command-string>'

$0 --shell-auto-fallback [shell]
`

module.exports = parseArgs
function parseArgs (argv) {
  argv = argv || process.argv
  const parser = yargs
  .usage(Y`Execute binaries from npm packages.\n${usage}`)
  .option('package', {
    alias: 'p',
    type: 'string',
    describe: Y`Package to be installed.`
  })
  .option('cache', {
    type: 'string',
    describe: Y`Location of the npm cache.`
  })
  .option('install', {
    type: 'boolean',
    describe: Y`Skip installation if a package is missing.`,
    default: true
  })
  .option('userconfig', {
    type: 'string',
    describe: Y`Path to user npmrc.`
  })
  .option('call', {
    alias: 'c',
    type: 'string',
    describe: Y`Execute string as if inside \`npm run-script\`.`
  })
  .option('shell', {
    alias: 's',
    type: 'string',
    describe: Y`Shell to execute the command with, if any.`,
    default: false
  })
  .option('shell-auto-fallback', {
    choices: ['', 'bash', 'fish', 'zsh'],
    describe: Y`Generate shell code to use npx as the "command not found" fallback.`,
    requireArg: false,
    type: 'string'
  })
  .option('ignore-existing', {
    describe: Y`Ignores existing binaries in $PATH, or in the local project. This forces npx to do a temporary install and use the latest version.`,
    type: 'boolean'
  })
  .option('npm', {
    describe: Y`npm binary to use for internal operations.`,
    type: 'string',
    default: path.resolve(__dirname, 'node_modules', '.bin', 'npm')
  })
  .version()
  .alias('version', 'v')
  .help()
  .alias('help', 'h')
  .epilogue(Y`For the full documentation, see the manual page for npx(1).`)

  const opts = parser.getOptions()
  const bools = new Set(opts.boolean)

  let cmdIndex
  let hasDashDash
  for (let i = 2; i < argv.length; i++) {
    const opt = argv[i]
    if (opt === '--') {
      hasDashDash = true
      break
    } else if (opt[0] === '-') {
      if (!bools.has(opt.replace(/^--?(no-)?/i, ''))) {
        i++
      }
    } else {
      cmdIndex = i
      break
    }
  }
  if (cmdIndex) {
    const parsed = parser.parse(argv.slice(0, cmdIndex))
    const parsedCmd = npa(argv[cmdIndex])
    parsed.command = parsed.package
    ? argv[cmdIndex]
    : guessCmdName(parsedCmd)
    parsed.cmdOpts = argv.slice(cmdIndex + 1)
    if (typeof parsed.package === 'string') {
      parsed.package = [parsed.package]
    }
    parsed.packageRequested = !!parsed.package
    parsed.cmdHadVersion = parsed.package
    ? false
    : parsedCmd.name !== parsedCmd.raw
    const pkg = parsed.package || [argv[cmdIndex]]
    parsed.p = parsed.package = pkg.map(p => npa(p).toString())
    return parsed
  } else {
    const parsed = parser.parse(argv)
    if (typeof parsed.package === 'string') {
      parsed.package = [parsed.package]
    }
    // -c *requires* -p, because the -c string should not be touched by npx
    if (parsed.call && parsed.package) {
      parsed.packageRequested = !!parsed.package
      parsed.cmdHadVersion = false
      const pkg = parsed.package
      parsed.p = parsed.package = pkg.map(p => npa(p).toString())
    } else if (parsed.call && !parsed.package) {
      parsed.packageRequested = false
      parsed.cmdHadVersion = false
      parsed.p = parsed.package = []
    } else if (hasDashDash) {
      const splitCmd = parsed._.slice(2)
      const parsedCmd = npa(splitCmd[0])
      parsed.command = parsed.package
      ? splitCmd[0]
      : guessCmdName(parsedCmd)
      parsed.cmdOpts = splitCmd.slice(1)
      parsed.packageRequested = !!parsed.package
      parsed.cmdHadVersion = parsed.package
      ? false
      : parsedCmd.name !== parsedCmd.raw
      const pkg = parsed.package || [splitCmd[0]]
      parsed.p = parsed.package = pkg.map(p => npa(p).toString())
    }
    return parsed
  }
}

parseArgs.showHelp = () => yargs.showHelp()

module.exports._guessCmdName = guessCmdName
function guessCmdName (spec) {
  if (typeof spec === 'string') { spec = npa(spec) }
  if (spec.scope) {
    return spec.name.slice(spec.scope.length + 1)
  } else if (spec.registry) {
    return spec.name
  } else if (spec.hosted && spec.hosted.project) {
    return spec.hosted.project
  } else if (spec.type === 'git') {
    const match = spec.fetchSpec.match(/([a-z0-9-]+)(?:\.git)?$/i)
    return match[1]
  } else if (spec.type === 'directory') {
    return path.basename(spec.fetchSpec)
  } else if (spec.type === 'file' || spec.type === 'remote') {
    let ext = path.extname(spec.fetchSpec)
    if (ext === '.gz') {
      ext = path.extname(path.basename(spec.fetchSpec, ext)) + ext
    }
    return path.basename(spec.fetchSpec, ext).replace(/-\d+\.\d+\.\d+(?:-[a-z0-9.\-+]+)?$/i, '')
  }

  console.error(Y`Unable to guess a binary name from ${spec.raw}. Please use --package.`)
  return null
}
