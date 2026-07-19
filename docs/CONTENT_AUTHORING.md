# Case Authoring Guide

Cases are human-reviewable YAML files under `content/cases/`. Start from
`_template.yaml`, keep the example unpublished, and run
`pnpm validate:content` before opening a pull request.

The template points compatible YAML editors to `content/case.schema.json` for
field completion and immediate structural feedback. The schema is generated
from the same Zod contract used by the application. After changing the
contract, run `pnpm schema:generate`; CI runs `pnpm schema:check` to prevent the
editor schema from drifting.

## Language and Translation

`locale` describes the case text, independently of the website interface.
Initial cases use `zh-TW`. A future English translation uses `en`, keeps the
same `translationGroupId`, and has its own ID, content version, and review date.
Do not paste Chinese text into an English case as a placeholder.

## Provenance

- `documented`: adapted from a specific documented event.
- `composite`: combines multiple documented events.
- `classic-pattern`: demonstrates a recurring technique without claiming one
  specific event.
- `fictional`: created solely for teaching.

Documented and composite cases require sources and a sourced event summary.
Paraphrase facts; do not copy articles, screenshots, messages, or images without
compatible permission.

## Teacher topic and contexts

`learning.topic` is the single broad label shown in the teacher's quick setup
and should stay stable and easy to scan. `learning.contexts` contains the more
specific situations used for cataloguing and future search. Do not add every
context to the teacher topic list.

## Safe Examples

Use reserved destinations such as `example.com` and fictional names. Never place
a real suspicious URL, account, phone number, or personal identifier in a case.
Response actions reference stable registry IDs instead of repeating official
URLs in each case.
