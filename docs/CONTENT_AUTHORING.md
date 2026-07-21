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

`locale` describes the case text, independently of the website interface. Use
`zh-TW` for reviewed Traditional Chinese cases and `en` for reviewed English
cases. A direct translation or localized adaptation of the same teaching case
keeps its `translationGroupId`; a separately researched locale-specific case
may use its own group. Every locale version has its own ID, content version,
sources, response resources, and review date. Do not paste Chinese text into an
English case as a placeholder or publish an unreviewed machine translation.

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

For the reviewed Traditional Chinese library, `sensitiveContent` warns the
teacher _before_ they put a case in front of a class. Use this controlled
vocabulary so the values stay filterable; extend it deliberately rather than
inventing a synonym:

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

The grades 10–12 English demo currently leaves `sensitiveContent` empty. Its
teacher area and English guide therefore use a blanket pilot warning and
require teachers to preview every selected case. This is not a reviewed English
per-case taxonomy. Do not add an English warning tag until its wording and
classroom use have received a separate editorial review.

## The `law` dimension

Declaring `law` obliges the debrief to carry actual legal content. It covers two
distinct things, and a case should be explicit about which one applies:

- **The reader's own criminal exposure.** In the reviewed Traditional Chinese
  library, fake job, fake part-time work, and investment-group cases routinely
  escalate to asking for the student's bank account, or asking them to collect
  and pass on cash. The explanation may cover the resulting investigation,
  account restrictions, and possible legal consequences without declaring the
  learner guilty. The grades 10–12 English demo must likewise avoid categorical
  statements such as "this is a crime" or "being tricked is not a defense";
  describe observable risk and note that what a person knew and did matters.
- **Remedies and procedure.** Where the reader is purely a victim, `law` means
  the steps that actually preserve their claim: reporting to the police and
  obtaining the case acknowledgement slip, filing a card chargeback before the
  deadline, and capturing evidence before the other side deletes it.

Describe consequences in terms of risk categories and procedure. Do not cite
statute numbers in case content — they change, and a stale citation in teaching
material is worse than none. Point readers to the locale's registered official
response resources or a qualified adult instead.

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

`learning.topicId` is the stable, locale-neutral filter serialized in teacher
activity links. It must be one of the IDs exported by
`src/domain/cases/topics.ts`. `learning.topic` is the localized display label
shown in the teacher setup. `learning.contexts` contains more specific
situations used for cataloguing and future search. Do not use translated labels
as identifiers or add every context to the teacher topic list.

The Traditional Chinese teacher setup supports all five learning stages:
`1-2`, `3-4`, `5-6`, `7-9`, and `10-12`. The English demo is intentionally fixed
to `10-12`. Declare the narrowest suitable stage rather than marking every case
for every age group. A case may support more than one adjacent stage when the
reading load, decision complexity, and trusted-adult guidance remain
appropriate for each declared group.

## Coverage target

The unit of coverage is one **topic × stage** cell, because that is what the
teacher setup draws from. A 30-minute activity pulls about six cases out of a
single cell, so a thin cell repeats itself the second time a class uses it.

Aim for **four cases per cell**, in a fixed shape:

| Per cell                | Count | Why                                                                                          |
| ----------------------- | ----- | -------------------------------------------------------------------------------------------- |
| `fraud`                 | 2     | One obvious, one that takes thought. A single example does not show that a technique varies. |
| `insufficient-evidence` | 1     | The only category where verifying is the winning move.                                       |
| `trustworthy`           | 1     | The counterweight. Without it students learn that everything is a scam and stop reading.     |

Four is deliberate. Three (1/1/1) leaves `fraud` unable to show variation; six
doubles the writing and review cost for little teaching gain, because what
matters is that all three verdicts are present, not that any one of them is
numerous.

Fill cells completely rather than spreading thinly. A finished stage that a
teacher can rely on is more useful than every stage half-covered, and it is
easier for a contributor to extend — the shape of the gap is obvious.

Two failure modes are worth watching for, both of which this library has had:

- A topic with no `trustworthy` case at all. Students then learn that the whole
  subject — gaming, investing, shopping — contains nothing genuine.
- `trustworthy` cases clustering in one topic. When five of six sat under school
  notices, the lesson on offer was "school messages can be real, nothing else
  is."

The zh-TW set targets all five stages. The `en` set currently covers `10-12`
completely and does not claim the others; say so in the README rather than
publishing partial stages.

## Safe Examples

Use reserved destinations such as `example.com` and fictional names. Never place
a real suspicious URL, account, phone number, or personal identifier in a case.
Response actions default to the fixed pair `anti-fraud.online-report` and
`anti-fraud.consult`, resolved through each locale's resource registry. Do not
repeat the pair or official URLs in case YAML. Change the schema-owned default
only with an accompanying constitution, documentation, validator, and resource-
register review.
