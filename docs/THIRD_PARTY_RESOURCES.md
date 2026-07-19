# Third-Party Resources Register

Review date: 2026-07-19

This register covers external software, workflow Actions, factual sources,
datasets, fonts, icons, media, quotations, screenshots, and trademarks used by
the project. An entry records review; it does not relicense the resource.

## Entry Template

| Field               | Required information                                                    |
| ------------------- | ----------------------------------------------------------------------- |
| Resource            | Exact name and pinned version or retrieval date                         |
| Category            | Dependency, Action, source, font, icon, media, dataset, trademark, etc. |
| Owner/publisher     | Rights holder or authoritative publisher                                |
| Canonical source    | Official repository or publication URL                                  |
| Project use         | Where and why it is used                                                |
| License/permission  | SPDX expression or documented permission/status                         |
| Attribution/notices | Required credit, notice, source offer, or restrictions                  |
| Reviewed            | Date and reviewer/status                                                |

## Direct Software Dependencies

Exact installed versions are pinned in `pnpm-lock.yaml`. The lockfile inventory
remains authoritative for version-specific release review.

| Resource                            | Category               | Owner/publisher                           | Canonical source                                                                    | Project use                                                        | License/permission                            | Attribution/notices                                                             | Reviewed                                             |
| ----------------------------------- | ---------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Astro                               | Dependency             | Astro Technology Company and contributors | https://github.com/withastro/astro                                                  | Static site and build                                              | MIT                                           | Preserve license                                                                | 2026-07-18, approved                                 |
| React and React DOM                 | Dependency             | Meta and contributors                     | https://github.com/facebook/react                                                   | Interactive UI                                                     | MIT                                           | Preserve license                                                                | 2026-07-18, approved                                 |
| TypeScript                          | Development dependency | Microsoft and contributors                | https://github.com/microsoft/TypeScript                                             | Type checking                                                      | Apache-2.0                                    | Preserve license/NOTICE if distributed                                          | 2026-07-18, approved                                 |
| `@types/node`                       | Development dependency | DefinitelyTyped contributors              | https://github.com/DefinitelyTyped/DefinitelyTyped                                  | Node.js types for scripts and Playwright configuration             | MIT                                           | Preserve license                                                                | 2026-07-19, approved                                 |
| XState and `@xstate/react`          | Dependency             | Stately and contributors                  | https://github.com/statelyai/xstate                                                 | Scenario state machine                                             | MIT                                           | Preserve license                                                                | 2026-07-18, approved                                 |
| Zod                                 | Dependency             | Colin McDonnell and contributors          | https://github.com/colinhacks/zod                                                   | Content validation                                                 | MIT                                           | Preserve license                                                                | 2026-07-18, approved                                 |
| YAML                                | Dependency             | eemeli and contributors                   | https://github.com/eemeli/yaml                                                      | Case-file parsing                                                  | ISC                                           | Preserve license                                                                | 2026-07-18, approved                                 |
| Vitest                              | Development dependency | Vitest contributors                       | https://github.com/vitest-dev/vitest                                                | Unit/component tests                                               | MIT                                           | Preserve license                                                                | 2026-07-18, approved                                 |
| Testing Library                     | Development dependency | Testing Library contributors              | https://github.com/testing-library                                                  | Component tests                                                    | MIT                                           | Preserve license                                                                | 2026-07-18, approved                                 |
| Playwright                          | Development dependency | Microsoft and contributors                | https://github.com/microsoft/playwright                                             | End-to-end tests                                                   | Apache-2.0                                    | Preserve license/NOTICE                                                         | 2026-07-18, approved                                 |
| axe-core and `@axe-core/playwright` | Development dependency | Deque Systems                             | https://github.com/dequelabs/axe-core and https://github.com/dequelabs/axe-core-npm | Accessibility tests only                                           | MPL-2.0; verify exact pinned release metadata | Preserve MPL and bundled third-party notices; modified covered files remain MPL | 2026-07-18, conditionally approved                   |
| pnpm                                | Build tool             | pnpm contributors                         | https://github.com/pnpm/pnpm                                                        | Package management                                                 | MIT                                           | Preserve license when redistributed                                             | 2026-07-18, approved                                 |
| ESLint ecosystem packages           | Development dependency | OpenJS Foundation and contributors        | https://github.com/eslint/eslint                                                    | Linting                                                            | MIT; verify each plugin in lockfile           | Preserve licenses                                                               | 2026-07-18, approved pending lockfile reconciliation |
| Prettier and Astro plugin           | Development dependency | Prettier/Astro contributors               | https://github.com/prettier/prettier                                                | Formatting                                                         | MIT; verify plugin in lockfile                | Preserve licenses                                                               | 2026-07-18, approved pending lockfile reconciliation |
| cross-env                           | Development dependency | Kent C. Dodds and contributors            | https://github.com/kentcdodds/cross-env                                             | Cross-platform environment flag for disabling build-tool telemetry | MIT                                           | Preserve license                                                                | 2026-07-18, approved                                 |
| Phosphor Icons for React 2.1.10     | Dependency / icon pack | Phosphor Icons contributors               | https://github.com/phosphor-icons/react                                             | Interface icons, including the open-book primary action icon       | MIT                                           | Preserve license                                                                | 2026-07-18, approved                                 |
| qrcode.react 4.2.0                  | Dependency             | Paul O’Shannessy and contributors         | https://github.com/zpao/qrcode.react                                                | Generate shareable activity QR Codes locally as SVG                | ISC; bundled QR Code Generator is MIT         | Preserve ISC and bundled MIT license notices; no network service is used        | 2026-07-19, approved                                 |

Lockfile reconciliation found permissive BlueOak-1.0.0 utility packages and
optional sharp/libvips platform packages that include LGPL-3.0-or-later terms.
They are reviewed build-time transitives and are not emitted into the static
site. If a future release distributes `node_modules`, a container image, or the
native libvips binaries, its LGPL notices and source/relocation obligations must
be reviewed again for that distribution.

## Workflow Actions

| Resource                           | Category      | Owner/publisher   | Canonical source                                 | Project use                        | License/permission | Attribution/notices | Reviewed             |
| ---------------------------------- | ------------- | ----------------- | ------------------------------------------------ | ---------------------------------- | ------------------ | ------------------- | -------------------- |
| `actions/checkout@v4`              | GitHub Action | GitHub            | https://github.com/actions/checkout              | CI source checkout                 | MIT                | Preserve license    | 2026-07-18, approved |
| `actions/setup-node@v4`            | GitHub Action | GitHub            | https://github.com/actions/setup-node            | CI Node and pnpm cache setup       | MIT                | Preserve license    | 2026-07-18, approved |
| `pnpm/action-setup@v4`             | GitHub Action | pnpm contributors | https://github.com/pnpm/action-setup             | CI pnpm installation               | MIT                | Preserve license    | 2026-07-18, approved |
| `actions/configure-pages@v5`       | GitHub Action | GitHub            | https://github.com/actions/configure-pages       | GitHub Pages build configuration   | MIT                | Preserve license    | 2026-07-19, approved |
| `actions/upload-pages-artifact@v4` | GitHub Action | GitHub            | https://github.com/actions/upload-pages-artifact | Upload the static `dist/` artifact | MIT                | Preserve license    | 2026-07-19, approved |
| `actions/deploy-pages@v4`          | GitHub Action | GitHub            | https://github.com/actions/deploy-pages          | Publish the Pages artifact         | MIT                | Preserve license    | 2026-07-19, approved |

## Hosted Publishing Services

| Resource | Category                     | Owner/publisher | Canonical source         | Project use                                                            | License/permission                                                              | Attribution/notices                                                                                                         | Reviewed             |
| -------- | ---------------------------- | --------------- | ------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| GitBook  | Hosted documentation service | GitBook         | https://www.gitbook.com/ | Publish the public teacher guide; no GitBook software is redistributed | Hosted-service terms apply; original project documentation remains CC BY-SA 4.0 | Link back to the repository and preserve the project content license; do not treat the service as an open-source dependency | 2026-07-19, approved |

## Official Taiwan Response Resources

These are factual links and service names, not copied educational content.

| Resource                         | Category                               | Owner/publisher        | Canonical source                                   | Project use                                      | License/permission                                  | Attribution/notices                     | Reviewed             |
| -------------------------------- | -------------------------------------- | ---------------------- | -------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------- | --------------------------------------- | -------------------- |
| 165全民防騙網／165反詐騙諮詢專線 | Official service reference             | 內政部警政署           | https://165.npa.gov.tw/                            | Localized consultation and verification guidance | Factual reference/link only; no site content copied | Identify official destination and owner | 2026-07-18, approved |
| 165反詐騙報案／檢舉說明          | Official source                        | 內政部警政署刑事警察局 | https://www.cib.npa.gov.tw/ch/app/folder/2065      | Verify service purpose and terminology           | Facts paraphrased; link to source                   | Identify publisher and review date      | 2026-07-18, approved |
| 網路詐騙通報查詢網               | Officially supported service reference | 數位發展部數位產業署   | https://moda.gov.tw/ADI/antifraud/af-toolbox/16212 | Online fraud query/reporting guidance            | Factual reference/link only; no site content copied | Identify official destination and owner | 2026-07-18, approved |

## Case Factual Sources

These official pages support paraphrased facts in documented teaching cases.
No article text, photograph, screenshot, or brand artwork is copied into the
project.

| Resource                         | Category        | Owner/publisher        | Canonical source                                                                                           | Project use                        | License/permission                              | Attribution/notices                         | Reviewed             |
| -------------------------------- | --------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------- | ------------------------------------------- | -------------------- |
| 免費遊戲幣誘騙兒少提供 OTP 案例  | Official source | 內政部警政署刑事警察局 | https://www.cib.npa.gov.tw/ch/app/news/view?id=1887&module=news&serno=b6055f8b-ee3d-42ec-a808-e59b1548f25f | `free-game-coins-otp` case facts   | Facts paraphrased; no expressive content copied | Identify publisher, source, and review date | 2026-07-19, approved |
| 超商幽靈包裹案例                 | Official source | 內政部警政署刑事警察局 | https://www.cib.npa.gov.tw/ch/app/news/view?id=1887&module=news&serno=c5b90907-6e6b-4396-9168-8e23c5f9b404 | `ghost-parcel-pickup` case facts   | Facts paraphrased; no expressive content copied | Identify publisher, source, and review date | 2026-07-19, approved |
| 偽冒投顧名人廣告引流假投資偵辦案 | Official source | 內政部警政署刑事警察局 | https://www.cib.npa.gov.tw/ch/app/news/view?id=1885&module=news&serno=cf19696e-0fde-41fb-877a-76d18fe79930 | `fake-investment-ad` case facts    | Facts paraphrased; no expressive content copied | Identify publisher, source, and review date | 2026-07-19, approved |
| 釣魚簡訊盜刷集團偵辦案           | Official source | 內政部警政署刑事警察局 | https://www.cib.npa.gov.tw/ch/app/news/view?id=1885&module=news&serno=fec7d7af-30c3-429d-86a1-de452f9049a5 | `utility-bill-phishing` case facts | Facts paraphrased; no expressive content copied | Identify publisher, source, and review date | 2026-07-19, approved |

## Visual Assets and Fonts

The implementation uses system fonts and original project styling. It does not
bundle a third-party font, photograph, screenshot, or copied product interface.

| Resource                        | Category                   | Owner/publisher             | Canonical source                          | Project use                                       | License/permission                                                                                  | Attribution/notices                                                       | Reviewed             |
| ------------------------------- | -------------------------- | --------------------------- | ----------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------- |
| `hero-message-check.png`        | Original generated artwork | Message, Unpacked. project  | `public/assets/hero-message-check.png`    | Decorative hero illustration                      | Project output released with original educational assets under CC BY-SA 4.0                         | Generated with OpenAI ImageGen; no third-party brand or source art copied | 2026-07-18, approved |
| OpenAI ImageGen output terms    | Generation service terms   | OpenAI                      | https://openai.com/policies/terms-of-use/ | Rights review for the generated hero illustration | Terms assign output rights to the user to the extent permitted by law; output still requires review | Do not imply the service endorses the project                             | 2026-07-18, approved |
| Phosphor Icons for React 2.1.10 | Icon pack                  | Phosphor Icons contributors | https://github.com/phosphor-icons/react   | Navigation, learning-path, exercise, and help UI  | MIT                                                                                                 | Preserve license                                                          | 2026-07-18, approved |
