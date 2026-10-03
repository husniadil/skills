---
description: Before /compact, save what would be lost and write a re-orientation prompt to paste after compaction
---

The conversation is about to be compacted. Two jobs, in order.

1. Save what only lives in this conversation. Check each of these and act, then list what was done:
   - Uncommitted changes in the working tree: commit them if they form a coherent unit (stage by path, never `-A`), otherwise say what is there and why it stays uncommitted.
   - Decisions made in chat that no file records yet: write them where they belong (the plan file, `CLAUDE.local.md`, a doc) or into the scratchpad if nothing fits.
   - Findings, measurements, or command outputs that a later step depends on: write them to the scratchpad with enough context to be reused.
   - Open questions the user has not answered yet: keep them in the prompt below rather than letting them drop.
   If nothing needs saving, say so.

2. Write a re-orientation prompt for the next context, in one fenced `text` block, ready to paste as the first message after `/compact`. Written in English regardless of the conversation's language. Contents, in this order:
   - Repo path and branch; the session's goal in one sentence.
   - Done so far, with evidence: commit hashes, files written, tests that passed.
   - In progress: what is being done right now and exactly where it stopped.
   - Decisions already made, so they are not reopened. One line each.
   - Next steps, numbered, starting from the very next action.
   - Files currently being edited or that must be read before continuing.
   - Pending questions for the user, if any.
   - Chat register: the language and pronoun pair in use, so the voice does not drift.

Make the prompt as short as it can be without dropping anything the next context needs: compress, do not omit. Everything in it must be true of the files and repo right now, not of an earlier state.
