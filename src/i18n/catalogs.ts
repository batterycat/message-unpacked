import {
  defaultLocale,
  supportedLocales,
  type Locale,
} from '../domain/locales';

const zhTW = {
  meta: {
    title: 'Message, Unpacked.｜訊息拆解所',
    description: '給教室使用的互動式防詐學習網站。',
  },
  nav: {
    brandDescriptor: '訊息拆解所',
    primary: '主要導覽',
    learningChallenge: '學習挑戰',
    teacherArea: '教師專區',
    caseLibrary: '案例資料',
    contribute: '共同維護',
    about: '關於計畫',
    language: '語言',
    skipToContent: '跳到主要內容',
    switchLanguage: 'English',
  },
  hero: {
    eyebrow: '給國中生的數位素養課',
    title: '每一則訊息，都值得多看一眼。',
    titleLineOne: '每一則訊息，',
    titleLineTwo: '都值得多看一眼。',
    description:
      '在安全的情境中練習判讀簡訊、聊天與 Email。找出線索、選擇查證方式，也理解真實事件可能造成的影響。',
    start: '開始體驗',
    teacher: '教師快速開課',
    note: '免登入・不收集學生資料・可靜態部署',
  },
  activityPage: {
    eyebrow: '獨立學習活動',
    heading: '訊息判讀練習',
    description: '專注完成教師挑選的案例；不需登入，作答資料只留在這個頁面。',
    backHome: '回到首頁',
  },
  teacherPage: {
    eyebrow: '教師專區',
    heading: '把一堂課準備好',
    description: '選好主題、時間與帶領方式，產生一個可以直接分享的活動。',
    backHome: '回到首頁',
    teacherGuide: '開啟教師手冊',
  },
  learningPath: {
    label: '學習路徑',
    title: '四步驟，建立判斷力',
    stepOne: '拆解訊息',
    stepOneDescription: '讀懂訊息內容與請求',
    stepTwo: '判斷線索',
    stepTwoDescription: '找出可疑點與證據',
    stepThree: '查看真實影響',
    stepThreeDescription: '了解可能造成的損害',
    stepFour: '學會通報',
    stepFourDescription: '知道如何求助與查證',
  },
  modes: {
    studentLabel: '學生體驗',
    studentTitle: '讀訊息，做判斷',
    studentDescription: '不是只猜真或假；你還要說明線索，以及下一步怎麼做。',
    teacherLabel: '教師模式',
    teacherTitle: '兩分鐘內開課',
    teacherDescription: '依年級、主題與時間挑選題目，產生可分享的活動連結。',
    openLabel: '共同維護',
    openTitle: '案例和程式分開演進',
    openDescription: '案例以可審查的資料檔維護，不必修改應用程式就能貢獻。',
  },
  teacherSetup: {
    eyebrow: '教師快速開課',
    heading: '挑選主題，兩分鐘內開始',
    description:
      '不需帳號或學生名單。選好條件後，產生可直接開啟或分享的靜態活動連結。',
    stage: '學習階段',
    stageSevenNine: '國中（7–9 年級）',
    topic: '主題',
    duration: '活動時間',
    durationOption: '{minutes} 分鐘',
    mode: '帶領方式',
    selfPaced: '學生自行練習',
    projector: '教師投影帶領',
    create: '產生活動連結',
    ready: '活動已準備好',
    selectedCount: '已挑選 {count} 題',
    launch: '開啟活動',
    copy: '複製連結',
    copied: '已複製',
    qrHeading: '掃描 QR Code 開啟',
    qrDescription: 'QR Code 只包含這次的活動連結，不會傳送學生資料。',
    qrLabel: '活動 QR Code',
    unavailable: '這個語言目前還沒有可用的案例。',
  },
  demo: {
    eyebrow: '互動試題',
    heading: '你會怎麼判斷？',
    progress: '目前案例',
    channelSms: '簡訊',
    channelChat: '聊天訊息',
    channelEmail: '電子郵件',
    sender: '寄件者',
    choose: '選擇你的判斷',
    instructions: '請閱讀訊息，找出可疑線索，再選擇最安全的做法。',
    clueHeading: '先看看有哪些線索',
    revealClues: '查看線索',
    hideClues: '收起線索',
    resultLabel: '判斷結果',
    score: '本題得分',
    scoreFeedback: {
      strong: '判斷與安全行動都很穩健',
      developing: '已抓到重要方向，再用解析補齊細節',
      practice: '先回顧線索與安全行動，下次會更穩',
    },
    actions: '比較安全的下一步',
    localHelp: '需要時，可以使用這些在地資源',
    helpTitle: '需要協助嗎？',
    helpDescription: '遇到可疑訊息或受騙，請先停止操作並找可信任的大人協助。',
    helpPending: '完成判斷後，這裡會顯示適合本題的查證與求助方式。',
    realCase: '真實案例',
    eventPeriod: '發生時間',
    eventLocation: '事件地點',
    victimCount: '公開資料載明人數',
    maximumLoss: '公開資料載明損失',
    nonFinancialImpact: '其他影響',
    people: '{count} 人',
    impactQualifiers: {
      reported: '載明',
      estimated: '約',
      atLeast: '至少',
      upTo: '最高',
      aggregate: '合計',
    },
    eventSummary: '案例簡述',
    sourceLinks: '資料來源',
    unknownImpact: '公開資料未揭露',
    officialSite: '前往官方網站',
    call: '撥打',
    verified: '資料查核日',
    next: '下一題',
    viewResults: '查看學習成果',
    restart: '重新作答',
    results: {
      eyebrow: '活動完成',
      heading: '本次學習成果',
      description:
        '分數用來幫助你看見判斷策略，不是替你貼標籤。回顧每題理由後，也可以再挑戰一次。',
      totalScore: '總分',
      averageScore: '平均每題',
      progress: '完成進度',
      completedCount: '完成 {count} 題',
      breakdown: '每題回顧',
      restart: '再挑戰一次',
      newActivity: '設定新的活動',
      bands: {
        strong: {
          heading: '判讀力很扎實',
          description: '你多數時候能抓到關鍵線索，並選擇風險較低的下一步。',
        },
        developing: {
          heading: '已掌握重要方向',
          description: '你已經能辨認不少風險；再留意查證管道與資訊是否足夠。',
        },
        practice: {
          heading: '繼續練習會更穩',
          description: '先停下操作、找出要求與壓力手法，再從可信管道確認。',
        },
      },
    },
    provenance: '案例類型',
    provenanceKinds: {
      documented: '真實事件改編',
      composite: '多案綜合改編',
      classicPattern: '經典手法',
      fictional: '教學虛構',
    },
    emptyTitle: '這個語言的題目還在準備中',
    emptyDescription:
      '英文介面已經就緒；目前首批案例先以繁體中文發布，不會用未審查的機器翻譯代替。',
    switchToChinese: '切換到中文題目',
    projectorMode: '教師投影模式',
    projectorDiscussionTitle: '全班先討論，再由教師揭曉',
    projectorDiscussionDescription:
      '先請同學說出線索與理由；選定班級答案後，再顯示解析。',
    revealDebrief: '揭曉解析',
    projectorScore: '班級答案參考分數',
    projectorResults: {
      eyebrow: '課堂活動完成',
      heading: '班級討論紀錄',
      description:
        '這份分數只記錄本次班級選擇，重點是回顧討論中使用的線索與查證方法。',
      totalScore: '班級答案總分',
      averageScore: '平均每題',
      breakdown: '課堂逐題回顧',
      feedbackHeading: '完成本次討論',
      feedbackDescription:
        '回顧哪些線索改變了大家的判斷，以及遇到真實訊息時要怎麼查證。',
    },
    invalidActivityTitle: '這個活動連結已無法使用',
    invalidActivityDescription:
      '連結格式不完整，或包含已下架的案例。請回到全部題目，或請教師重新產生活動。',
    returnToAllCases: '回到全部題目',
  },
  footer: {
    statement: '開放原始碼的公共教育專案',
    codeLicense: '程式碼 Apache-2.0',
    contentLicense: '原創教材 CC BY-SA 4.0',
  },
} as const;

type StringCatalog<T> = {
  [Key in keyof T]: T[Key] extends string ? string : StringCatalog<T[Key]>;
};

export type MessageCatalog = StringCatalog<typeof zhTW>;

const en: MessageCatalog = {
  meta: {
    title: 'Message, Unpacked.',
    description:
      'An interactive anti-fraud learning experience for classrooms.',
  },
  nav: {
    brandDescriptor: 'Message Lab',
    primary: 'Primary navigation',
    learningChallenge: 'Learning challenge',
    teacherArea: 'Teacher area',
    caseLibrary: 'Case library',
    contribute: 'Contribute',
    about: 'About',
    language: 'Language',
    skipToContent: 'Skip to main content',
    switchLanguage: '繁體中文',
  },
  hero: {
    eyebrow: 'Digital literacy for junior-high learners',
    title: 'Every message deserves a closer look.',
    titleLineOne: 'Every message deserves',
    titleLineTwo: 'a closer look.',
    description:
      'Practise evaluating texts, chats, and emails in a safe environment. Find the clues, choose how to verify, and understand the real-world impact.',
    start: 'Try an exercise',
    teacher: 'Quick class setup',
    note: 'No account · No student data · Static deployment',
  },
  activityPage: {
    eyebrow: 'Focused learning activity',
    heading: 'Message assessment practice',
    description:
      'Complete the cases selected by your teacher in a focused page. No sign-in; answers stay on this page.',
    backHome: 'Back to home',
  },
  teacherPage: {
    eyebrow: 'Teacher area',
    heading: 'Prepare a class in two minutes',
    description:
      'Choose a topic, duration, and teaching mode, then create a link you can share right away.',
    backHome: 'Back to home',
    teacherGuide: 'Open the teacher guide',
  },
  learningPath: {
    label: 'Learning path',
    title: 'Build judgment in four steps',
    stepOne: 'Unpack the message',
    stepOneDescription: 'Read the content and request closely',
    stepTwo: 'Assess the clues',
    stepTwoDescription: 'Identify suspicious evidence',
    stepThree: 'See the real impact',
    stepThreeDescription: 'Understand possible harm',
    stepFour: 'Know how to report',
    stepFourDescription: 'Find help and verify safely',
  },
  modes: {
    studentLabel: 'Student experience',
    studentTitle: 'Read, reason, decide',
    studentDescription:
      'Go beyond true or false: explain the clues and choose a safer next step.',
    teacherLabel: 'Teacher mode',
    teacherTitle: 'Start class in two minutes',
    teacherDescription:
      'Choose a grade band, topic, and duration, then share the activity link.',
    openLabel: 'Open collaboration',
    openTitle: 'Content and code evolve separately',
    openDescription:
      'Reviewable data files let contributors add cases without changing application code.',
  },
  teacherSetup: {
    eyebrow: 'Quick class setup',
    heading: 'Choose a topic and start in two minutes',
    description:
      'No account or class roster required. Create a static activity link that can be opened or shared immediately.',
    stage: 'Learning stage',
    stageSevenNine: 'Junior high (grades 7–9)',
    topic: 'Topic',
    duration: 'Activity length',
    durationOption: '{minutes} minutes',
    mode: 'Facilitation mode',
    selfPaced: 'Student self-paced',
    projector: 'Teacher projector-led',
    create: 'Create activity link',
    ready: 'Activity ready',
    selectedCount: '{count} cases selected',
    launch: 'Open activity',
    copy: 'Copy link',
    copied: 'Copied',
    qrHeading: 'Scan to open',
    qrDescription:
      'This QR Code contains only the activity link and sends no student data.',
    qrLabel: 'Activity QR Code',
    unavailable: 'No cases are currently available in this language.',
  },
  demo: {
    eyebrow: 'Interactive exercise',
    heading: 'How would you assess it?',
    progress: 'Current case',
    channelSms: 'Text message',
    channelChat: 'Chat message',
    channelEmail: 'Email',
    sender: 'From',
    choose: 'Choose your assessment',
    instructions:
      'Read the message, identify suspicious clues, then choose the safest response.',
    clueHeading: 'Look for evidence first',
    revealClues: 'Show clues',
    hideClues: 'Hide clues',
    resultLabel: 'Assessment result',
    score: 'Score',
    scoreFeedback: {
      strong: 'Your assessment and safer action are both solid',
      developing:
        'You found the key direction; use the explanation to fill in details',
      practice: 'Review the clues and safer action, then try again',
    },
    actions: 'Safer next steps',
    localHelp: 'Use these local resources when relevant',
    helpTitle: 'Need help?',
    helpDescription:
      'If a message seems suspicious or you have been harmed, stop and ask a trusted adult for help.',
    helpPending:
      'After your decision, relevant verification and support options will appear here.',
    realCase: 'Real case',
    eventPeriod: 'Event period',
    eventLocation: 'Location',
    victimCount: 'People stated in public sources',
    maximumLoss: 'Loss stated in public sources',
    nonFinancialImpact: 'Other effects',
    people: '{count} people',
    impactQualifiers: {
      reported: 'Reported',
      estimated: 'About',
      atLeast: 'At least',
      upTo: 'Up to',
      aggregate: 'Aggregate',
    },
    eventSummary: 'Case summary',
    sourceLinks: 'Sources',
    unknownImpact: 'Not disclosed in public sources',
    officialSite: 'Open official website',
    call: 'Call',
    verified: 'Last verified',
    next: 'Next case',
    viewResults: 'View learning results',
    restart: 'Try again',
    results: {
      eyebrow: 'Activity complete',
      heading: 'Your learning results',
      description:
        'Scores help you see your assessment strategy; they do not label you. Review each explanation and try again whenever you like.',
      totalScore: 'Total score',
      averageScore: 'Average per case',
      progress: 'Completion',
      completedCount: '{count} cases completed',
      breakdown: 'Case review',
      restart: 'Try the activity again',
      newActivity: 'Set up a new activity',
      bands: {
        strong: {
          heading: 'Your judgment is solid',
          description:
            'You usually identify the key clues and choose a lower-risk next step.',
        },
        developing: {
          heading: 'You have the important direction',
          description:
            'You can identify many risks. Keep checking the source and whether the evidence is sufficient.',
        },
        practice: {
          heading: 'More practice will make this steadier',
          description:
            'Pause first, identify the request and pressure tactics, then verify through a trusted channel.',
        },
      },
    },
    provenance: 'Case type',
    provenanceKinds: {
      documented: 'Adapted from a documented event',
      composite: 'Composite of documented events',
      classicPattern: 'Classic pattern',
      fictional: 'Teaching fiction',
    },
    emptyTitle: 'Cases in this language are in preparation',
    emptyDescription:
      'The English interface is ready. Initial cases are published in Traditional Chinese, without substituting unreviewed machine translations.',
    switchToChinese: 'Switch to Chinese cases',
    projectorMode: 'Teacher projector mode',
    projectorDiscussionTitle: 'Discuss as a class, then let the teacher reveal',
    projectorDiscussionDescription:
      'Ask students to share clues and reasoning first. Select the class answer, then reveal the explanation.',
    revealDebrief: 'Reveal explanation',
    projectorScore: 'Class answer reference score',
    projectorResults: {
      eyebrow: 'Class activity complete',
      heading: 'Class discussion record',
      description:
        'This score records the class choice only. The important part is reviewing the clues and verification methods used in discussion.',
      totalScore: 'Class answer total',
      averageScore: 'Average per case',
      breakdown: 'Class case review',
      feedbackHeading: 'Discussion complete',
      feedbackDescription:
        'Review which clues changed the class judgment and how to verify a similar message in real life.',
    },
    invalidActivityTitle: 'This activity link is no longer available',
    invalidActivityDescription:
      'The link is incomplete or contains a retired case. Return to all cases or ask the teacher to create a new activity.',
    returnToAllCases: 'Return to all cases',
  },
  footer: {
    statement: 'An open-source public education project',
    codeLicense: 'Code: Apache-2.0',
    contentLicense: 'Original content: CC BY-SA 4.0',
  },
};

export const catalogs = { 'zh-TW': zhTW, en } satisfies Record<
  Locale,
  MessageCatalog
>;

export type { Locale } from '../domain/locales';
export const locales = [...supportedLocales];
export { defaultLocale };
