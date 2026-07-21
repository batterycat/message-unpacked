# Live classroom interaction

Live interaction is optional and separate from the static activity system. The
teacher projects the full case and controls opening, closing, reveal, and
explanation. Learner phones show only the case number, answer choices, and
submission status.

## Teacher flow

1. Choose **Live classroom interaction** from the teacher area.
2. Select a topic and duration, then review the proposed cases.
3. Create a room and project its QR Code, join URL, and room code.
4. Open a case. While voting is open, the teacher sees joined and answered
   counts, not which option is leading.
5. Close and reveal the case to show the anonymous distribution and class
   average on the projector.
6. Continue or end the room after the final summary.

The score is a discussion prompt, not a personal grade. An unanswered response
is not counted as zero, and the service does not identify who chose an option.

## Privacy and recovery

Learners do not enter names, email addresses, school accounts, or roster data.
The service uses a random participation token and the current case answer. It
removes per-participant current answers on reveal and does not build a
cross-question individual history.

A refreshed tab can reconnect with its short-lived browser token. If the live
service is unavailable, switch to a static projector activity; the learning
core does not depend on the backend.

The maintainer-hosted service is a best-effort demonstration. Schools that need
controlled capacity should deploy a compatible service and complete their own
privacy and security review. Technical instructions are in the repository's
[deployment guide](https://github.com/batterycat/message-unpacked/blob/main/docs/DEPLOYMENT.md#connect-a-compatible-classroom-backend).
