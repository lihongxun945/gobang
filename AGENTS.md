# Workspace notes

## Editing this WSL workspace from Codex Desktop

The native Windows sandbox may fail to open existing files under the
`\\wsl.localhost\\Ubuntu-26.04` workspace with `helper_unknown_error` even
though read-only WSL commands work.

When this specific UNC sandbox failure occurs:

1. Do not repeatedly retry direct UNC edits and do not overwrite files with
   shell redirection, PowerShell `Set-Content`, or ad-hoc scripts.
2. Create a unified diff with `apply_patch` in the session's writable local
   Windows artifacts directory.
3. Run `git apply --check <patch>` from `/home/xun/github/gobang` inside WSL.
4. Only if validation succeeds, run `git apply <patch>` from the same verified
   repository directory.
5. Run `git diff --check`, inspect the changed content, execute relevant tests,
   and remove the temporary patch artifact.

This fallback preserves patch-based editing and makes WSL writes validated and
atomic. Use normal `apply_patch` directly when the UNC sandbox is healthy.

## Node.js inside WSL

This repository uses the Ubuntu installation managed by nvm. Do not invoke the
Windows `node.exe`, `npm`, or `npm.cmd` for project commands: Windows CMD cannot
use the WSL UNC repository as its working directory and may fall back to
`C:\\Windows`.

For non-interactive Codex commands, load the user's nvm setup through an
interactive Ubuntu shell, for example:

```sh
wsl.exe -d Ubuntu-26.04 --cd /home/xun/github/gobang bash -ic 'npm start'
