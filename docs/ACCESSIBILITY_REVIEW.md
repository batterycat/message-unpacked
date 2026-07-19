# Accessibility Review

Review date: 2026-07-19

Scope: the Traditional Chinese home and activity flows, the English
availability states, the teacher configurator, one complete student activity,
one projector activity, a documented-case debrief, and the 320 px layout.

## Automated checks

- axe-core reports no detectable WCAG 2.0/2.1 A or AA violations on the four
  core routes.
- A complete three-case activity and its results screen are included in the
  accessibility scan.
- Chromium keyboard regression coverage verifies the skip link, answer
  activation, and teacher activity generation.
- Responsive coverage verifies that the teacher controls remain available and
  that the document does not overflow horizontally at 320 px.

## Keyboard-oriented review

The flow was exercised with Chromium keyboard events and visually inspected in
the local browser.

| Check                                        | Result | Notes                                                               |
| -------------------------------------------- | ------ | ------------------------------------------------------------------- |
| First focus target is “skip to content”      | Pass   | A visible high-contrast focus outline is present                    |
| Skip link moves focus to `<main>`            | Pass   | Both home and standalone activity pages use a focusable main target |
| Scenario choices activate with Enter         | Pass   | Feedback and score appear without pointer input                     |
| Teacher link generation activates with Enter | Pass   | QR code and launch controls appear in the polite live region        |
| No timed interaction is required             | Pass   | Students and teachers can pause indefinitely                        |
| Focus meaning does not rely on colour only   | Pass   | Outline, labels, icons, and text remain visible                     |

## Screen-reader-oriented structural review

- Every page declares its interface language.
- The pages expose header, navigation, main, section, and footer landmarks with
  a consistent heading order.
- Form controls use visible labels and the mode choices share a fieldset and
  legend.
- Decorative icons are hidden from assistive technology.
- Score, debrief, and teacher-link updates use polite live regions rather than
  forced focus jumps.
- Provenance, classifications, scores, and response guidance are expressed in
  text and do not depend on colour.
- External official destinations have descriptive link text; phone actions are
  explicit links rather than automatic calls.

## Follow-up before a broad public launch

A short session with VoiceOver + Safari and NVDA + Firefox/Chrome should still
be completed by a human reviewer using the target school devices. Automated
semantics and browser inspection reduce risk but do not replace feedback from
assistive-technology users. Record any findings here with device, browser,
screen reader, version, and remediation status.

Current result: **pass for the MVP demonstration, with assistive-technology
device testing retained as a release follow-up**.
