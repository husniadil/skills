---
name: ask-user-question
description: Ask the user a question through the AskUserQuestion tool, with options to pick from
disable-model-invocation: true
---

Invoke AskUserQuestion.

When there are more questions than one call takes, ask the rest in another
call once the user has answered, and keep going until every question is asked.
Drop any question an earlier answer already settled.
