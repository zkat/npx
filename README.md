[![npm](https://img.shields.io/npm/v/npx.svg)](https://npm.im/npx) [![license](https://img.shields.io/npm/l/npx.svg)](https://npm.im/npx) [![Travis](https://img.shields.io/travis/zkat/npx.svg)](https://travis-ci.org/zkat/npx) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/zkat/npx?svg=true)](https://ci.appveyor.com/project/zkat/npx) [![Coverage Status](https://coveralls.io/repos/github/zkat/npx/badge.svg?branch=latest)](https://coveralls.io/github/zkat/npx?branch=latest)

# npx(1) -- execute npm package binaries

## SYNOPSIS

`npx [--package|-p <package>[@<version>]] [--cache <path>] [--save-dev|-D] [--save-prod|-P] [--save-optional|-O] [--save-bundle|-B] [--save-exact|-E] [--global|-g] [--prefix|-C] [--userconfig <path>] [-c <string>] [--version|-v] [--] <command> [command-arg]...`

## INSTALL

`npm install -g npx`

## DESCRIPTION

Executes `<command>` either from a local `node_modules/.bin`, or from a central cache, installing any packages needed in order for `<command>` to run.

By default, `<command>` will be read from a `<package>` with the same name, which will be installed globally prior to execution. This behavior can be altered with the following options:

* `-p, --package <package>[@<version>]` - define the package to be installed. An optional `@<version>` may be appended to specify the package version/tag to use (see the [documentation for `npm install`](https://docs.npmjs.com/cli/install)). This defaults to the value of `<command>` (in which case any `@<version>` suffix will be interpreted as only the version/tag for the package, and not be included as part of the command name). This is generally only needed for packages with multiple binaries if you want to call one of the other executables, or where the binary name does not match the package name.

* `--cache <path>` - set the location of the npm cache. Defaults to npm's own cache settings.

* `-g, --global` - install the package globally before execution.

* `-D, --save-dev, -P, --save-prod, -O, --save-optional, -B, --save-bundle, -E, --save-exact` - install the package in the current npm project and save it to `package.json` following the same option conventions for this as `npm install` would.

* `-C, --prefix` - The location to install global items. If used without `-g`, will force any installs to run in the specified folder. Defaults to whatever npm's default is.

* `--userconfig` - path to the user configuration file to pass to npm. Defaults to whatever npm's current default is.

* `-c <string>` - Execute `<string>` with delayed environment variable evaluation.

* `-v, --version` - Show the current npx version.

## EXAMPLES

### Running a project-local bin

```
$ npm i -D webpack
$ npx webpack -- ...
```

### One-off invocation without local installation

```
$ npm rm webpack
$ npx webpack -- ...
$ cat package.json
...webpack not in "devDependencies"...
```

### Execute binary and add it to package.json as a devDependency

```
$ npx -D webpack -- ...
$ cat package.json
...webpack added to "devDependencies"
```

## ACKNOWLEDGEMENTS

Huge thanks to [Kwyn Meagher](https://blog.kwyn.io) for generously donating the package name in the main npm registry. Previously `npx` was used for a Tessel board Neopixels library, which can now be found under [`npx-tessel`](https://npm.im/npx-tessel).

## AUTHOR

Written by [Kat Marchan](https://github.com/zkat).

## REPORTING BUGS

Please file any relevant issues [on Github.](https://github.com/zkat/npx)

## LICENSE

This work is released by its authors into the public domain under CC0-1.0. See `LICENSE.md` for details.

## SEE ALSO

* `npm(1)`
* `npm-run-script(1)`
* `npm-config(7)`
