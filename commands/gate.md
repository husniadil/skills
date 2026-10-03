---
description: Find and run this project's quality gate (format, lint, typecheck, tests) and show the real output
argument-hint: [subset, e.g. lint | test <filter>]
---

Run the project's gate. Argument `$ARGUMENTS` narrows it (a step name, or a test filter); empty means the full gate.

Find the gate before running anything, in this order, and stop at the first that applies:

1. `CLAUDE.md` or `AGENTS.md` names a gate command (for example `just check`). Use exactly that.
2. A task runner defines one: `justfile` (`check`, `ci`, `test`), `Makefile` (`check`, `lint`, `test`), `package.json` scripts (`lint`, `typecheck`, `format:check`, `test`), `pyproject.toml` with `uv` (`uv run ruff check`, `uv run ruff format --check`, `uv run pyright` or `mypy`, `uv run pytest`), `Cargo.toml` (`cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test` or nextest), `go.mod` (`gofmt -l .`, which fails when it prints any path even though it exits 0, `go vet ./...`, `go test ./...`).
3. Nothing found: say so and stop. Do not invent a gate.

Run the steps in order: format check, lint, typecheck, tests. Do not auto-fix formatting unless the project's gate itself does; report the diff instead. If one step fails, still run the remaining steps so the report is complete, then report all failures together.

Report per step: the exact command, pass or fail, and the relevant output lines for failures (not the whole log). State which gate source was used (step 1, 2, or 3 above). If any step was skipped or narrowed, say so; never report "passing" for a gate that did not fully run.
