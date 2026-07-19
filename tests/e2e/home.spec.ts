import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Root entry resolves to the default localized route', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/zh-TW\/$/);
});

test('Traditional Chinese exercise can be completed', async ({ page }) => {
  await page.goto('/zh-TW/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    '每一則訊息',
  );

  const demo = page.locator('#demo');
  await demo.scrollIntoViewIfNeeded();
  await demo.getByRole('button', { name: /^A\./ }).click();
  await expect(demo.getByText('判斷結果')).toBeVisible();
  await expect(demo.getByText(/本題得分/)).toBeVisible();
});

test('A completed activity stops and shows a supportive score summary', async ({
  page,
}) => {
  await page.goto(
    '/zh-TW/activity/?activity=1&lang=zh-TW&stage=7-9&topic=遊戲與帳號&minutes=20&mode=self-paced&cases=friend-vote-request.zh-tw%2Cgaming-account-expiry.zh-tw%2Cschool-platform-notice.zh-tw#demo',
  );
  const demo = page.locator('#demo');
  const correctChoices = [
    '不給驗證碼，改用其他方式確認本人',
    '高度疑似詐騙，不點連結',
    '具備可信特徵，仍從既有入口查看',
  ];

  for (const [index, choice] of correctChoices.entries()) {
    await demo.getByRole('button', { name: choice }).click();
    await expect(demo).toContainText('本題得分');
    await expect(demo).toContainText('100／100');
    await demo
      .getByRole('button', {
        name: index === correctChoices.length - 1 ? '查看學習成果' : '下一題',
      })
      .click();
  }

  await expect(
    demo.getByRole('heading', { name: '本次學習成果' }),
  ).toBeVisible();
  await expect(demo).toContainText('300／300');
  await expect(demo).toContainText('完成 3 題');

  const accessibility = await new AxeBuilder({ page })
    .include('#demo')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);

  await demo.getByRole('button', { name: '再挑戰一次' }).click();
  await expect(
    demo.getByRole('button', { name: correctChoices[0] }),
  ).toBeVisible();
  await expect(demo).toContainText('01／03');
});

test('Mobile next case keeps the activity in view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    '/zh-TW/activity/?activity=1&lang=zh-TW&stage=7-9&topic=社群與交友&minutes=10&mode=self-paced&cases=friend-vote-request.zh-tw%2Cgroup-project-attachment.zh-tw#demo',
  );

  const demo = page.locator('#demo');
  await demo.scrollIntoViewIfNeeded();
  await demo
    .getByRole('button', { name: '不給驗證碼，改用其他方式確認本人' })
    .click();
  const nextButton = demo.getByRole('button', { name: '下一題' });
  await nextButton.click();

  const activityTop = await demo.evaluate(
    (element) => element.getBoundingClientRect().top,
  );
  expect(activityTop).toBeLessThan(844);
  expect(activityTop).toBeGreaterThan(-20);
  await expect(demo).toContainText('02／02');
});

test('Documented case debrief preserves qualified impact and review details', async ({
  page,
}) => {
  await page.goto(
    '/zh-TW/activity/?activity=1&lang=zh-TW&stage=7-9&topic=網路購物&minutes=10&mode=self-paced&cases=ghost-parcel-pickup.zh-tw#demo',
  );
  const demo = page.locator('#demo');

  await demo
    .getByRole('button', {
      name: '先核對訂單並問家人，無法確認就不付款取件',
    })
    .click();

  await expect(demo.getByText('真實案例')).toBeVisible();
  await expect(demo.getByText(/至少.*NT\$1,000/)).toBeVisible();
  await expect(demo.getByText('載明 1 人')).toBeVisible();
  await expect(demo.getByText(/資料查核日.*2026-07-19/)).toBeVisible();
  await expect(
    demo.getByRole('link', { name: /內政部警政署刑事警察局/ }),
  ).toBeVisible();
});

test('Teacher can create and launch a projector activity', async ({ page }) => {
  await page.goto('/zh-TW/teacher/');

  const teacherGuideLink = page.getByRole('link', { name: '開啟教師手冊' });
  await expect(teacherGuideLink).toHaveAttribute(
    'href',
    'https://batterycat.gitbook.io/message-unpacked-docs/',
  );
  await expect(teacherGuideLink).toHaveAttribute('target', '_blank');
  await expect(teacherGuideLink).toHaveAttribute('rel', 'noreferrer');

  const teacherSetup = page.locator('.teacher-page-configurator');
  const stageSelect = teacherSetup.getByRole('combobox', {
    name: '學習階段',
    exact: true,
  });
  await expect(stageSelect).toHaveValue('7-9');
  await expect(stageSelect.locator('option')).toHaveCount(5);
  await page.waitForFunction(
    () =>
      !document
        .querySelector('.teacher-page-configurator astro-island')
        ?.hasAttribute('ssr'),
  );
  const topicSelect = teacherSetup.getByRole('combobox', {
    name: '主題',
    exact: true,
  });
  await topicSelect.selectOption('家庭與生活');
  await expect(topicSelect).toHaveValue('家庭與生活');
  await teacherSetup
    .getByRole('combobox', { name: '活動時間', exact: true })
    .selectOption('10');
  await teacherSetup
    .getByRole('radio', { name: '教師投影帶領', exact: true })
    .check();
  await teacherSetup.getByRole('button', { name: '產生活動連結' }).click();
  await expect(
    teacherSetup.getByRole('img', { name: '活動 QR Code' }),
  ).toBeVisible();

  const launchLink = teacherSetup.getByRole('link', { name: '開啟活動' });
  await expect(launchLink).toHaveAttribute('href', /mode=projector/);
  await expect(launchLink).toHaveAttribute(
    'href',
    /utility-bill-phishing\.zh-tw/,
  );
  await launchLink.click();

  await expect(page).toHaveURL(/\/zh-TW\/activity\//);
  await expect(
    page.getByRole('heading', { name: '每一則訊息，都值得多看一眼。' }),
  ).toHaveCount(0);
  await expect(page.locator('#teacher')).toHaveCount(0);
  await expect(page.getByText('教師投影模式')).toBeVisible();
  await expect(page.locator('#demo')).toContainText('01／02');

  const demo = page.locator('#demo');
  await demo.getByRole('button', { name: /^A\./ }).click();
  await expect(demo.getByText('判斷結果')).toHaveCount(0);
  await demo.getByRole('button', { name: '揭曉解析' }).click();
  await expect(demo.getByText('判斷結果')).toBeVisible();
});

test('Multiple-message cases keep readable separation between message cards', async ({
  page,
}) => {
  await page.goto(
    '/zh-TW/activity/?activity=1&lang=zh-TW&stage=7-9&topic=遊戲與帳號&minutes=10&mode=self-paced&cases=free-game-coins-otp.zh-tw#demo',
  );

  const messages = page.getByTestId('scenario-messages');
  await expect(messages.getByTestId('scenario-message')).toHaveCount(2);
  const gap = await messages.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).rowGap),
  );
  expect(gap).toBeGreaterThan(0);
});

test('Stale teacher activity link offers a safe recovery path', async ({
  page,
}) => {
  await page.goto(
    '/zh-TW/activity/?activity=1&lang=zh-TW&stage=7-9&topic=校園&minutes=10&mode=self-paced&cases=case.retired#demo',
  );

  await expect(
    page.getByRole('heading', { name: '這個活動連結已無法使用' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: '回到全部題目' }),
  ).toHaveAttribute('href', './#demo');
});

test('English interface reports unavailable case translations honestly', async ({
  page,
}) => {
  await page.goto('/en/activity/');
  await expect(
    page.getByRole('heading', {
      name: 'Cases in this language are in preparation',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Switch to Chinese cases' }),
  ).toHaveAttribute('href', '/zh-TW/activity/#demo');
});

test('Teacher setup remains visible at the 320px mobile boundary', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/zh-TW/teacher/');
  await page.waitForFunction(
    () =>
      !document
        .querySelector('.teacher-page-configurator astro-island')
        ?.hasAttribute('ssr'),
  );

  await expect(
    page.getByRole('combobox', { name: '主題', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '開啟教師手冊' })).toBeVisible();
  await page.getByRole('button', { name: '產生活動連結' }).click();
  await expect(page.getByRole('img', { name: '活動 QR Code' })).toBeVisible();
  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
});

test('Core student and teacher controls work with the keyboard', async ({
  page,
}) => {
  await page.goto('/zh-TW/');

  const skipLink = page.getByRole('link', { name: '跳到主要內容' });
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator('#main')).toBeFocused();

  const firstChoice = page
    .locator('#demo')
    .getByRole('button', { name: /^A\./ });
  await firstChoice.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#demo').getByText('判斷結果')).toBeVisible();

  await page.goto('/zh-TW/teacher/');
  const createButton = page.getByRole('button', { name: '產生活動連結' });
  await createButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('img', { name: '活動 QR Code' })).toBeVisible();
  await expect(createButton).toBeFocused();

  await page.goto('/zh-TW/activity/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到主要內容' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('@a11y core pages have no detectable serious accessibility violations', async ({
  page,
}) => {
  for (const route of [
    '/zh-TW/',
    '/zh-TW/activity/',
    '/zh-TW/teacher/',
    '/en/',
    '/en/activity/',
    '/en/teacher/',
  ]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  }
});
