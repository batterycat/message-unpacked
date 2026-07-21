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
    contribute: '共同維護',
    about: '關於計畫',
    language: '語言',
    skipToContent: '跳到主要內容',
    switchLanguage: 'English',
  },
  hero: {
    eyebrow: '給不同年齡學生的數位素養課',
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
    heading: '訊息判讀活動',
    backHome: '回到首頁',
  },
  teacherPage: {
    eyebrow: '教師專區',
    heading: '選擇這堂課的互動方式',
    description:
      '兩種模式都能先挑選年級、主題、時間與案例；依課堂是否需要學生手機即時回傳來選擇。',
    backHome: '回到首頁',
    teacherGuide: '開啟教師手冊',
  },
  learningPath: {
    title: '四步驟，建立判斷力',
    summary: '讀懂要求、找出線索、選擇安全行動，再用解析整理查證方法。',
  },
  modes: {
    teacherTitle: '兩分鐘內開課',
    teacherDescription: '依年級、主題與時間挑選題目，產生可分享的活動連結。',
  },
  homeLinks: {
    guideLabel: '教師資源',
    guideTitle: '教師手冊',
    guideDescription: '快速開課、投影帶領、敏感內容提醒與課堂腳本。',
    guideAction: '開啟手冊',
    contributeLabel: '開放協作',
    contributeTitle: '參與共同維護',
    contributeDescription: '在 GitHub 提議案例、回報問題或貢獻程式。',
    contributeAction: '前往 GitHub',
  },
  teacherSetup: {
    eyebrow: '教師快速開課',
    heading: '選擇案例與帶領方式',
    stage: '學習階段',
    stageOptions: {
      '1-2': '國小低年級（1–2 年級）',
      '3-4': '國小中年級（3–4 年級）',
      '5-6': '國小高年級（5–6 年級）',
      '7-9': '國中（7–9 年級）',
      '10-12': '高中職（10–12 年級）',
    },
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
  caseSelection: {
    heading: '確認本堂課案例',
    description: '已依主題與時間先選好建議題目，也可以自行增減或替換。',
    selectedCount: '已選 {count}／最多 {maximum} 題',
    recommendedCount: '依 {minutes} 分鐘建議 {count} 題',
    recommendedBadge: '建議',
    empty: '至少選擇一題才能繼續。',
    limitReached: '已達這個模式的題數上限。',
  },
  staticActivityEntry: {
    eyebrow: '不需後端的開課方式',
    heading: '靜態活動連結',
    description:
      '選好案例後產生一個可分享的連結。學生可各自在裝置上練習，也可以由教師投影帶領；網站不需建立教室或即時連線。',
    shareHeading: '分享一個活動連結',
    shareDescription: '題目與帶領方式會放在版本化連結中，可直接傳給學生。',
    selfPacedHeading: '學生自主練習',
    selfPacedDescription: '每位學生依自己的進度作答、看解析與完成總結。',
    projectorHeading: '教師投影帶領',
    projectorDescription: '全班共看一個畫面，由教師控制何時揭曉答案。',
    readyLabel: '免設定後端，隨時可用',
    readyDescription: '適合一般課堂、派發作業，或網路與設備條件不一致的情境。',
    startSetup: '設定靜態活動',
    privacyNote: '活動連結包含選定案例，不包含學生身分或作答紀錄。',
    availabilityNote:
      '可部署在 GitHub Pages 等純靜態空間，不受即時教室服務影響。',
    localeUnavailableLabel: '這個語言尚無可用案例',
    localeUnavailableDescription: '介面已就緒，但目前沒有經過審核的案例內容。',
    switchToChinese: '切換到中文活動',
  },
  classroomEntry: {
    eyebrow: '需要即時回傳的開課方式',
    heading: '即時班級互動',
    description:
      '教師投影完整題目，學生用手機當作簡易答題器。截止前只顯示參與與作答人數，揭曉後才顯示全班分布與解析。',
    projectorHeading: '題目留在投影畫面',
    projectorDescription: '教師掌握完整訊息、線索、揭曉與課堂解析。',
    clickerHeading: '手機只顯示作答選項',
    clickerDescription: '學生免帳號、免姓名，以短期房間碼加入並回應。',
    revealHeading: '截止後再看班級結果',
    revealDescription: '作答期間不公開多數選項，避免影響尚未回答的同學。',
    configuredLabel: '已設定班級服務',
    configuredDescription:
      '可前往建立短期教室；服務實際是否可用，會在建立頁由後端確認。',
    unconfiguredLabel: '尚未設定班級服務',
    unconfiguredDescription: '這個網站目前沒有連接即時教室後端。',
    localeUnavailableLabel: '這個語言尚無可用的班級案例',
    localeUnavailableDescription:
      '英文介面已就緒，但目前經過審核的案例只提供繁體中文，不會混用未審查翻譯。',
    startHosting: '建立互動教室',
    joinRoom: '學生加入教室',
    switchToChinese: '切換到中文班級',
    staticFallback: '靜態活動連結仍可正常使用。',
    privacyNote: '不建立名冊，也不保存個別學生的長期學習紀錄。',
    demoNotice:
      '專案維護者提供的公開服務僅供展示，不保證課堂可用性；學校可部署自己的相容後端並自行設定人數與題數限制。',
  },
  classroomShell: {
    backToTeacher: '回到教師專區',
    hostEyebrow: '教師投影端',
    hostHeading: '建立互動教室',
    hostDescription:
      '挑選案例、取得房間碼，並由投影畫面控制開題、截止、揭曉與解析。',
    joinEyebrow: '學生答題端',
    joinHeading: '加入互動教室',
    joinDescription: '輸入教師提供的房間碼；手機只會顯示題號、選項與作答狀態。',
    serviceConfigured: '這個部署已設定班級服務；實際可用性仍由後端回應決定。',
    serviceUnconfigured:
      '這個部署尚未設定班級服務，請先使用不需後端的靜態活動連結。',
    localeUnavailable: '這個語言尚無經過審核的案例，請切換到繁體中文班級流程。',
    switchToChinese: '切換到中文班級',
    staticActivity: '開啟靜態活動',
  },
  classroomLive: {
    checkingService: '正在確認班級服務…',
    serviceUnavailable: '目前無法使用班級互動服務',
    serviceUnavailableDescription:
      '這不會影響靜態活動。公開展示後端可能因免費額度或維護暫時停止，請稍後再試。',
    retry: '重新檢查',
    setupHeading: '挑選本堂課的案例',
    setupDescription: '依上課時間勾選案例；順序會依下方清單排列。',
    selectedCount: '已選 {count}／最多 {maximum} 題',
    createRoom: '建立短期教室',
    creatingRoom: '正在建立教室…',
    roomCode: '教室代碼',
    joinInstructions: '請學生掃描 QR Code，或在加入頁輸入教室代碼。',
    joinQrLabel: '學生加入教室 QR Code',
    copyJoinLink: '複製學生加入連結',
    copied: '已複製',
    participants: '已加入 {count} 人',
    answered: '已作答 {answered}／{participants} 人',
    waitingToStart: '學生加入後，由教師開啟第一題。',
    openFirstCase: '開啟第一題',
    revealCurrent: '截止並揭曉',
    nextCase: '開啟下一題',
    showSummary: '查看班級總結',
    endRoom: '結束教室',
    questionProgress: '第 {current}／{total} 題',
    projectedCase: '投影題目',
    classDistribution: '全班作答分布',
    responses: '{count} 票',
    noResponses: '本題沒有人作答，因此不計入總平均。',
    caseMean: '本題班級平均 {score} 分',
    summaryHeading: '本堂課班級總結',
    overallMean: '已作答題目的平均',
    reconnecting: '連線中斷，正在重新連接…',
    connectionFailed: '教室連線已中斷，請重新整理或改用靜態活動。',
    errorRoomFull: '這個教室已達人數上限，請告知教師。',
    errorRoomEnded: '這個教室已結束或已過期，請向教師取得新的教室代碼。',
    errorCredential: '無法確認這個教室的加入權限，請重新輸入教室代碼。',
    errorRateLimited: '短時間內嘗試次數過多，請稍候再試。',
    errorProtocol: '網站與班級服務版本不相容，請改用靜態活動。',
    actionUnavailable: '目前無法完成這個操作，請確認教室狀態後再試一次。',
    joinCodeLabel: '教室代碼',
    joinCodePlaceholder: '例如 ABCDE-12345',
    joinButton: '加入教室',
    joining: '正在加入…',
    waitingForTeacher: '已加入，等待教師開題',
    studentQuestion: '第 {current}／{total} 題',
    chooseAnswer: '選擇你的答案',
    submitting: '正在送出…',
    deliveryUncertain: '連線在確認前中斷；請重連後確認選項，必要時再送一次。',
    submitted: '答案已送出；截止前可以更改。',
    changed: '答案已更新。',
    waitingForReveal: '本題已截止，請看教師投影的解析。',
    activityComplete: '本堂互動已完成，請回到教師投影一起回顧。',
    roomEnded: '這個教室已結束。',
    invalidCode: '請輸入 10 碼有效教室代碼。',
    staleActivity: '這題與目前網站的案例版本不同，請告知教師重新建立教室。',
    privacyReminder: '不需輸入姓名；這台裝置只保存本教室的短期參與代碼。',
    demoReminder: '公開服務僅供體驗。',
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
    teacherGuide: '教師手冊',
    repository: 'GitHub',
    usagePrivacy: '使用範圍與隱私',
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
    contribute: 'Contribute',
    about: 'About',
    language: 'Language',
    skipToContent: 'Skip to main content',
    switchLanguage: '繁體中文',
  },
  hero: {
    eyebrow: 'Digital literacy for learners',
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
    heading: 'Message assessment activity',
    backHome: 'Back to home',
  },
  teacherPage: {
    eyebrow: 'Teacher area',
    heading: 'Choose how this class will interact',
    description:
      'Both paths let you choose the stage, topic, time, and cases first. Choose based on whether student phones need to send live responses.',
    backHome: 'Back to home',
    teacherGuide: 'Open the teacher guide',
  },
  learningPath: {
    title: 'Build judgment in four steps',
    summary:
      'Read the request, find the evidence, choose a safer action, and use the explanation to practise verification.',
  },
  modes: {
    teacherTitle: 'Start class in two minutes',
    teacherDescription:
      'Choose a grade band, topic, and duration, then share the activity link.',
  },
  homeLinks: {
    guideLabel: 'Teacher resource',
    guideTitle: 'Teacher guide',
    guideDescription:
      'Quick setup, projector facilitation, sensitive-content notes, and classroom scripts.',
    guideAction: 'Open the guide',
    contributeLabel: 'Open collaboration',
    contributeTitle: 'Help maintain the project',
    contributeDescription:
      'Propose cases, report problems, or contribute code on GitHub.',
    contributeAction: 'Open GitHub',
  },
  teacherSetup: {
    eyebrow: 'Quick class setup',
    heading: 'Choose cases and facilitation',
    stage: 'Learning stage',
    stageOptions: {
      '1-2': 'Early primary (grades 1–2)',
      '3-4': 'Middle primary (grades 3–4)',
      '5-6': 'Upper primary (grades 5–6)',
      '7-9': 'Junior high (grades 7–9)',
      '10-12': 'Senior high (grades 10–12)',
    },
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
  caseSelection: {
    heading: 'Review the cases for this class',
    description:
      'Recommended cases are preselected from the topic and class length. You can add, remove, or replace them.',
    selectedCount: '{count} selected · maximum {maximum}',
    recommendedCount: '{count} recommended for {minutes} minutes',
    recommendedBadge: 'Recommended',
    empty: 'Select at least one case to continue.',
    limitReached: 'You have reached this mode’s case limit.',
  },
  staticActivityEntry: {
    eyebrow: 'Backend-free teaching path',
    heading: 'Static activity link',
    description:
      'Choose cases and create one shareable link. Students can work on their own devices or the teacher can lead from a projector; no room or live connection is required.',
    shareHeading: 'Share one activity link',
    shareDescription:
      'The versioned link carries the chosen cases and facilitation mode.',
    selfPacedHeading: 'Student self-paced',
    selfPacedDescription:
      'Each student answers at their own pace, reviews explanations, and completes a summary.',
    projectorHeading: 'Teacher projector-led',
    projectorDescription:
      'The class shares one screen and the teacher controls when answers are revealed.',
    readyLabel: 'No backend setup required',
    readyDescription:
      'Useful for regular lessons, assigned practice, or classrooms with mixed network and device access.',
    startSetup: 'Set up a static activity',
    privacyNote:
      'The link contains selected case details, not student identities or response history.',
    availabilityNote:
      'It works on static hosts such as GitHub Pages and is independent of the live classroom service.',
    localeUnavailableLabel: 'No cases are available in this language',
    localeUnavailableDescription:
      'The interface is ready, but no reviewed case content is available yet.',
    switchToChinese: 'Switch to Chinese activity',
  },
  classroomEntry: {
    eyebrow: 'Teaching path with live responses',
    heading: 'Live classroom interaction',
    description:
      'The teacher projects the full case while student phones act as simple clickers. Participation and answer counts appear while voting is open; distribution and explanations appear only after reveal.',
    projectorHeading: 'Keep the full case on the projector',
    projectorDescription:
      'The teacher controls the message, clues, reveal, and class explanation.',
    clickerHeading: 'Show choices only on student phones',
    clickerDescription:
      'Students join a short-lived room without an account or a name.',
    revealHeading: 'Review class results after closing',
    revealDescription:
      'The current majority stays hidden so it does not influence students who have not answered.',
    configuredLabel: 'Classroom service configured',
    configuredDescription:
      'Continue to create a short-lived room. The backend confirms actual availability on the host page.',
    unconfiguredLabel: 'Classroom service not configured',
    unconfiguredDescription:
      'This site is not currently connected to a live classroom backend.',
    localeUnavailableLabel:
      'No reviewed English classroom cases are available in this build',
    localeUnavailableDescription:
      'The interface is ready, but this build does not include reviewed English cases. Unreviewed translations are not mixed into a room.',
    startHosting: 'Start a live classroom',
    joinRoom: 'Join as a student',
    switchToChinese: 'Switch to Chinese classroom',
    staticFallback: 'Static activity links continue to work.',
    privacyNote:
      'No roster is created, and individual long-term learning history is not stored.',
    demoNotice:
      "The project maintainer's public service is a best-effort demo, not a classroom availability commitment. Schools can operate a compatible backend with their own participant and case limits.",
  },
  classroomShell: {
    backToTeacher: 'Back to teacher area',
    hostEyebrow: 'Teacher projector',
    hostHeading: 'Start a live classroom',
    hostDescription:
      'Select cases, receive a room code, and control opening, closing, reveal, and explanations from the projector.',
    joinEyebrow: 'Student clicker',
    joinHeading: 'Join a live classroom',
    joinDescription:
      'Enter the room code from the teacher. The phone shows only the case number, choices, and submission status.',
    serviceConfigured:
      'This deployment has a classroom service configured. Actual availability is still determined by the backend.',
    serviceUnconfigured:
      'This deployment does not have a classroom service configured. Use the backend-free static activity link instead.',
    localeUnavailable:
      'Reviewed cases are not available in this language. Switch to the Traditional Chinese classroom flow.',
    switchToChinese: 'Switch to Chinese classroom',
    staticActivity: 'Open static activity',
  },
  classroomLive: {
    checkingService: 'Checking the classroom service…',
    serviceUnavailable: 'Live classroom interaction is unavailable',
    serviceUnavailableDescription:
      'Static activities still work. The public demo backend may pause when free quotas are exhausted or during maintenance.',
    retry: 'Check again',
    setupHeading: 'Choose cases for this class',
    setupDescription:
      'Select cases for the available class time. They run in the order shown below.',
    selectedCount: '{count} selected · maximum {maximum}',
    createRoom: 'Create short-lived room',
    creatingRoom: 'Creating room…',
    roomCode: 'Room code',
    joinInstructions:
      'Ask students to scan the QR Code or enter the code on the join page.',
    joinQrLabel: 'Student classroom join QR Code',
    copyJoinLink: 'Copy student join link',
    copied: 'Copied',
    participants: '{count} joined',
    answered: '{answered} of {participants} answered',
    waitingToStart: 'Open the first case after students have joined.',
    openFirstCase: 'Open first case',
    revealCurrent: 'Close and reveal',
    nextCase: 'Open next case',
    showSummary: 'Show class summary',
    endRoom: 'End room',
    questionProgress: 'Case {current} of {total}',
    projectedCase: 'Projected case',
    classDistribution: 'Class response distribution',
    responses: '{count} responses',
    noResponses:
      'No responses were submitted, so this case is not included in the mean.',
    caseMean: 'Class mean for this case: {score}',
    summaryHeading: 'Classroom summary',
    overallMean: 'Mean of answered cases',
    reconnecting: 'Connection lost. Reconnecting…',
    connectionFailed:
      'The room connection ended. Refresh or continue with a static activity.',
    errorRoomFull: 'This room has reached its participant limit.',
    errorRoomEnded:
      'This room has ended or expired. Ask the teacher for a new room code.',
    errorCredential:
      'The room credential could not be verified. Enter the room code again.',
    errorRateLimited: 'Too many attempts were made. Wait and try again.',
    errorProtocol:
      'The site and classroom service are incompatible. Use a static activity.',
    actionUnavailable:
      'This action could not be completed. Check the room state and try again.',
    joinCodeLabel: 'Room code',
    joinCodePlaceholder: 'For example, ABCDE-12345',
    joinButton: 'Join room',
    joining: 'Joining…',
    waitingForTeacher: 'Joined. Waiting for the teacher to open a case.',
    studentQuestion: 'Case {current} of {total}',
    chooseAnswer: 'Choose your answer',
    submitting: 'Submitting…',
    deliveryUncertain:
      'The connection ended before confirmation. Check the selected answer after reconnecting and submit again if needed.',
    submitted: 'Answer submitted. You can change it before reveal.',
    changed: 'Answer updated.',
    waitingForReveal:
      'This case is closed. Follow the explanation on the projector.',
    activityComplete:
      'The interaction is complete. Review it together on the projector.',
    roomEnded: 'This room has ended.',
    invalidCode: 'Enter a valid 10-character room code.',
    staleActivity:
      'This case differs from the version on this site. Ask the teacher to create a new room.',
    privacyReminder:
      'No name is needed. This device keeps only a short-lived participation token for this room.',
    demoReminder: 'The public service is for demonstration only.',
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
      'This build does not include reviewed English cases. Unreviewed machine translations are not substituted for reviewed content.',
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
    teacherGuide: 'Teacher guide',
    repository: 'GitHub',
    usagePrivacy: 'Scope and privacy',
  },
};

export const catalogs = { 'zh-TW': zhTW, en } satisfies Record<
  Locale,
  MessageCatalog
>;

export type { Locale } from '../domain/locales';
export const locales = [...supportedLocales];
export { defaultLocale };
