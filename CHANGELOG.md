# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="3.0.0"></a>
# [3.0.0](https://github.com/zkat/npx/compare/v2.1.0...v3.0.0) (2017-06-03)


### Bug Fixes

* **args:** accept argv as arg and fix minor bugs ([46f10fe](https://github.com/zkat/npx/commit/46f10fe))
* **deps:** explicitly add mkdirp and rimraf to devDeps ([832c75d](https://github.com/zkat/npx/commit/832c75d))
* **docs:** misc tweaks to docs ([ed70a7b](https://github.com/zkat/npx/commit/ed70a7b))
* **exec:** escape binaries and args to cp.exec (#18) ([55d6a11](https://github.com/zkat/npx/commit/55d6a11))
* **fallback:** shells were sometimes ignored based on $SHELL ([07b7efc](https://github.com/zkat/npx/commit/07b7efc))
* **get-prefix:** nudge isRootPath ([1ab31eb](https://github.com/zkat/npx/commit/1ab31eb))
* **help:** correctly enable -h and --help ([adc2f45](https://github.com/zkat/npx/commit/adc2f45))
* **startup:** delay loading some things to speed up startup ([6b32bf5](https://github.com/zkat/npx/commit/6b32bf5))


### Features

* **cmd:** do some heuristic guesswork on default command names (#23) ([2404420](https://github.com/zkat/npx/commit/2404420))
* **ignore:** add --ignore-existing option (#20) ([0866a83](https://github.com/zkat/npx/commit/0866a83))
* **install:** added --no-install option to prevent install fallbacks ([a5fbdaf](https://github.com/zkat/npx/commit/a5fbdaf))
* **package:** multiple --package options are now accepted ([f2fa6b3](https://github.com/zkat/npx/commit/f2fa6b3))
* **save:** remove all save-related functionality (#19) ([ab77f6c](https://github.com/zkat/npx/commit/ab77f6c))
* **shell:** run -c strings inside a system shell (#22) ([17db461](https://github.com/zkat/npx/commit/17db461))


### BREAKING CHANGES

* **save:** npx can no longer be used to save packages locally or globally. Use an actual package manager for that, instead.



<a name="2.1.0"></a>
# [2.1.0](https://github.com/zkat/npx/compare/v2.0.1...v2.1.0) (2017-06-01)


### Features

* **opts:** add --shell-auto-fallback (#7) ([ac9cb40](https://github.com/zkat/npx/commit/ac9cb40))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/zkat/npx/compare/v2.0.0...v2.0.1) (2017-05-31)


### Bug Fixes

* **exec:** use command lookup joined with current PATH ([d9175e8](https://github.com/zkat/npx/commit/d9175e8))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/zkat/npx/compare/v1.1.1...v2.0.0) (2017-05-31)


### Bug Fixes

* **npm:** manually look up npm path for Windows compat ([0fe8fbf](https://github.com/zkat/npx/commit/0fe8fbf))


### Features

* **commands:** -p and [@version](https://github.com/version) now trigger installs ([9668c83](https://github.com/zkat/npx/commit/9668c83))


### BREAKING CHANGES

* **commands:** If a command has an explicit --package option, or if the command has an @version part, any version of the command in $PATH will be ignored and a regular install will be executed.



<a name="1.1.1"></a>
## [1.1.1](https://github.com/zkat/npx/compare/v1.1.0...v1.1.1) (2017-05-30)


### Bug Fixes

* **docs:** make sure man page gets installed ([2aadc16](https://github.com/zkat/npx/commit/2aadc16))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/zkat/npx/compare/v1.0.2...v1.1.0) (2017-05-30)


### Bug Fixes

* **help:** update usage string for help ([0747cff](https://github.com/zkat/npx/commit/0747cff))
* **main:** exit if no package was parsed ([cdb579d](https://github.com/zkat/npx/commit/cdb579d))
* **opts:** allow -- to prevent further parsing ([db7a0e4](https://github.com/zkat/npx/commit/db7a0e4))


### Features

* **updates:** added update-notifier ([8dc91d4](https://github.com/zkat/npx/commit/8dc91d4))



<a name="1.0.2"></a>
## [1.0.2](https://github.com/zkat/npx/compare/v1.0.1...v1.0.2) (2017-05-30)


### Bug Fixes

* **pkg:** bundle deps to guarantee global install precision ([3e21217](https://github.com/zkat/npx/commit/3e21217))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/zkat/npx/compare/v1.0.0...v1.0.1) (2017-05-30)


### Bug Fixes

* **build:** add dummy test file to let things build ([6199eb6](https://github.com/zkat/npx/commit/6199eb6))
* **docs:** fix arg documentation in readme/manpage ([d1cf44c](https://github.com/zkat/npx/commit/d1cf44c))
* **opts:** add --version/-v ([2633a0e](https://github.com/zkat/npx/commit/2633a0e))



<a name="1.0.0"></a>
# 1.0.0 (2017-05-30)


### Features

* **npx:** initial working implementation ([a83a67d](https://github.com/zkat/npx/commit/a83a67d))
