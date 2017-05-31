'use strict'

const POSIX = `
command_not_found_handler() {
  # Do not run within a pipe
  if test ! -t 1; then
    echo "command not found: $1"
    return 127
  fi

  echo "Trying with npx..."
  npx $*
  return $?
}`

const FISH = `
function __fish_command_not_found_on_interactive --on-event fish_prompt
  functions --erase __fish_command_not_found_handler
  functions --erase __fish_command_not_found_setup

  function __fish_command_not_found_handler --on-event fish_command_not_found
    echo "Trying with npx..."
    npx $argv
  end

  functions --erase __fish_command_not_found_on_interactive
end`

module.exports = function autoFallback (shell) {
  const BASH_VERSION = process.env.BASH_VERSION
  const SHELL = process.env.SHELL
  const ZSH_VERSION = process.env.ZSH_VERSION

  if (shell === 'bash' || BASH_VERSION || /bash/.test(SHELL)) {
    return POSIX.replace('handler()', 'handle()')
  }

  if (shell === 'zsh' || ZSH_VERSION || /zsh/.test(SHELL)) {
    return POSIX
  }

  if (shell === 'fish' || /fish/.test(SHELL)) {
    return FISH
  }

  console.error('Only Bash, Zsh, and Fish shells are supported :(')
  process.exit(1)
}
