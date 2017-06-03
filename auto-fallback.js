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

module.exports = autoFallback
function autoFallback (shell, fromEnv) {
  if (shell.includes('bash')) {
    return POSIX.replace('handler()', 'handle()')
  }

  if (shell.includes('zsh')) {
    return POSIX
  }

  if (shell.includes('fish')) {
    return FISH
  }

  if (fromEnv) {
    return autoFallback(fromEnv)
  }

  console.error('Only Bash, Zsh, and Fish shells are supported :(')
}
