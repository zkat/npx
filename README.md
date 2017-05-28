[![npm](https://img.shields.io/npm/v/npx.svg)](https://npm.im/npx) [![license](https://img.shields.io/npm/l/npx.svg)](https://npm.im/npx) [![Travis](https://img.shields.io/travis/zkat/npx.svg)](https://travis-ci.org/zkat/npx) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/zkat/npx?svg=true)](https://ci.appveyor.com/project/zkat/npx) [![Coverage Status](https://coveralls.io/repos/github/zkat/npx/badge.svg?branch=latest)](https://coveralls.io/github/zkat/npx?branch=latest)

# npx(1) -- execute a local npm package binary

## SYNOPSIS

`npx [--package|-p <package>] [--cache <path>] [--install-dev|-D] [--install-prod|-P] [--userconfig <path>] [-c <string>] <command>[@version] [command-arg]...`

## INSTALL

`npm install --save [-g] npx`

## DESCRIPTION

Executes `<command>` either from a local `node_modules/.bin`, or from a central cache, installing any packages needed in order for `<command>` to run.

By default, `<command>` will be installed prior to execution. An optional `@version` may be appended to specify the package version required.

* `-p, --package <package>` - define the package to be installed. This defaults to the value of `<command>`.

* `--cache <path>` - set the location of the npm cache. Defaults to `~/.npm`. Non-local binaries will be installed under `<path>/_npx`.

* `-D, --install-dev` - install the command in the current npm project and save it to `package.json` under `devDependencies`.

* `-P, --install-prod` - install the command in the current npm project and save it to `package.json` under `dependencies`.

* `--userconfig` - path to the user configuration file to pass to npm. Defaults to whatever npm's current default is.

* `-c <string>` - Execute `<string>` in an `npm run-script`-like environment. This will not just add `node_modules/.bin` to `$PATH`, but also enrich the execution environment with all the `$npm_...` environment variables usually present when using `npm run-script`.

## EXAMPLES

### Running a project-local bin

```
$ npm i -D webpack
$ npx webpack ...
```

### One-off invocation without local installation

```
$ npm rm webpack
$ npx webpack ...
$ cat package.json
...webpack not in "devDependencies"...
```

### Execute binary and add it to package.json as a devDependency

```
$ npx -D webpack ...
$ cat package.json
...webpack added to "devDependencies"
```

### Execute a script with access to standard npm run-script environment vars

```
$ npx -c 'echo $npm_package_version'
1.2.3
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
