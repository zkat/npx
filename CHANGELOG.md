# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
