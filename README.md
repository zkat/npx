[![npm](https://img.shields.io/npm/v/npx.svg)](https://npm.im/npx) [![license](https://img.shields.io/npm/l/npx.svg)](https://npm.im/npx) [![Travis](https://img.shields.io/travis/zkat/npx.svg)](https://travis-ci.org/zkat/npx) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/zkat/npx?svg=true)](https://ci.appveyor.com/project/zkat/npx) [![Coverage Status](https://coveralls.io/repos/github/zkat/npx/badge.svg?branch=latest)](https://coveralls.io/github/zkat/npx?branch=latest)

# npx(1) -- execute npm package binaries

## SYNOPSIS

`npx [--package|-p <package>] [--cache <path>] [--userconfig <path>] [-c <string>] [--shell|-s <string>] [--no-install] [--shell-auto-fallback [<shell>]] [--ignore-existing] [--version|-v] [--] <command>[@version] [command-arg]...`

## INSTALL

`npm install -g npx`

## DESCRIPTION

Executes `<command>` either from a local `node_modules/.bin`, or from a central cache, installing any packages needed in order for `<command>` to run.

By default, `npx` will check whether `<command>` exists in `$PATH`, or in the local project binaries, and execute that. If `<command>` is not found, it will be installed prior to execution.

Unless a `--package` option is specified, `npx` will try to guess the name of the binary to invoke depending on the specifier provided. All package specifiers understood by `npm` may be used with `npx`, including git specifiers, remote tarballs, local directories, or scoped packages.

An optional `@version` may be appended to specify the package version required, which defaults to `latest` only if `<command>` is not in the path. If the command is already present and no explicit version specifier was requested, the existing command will be used.

If a version specifier is included, or if `--package` is used, npx will ignore the version of the package in the current path, if it exists. This can also be forced with the `--ignore-existing` flag.

* `-p, --package <package>` - define the package to be installed. This defaults to the value of `<command>`. This is only needed for packages with multiple binaries if you want to call one of the other executables, or where the binary name does not match the package name. If this option is provided `<command>` will be executed as-is, without interpreting `@version` if it's there. Multiple `--package` options may be provided, and all the packages specified will be installed.

* `--no-install` - If passed to `npx`, it will only try to run `<command>` if it already exists in the current path or in `$prefix/node_modules/.bin`. It won't try to install missing commands.

* `--cache <path>` - set the location of the npm cache. Defaults to npm's own cache settings.

* `--userconfig <path>` - path to the user configuration file to pass to npm. Defaults to whatever npm's current default is.

* `-c <string>` - Execute `<string>` inside a shell. For unix, this will be `/bin/sh -c <string>`. For Windows, it will be `cmd.exe /d /s /c <string>`. Only the first item in `<string>` will be automatically used as `<command>`. Any others _must_ use `-p`.

* `--shell <string>` - The shell to invoke the command with, if any. Defaults to `false`.

* `--shell-auto-fallback [<shell>]` - Generates shell code to override your shell's "command not found" handler with one that calls `npx`. Tries to figure out your shell, or you can pass its name (either `bash`, `fish`, or `zsh`) as an option. See below for how to install.

* `--ignore-existing` - If this flag is set, npx will not look in `$PATH`, or in the current package's `node_modules/.bin` for an existing version before deciding whether to install. Binaries in those paths will still be available for execution, but will be shadowed by any packages requested by this install.

* `-v, --version` - Show the current npx version.

## EXAMPLES

### Running a project-local bin

```
$ npm i -D webpack
$ npx webpack ...
```

### One-off invocation without local installation

```
$ npm rm webpack
$ npx webpack -- ...
$ cat package.json
...webpack not in "devDependencies"...
```

### Invoking a command from a github repository

```
$ npx github:piuccio/cowsay
...or...
$ npx git+ssh://my.hosted.git:cowsay.git#semver:^1
...etc...
```

### Execute a full shell command using one npx call w/ multiple packages

```
$ npx -p lolcatjs -p cowsay -c 'echo "foo" | cowsay | lolcatjs'
...
 _____
< foo >
 -----
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

## SHELL AUTO FALLBACK

You can configure `npx` to run as your default fallback command when you type something in the command line but the command is not found. This includes installing packages that were not found in the local prefix either.

Currently, `zsh`, `bash`, and `fish` are supported. You can access these completion scripts using `npx --shell-auto-fallback <shell>`.

To install permanently, add the relevant line below to your `~/.bashrc`, `~/.zshrc`, `~/.config/fish/config.fish`, or as needed. To install just for the shell session, simply run the line.

You can optionally pass through `--no-install` when generating the fallback to prevent it from installing packages if the command is missing.

### For Bash:

```
$ source <(npx --shell-auto-fallback bash)
```

### For Zsh:

```
$ source <(npx --shell-auto-fallback zsh)
```

### For Fish:

```
$ source (npx --shell-auto-fallback fish | psub)
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
