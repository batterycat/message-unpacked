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

## Classification

`classification` describes whether a careful reader can reach a confident
verdict **from the message alone** — not whether the situation would turn out to
be a scam in real life.

- `fraud`: the message contains at least one **decisive red flag**, meaning a
  request no legitimate sender would ever make. The reader can stop without
  further verification.
- `insufficient-evidence`: the message is suspicious but has a **plausible
  legitimate explanation**, so only an independent channel can tell them apart.
  The parcel really might have been ordered by a family member; the classmate
  really might have changed mail providers.
- `trustworthy`: arrives through an existing channel, can be cross-checked
  through a second existing channel, and makes no high-risk request.

### Decisive red flags

Any one of these puts a case in `fraud`:

- Requesting an account secret: password, OTP, verification or recovery code,
  gift-card or top-up serial number.
- Requesting full financial credentials through an unverifiable link.
- Asking the reader to keep it from a parent or trusted adult.
- Asking to install remote-control software or share an online-banking screen.
- Explicitly discouraging use of an official channel ("don't go back to the
  platform's help centre").
- Guaranteed profit, prize, or acceptance **combined with** an up-front payment.

A prize or a deadline on its own is pressure, not proof. Leaving a platform on
its own is risky, not decisive — pair it with another flag before classifying as
`fraud`.

### Keeping the balance

`insufficient-evidence` is the hardest category to write and the most valuable
to teach, because it is the only one where verification is the winning move.
When adding cases, do not let it shrink: a scenario is only genuinely ambiguous
if you can state the innocent explanation in one sentence.

### Writing the three choices

Each choice carries **one verdict and the action that follows from it**. Never
attach an unrelated bad action to an otherwise reasonable verdict — a student who
judges correctly must not lose points for a behaviour the option author bolted
on ("it's a scam, so post their details publicly", "it's a scam, so delete every
shopping account"). Straw-man options teach students to pick the third answer by
habit rather than to think.

In an `insufficient-evidence` case, the premature `fraud` verdict scores around
60: the action is usually safe, but the `reasoning` must name the **concrete cost
of being wrong** — the parcel really was from a family member and gets returned,
the classmate really did change mail providers and the report is missed, the
friend really was in trouble and now cannot reach anyone. Over-rejection has a
price, and saying what it is here is the second lesson of this category.

Ethical guidance that no longer fits in an option — not naming suspects
publicly, not forwarding unverified claims — belongs in `debrief.safeActions`,
where it stays available without becoming a scoring trap.

### Scoring

Scores are fixed bands, chosen by **what the action actually gives away**, not by
how wrong the verdict feels. Pick the band mechanically:

| Score | The action                                                                                                                                                                                                                                          |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 100   | Correct verdict, safe action.                                                                                                                                                                                                                       |
| 60    | Action is safe; only the verdict is premature or over-cautious.                                                                                                                                                                                     |
| 20    | The reasoning method itself is broken — judging by the message's _form_ ("anything by SMS is a scam") rather than its content. The action is harmless, but the habit misjudges every future message, so it scores below a merely premature verdict. |
| 40    | Touches the attacker's channel or page — opens the link, joins the group, replies, keeps asking, starts a screen share — but hands over nothing.                                                                                                    |
| 15    | Hands over a secret, sensitive personal data, or a payment, or installs or downloads something. Reduced-dose versions count in full: half a verification code, a weakened password, one field on a phishing form, "just logging in".                |
| 0     | Complies with the request.                                                                                                                                                                                                                          |

The 15 band exists to kill a specific student intuition: that giving away part
of a secret, or a smaller amount of money, is a safe way to test the other side.
It is not, and a partial disclosure must never score higher than merely clicking
a link. Before the bands were fixed, "half a verification code" scored anywhere
from 10 to 30 while "open the suspicious page but type nothing" scored up to 55 —
the library was teaching the opposite of the intended lesson.

Every `fraud` case needs a middle option that is genuinely flawed. Do not offer a
fully safe action under a "not enough evidence" label and then dock it: if the
action is identical to the 100-point action, the student is being punished for
wording alone.

### Trust signals that do not count

A message asserting its own safety ("we will never ask for your password") is
not evidence — fraudulent messages write the same sentence. Clues must rest on
what the message **actually does or omits**, which the reader can observe, or on
whether a second existing channel confirms it.

## Terminology

- **家長 / 家人**: cases for stage `1-2` say 家長 throughout — a seven-year-old is
  being told to hand the situation to a specific responsible adult, not to the
  household in general. Older stages may use 家人 where it reads naturally.
  Exception: when the scenario's impersonated sender _is_ a relative, describe
  them as themselves (真正的舅舅…), because 家長 would be simply wrong.
- **平台**, not 平臺, in case text. Proper nouns keep 臺 (臺灣, 臺南市, 新臺幣).
- **`sources[].title` is transcribed, never composed.** Copy the headline exactly
  as published — do not shorten it, drop a clause, or tidy the punctuation,
  however unwieldy the original. All four cited headlines were originally
  paraphrases, which made them unfindable at the source. Re-check the live URL
  and update `accessedAt` when you touch a citation.
- Likewise, **never rewrite a title in a bulk text pass.** A repo-wide 平臺→平台
  replacement silently corrupted a police-agency headline; check `git diff` for
  `title:` lines after any sweeping change.

## Sensitive content and trusted adults

`sensitiveContent` warns the teacher _before_ they put a case in front of a
class. Use this controlled vocabulary so the values stay filterable; extend it
deliberately rather than inventing a synonym:

- `金錢損失` — the scenario involves losing money. (Do not also write
  `財物損失` or `重大財物損失`; documented cases already carry the real figure in
  `impact`.)
- `金融資料` — bank, card, or online-banking credentials are solicited.
- `要求對大人保密` — the sender tells a child not to tell a parent or teacher.
- `人身安全疑慮` — the scenario raises injury, illness, or someone being in danger.
- `恐懼訴求` — the message works by frightening the reader.
- `兒少受詐` — the case depicts a minor who was actually defrauded.

`要求對大人保密` deserves particular care. "Don't tell your mum" is a fraud
technique, but it is also the core grooming script, so the same words may land on
a student who has met them outside a fraud context. Cases carrying this tag
should be introduced with the teacher already knowing it is there.

If `debrief` tells the reader to involve a parent or teacher, then
`trustedAdultRecommended` must be `true`. The two drifted apart once already.

## The `law` dimension

Declaring `law` obliges the debrief to carry actual legal content. It covers two
distinct things, and a case should be explicit about which one applies:

- **The reader's own criminal exposure.** Fake job, fake part-time work, and
  investment-group cases routinely escalate to asking for the student's bank
  account, or asking them to collect and pass on cash. Doing so can be treated as
  aiding fraud or money laundering _even when the student was deceived too_, and
  being under 18 does not remove liability — it routes the case to the juvenile
  court. A frozen "warning account" also affects every other account in their
  name, for years. This is the single highest-stakes lesson for the 10-12 band
  and must not be left implicit.
- **Remedies and procedure.** Where the reader is purely a victim, `law` means
  the steps that actually preserve their claim: reporting to the police and
  obtaining the case acknowledgement slip, filing a card chargeback before the
  deadline, and capturing evidence before the other side deletes it.

Describe consequences in terms of risk categories and procedure. Do not cite
statute numbers in case content — they change, and a stale citation in teaching
material is worse than none. Point readers to 165 or a qualified adult instead.

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

The teacher setup supports all five learning stages: `1-2`, `3-4`, `5-6`,
`7-9`, and `10-12`. Declare the narrowest suitable stage rather than marking
every case for every age group. A case may support more than one adjacent stage
when the reading load, decision complexity, and trusted-adult guidance remain
appropriate for each declared group.

## Safe Examples

Use reserved destinations such as `example.com` and fictional names. Never place
a real suspicious URL, account, phone number, or personal identifier in a case.
Response actions currently use the fixed pair
`anti-fraud.online-report` and `anti-fraud.consult`, resolved through each
locale's resource registry instead of repeating official URLs in every case.
Change that pair only with an accompanying governance and resource-register
review.
