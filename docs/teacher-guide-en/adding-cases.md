# Add or localize cases

Cases are reviewed YAML content, not hard-coded screens. Start with
[`content/cases/_template.yaml`](https://github.com/batterycat/message-unpacked/blob/main/content/cases/_template.yaml)
and read the repository's
[content-authoring guide](https://github.com/batterycat/message-unpacked/blob/main/docs/CONTENT_AUTHORING.md)
and
[case-review checklist](https://github.com/batterycat/message-unpacked/blob/main/docs/CASE_REVIEW_CHECKLIST.md).

## English pilot requirements

- Use locale `en` and the current published stage `10-12`.
- Use a stable `translationGroupId` when a case corresponds to another locale,
  but review the English text as its own educational work.
- Localize institutions, official response resources, legal claims, and common
  communication patterns for the United States. Do not translate Taiwan-only
  procedures as if they applied in the US.
- Record reviewable sources for documented and composite cases, including the
  relevant date, access date, scope, and usage note.
- Use reserved domains, fictional identities, and inert teaching content.
- Preserve the approximate fraud / insufficient-evidence / trustworthy balance
  and include trustworthy examples in every topic.
- Do not add a sensitive-content label merely by translating a Chinese label.
  It requires a separate English-language safeguarding review. Until that
  review exists, the blanket pilot warning remains mandatory.

Run the validation and test commands listed in the root README before opening a
pull request. Describe sources, licensing, age appropriateness, localization,
and safety decisions in the pull request.
