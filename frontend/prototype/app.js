const emotions = {
  hq: {
    name: "走神了一会儿",
    emoji: "🧠"
  },
  joy: {
    name: "乐乐",
    emoji: "✨"
  },
  sadness: {
    name: "忧忧",
    emoji: "💧"
  },
  anger: {
    name: "怒怒",
    emoji: "🔥"
  },
  fear: {
    name: "怕怕",
    emoji: "😟"
  },
  disgust: {
    name: "厌厌",
    emoji: "🙄"
  }
};

const emotionProfiles = {
  joy: {
    tagline: "负责把希望放大一点",
    description: "乐乐最擅长把卡住的时刻照亮一点，提醒你机会、轻盈感和行动的兴奋还在。",
    growthFocus: "被点赞后更会主动给你打气和提出轻快行动。"
  },
  sadness: {
    tagline: "负责温柔接住低落",
    description: "忧忧会先替你允许难过存在，帮你把委屈、失落和舍不得慢慢说清楚。",
    growthFocus: "被点赞后会更稳定地提供安抚、复盘和情绪命名。"
  },
  anger: {
    tagline: "负责守住边界和力量",
    description: "怒怒擅长指出压抑与不公平，帮你把被冒犯的部分说出来，不再一味忍耐。",
    growthFocus: "被点赞后会更敢替你争取、厘清底线和行动方向。"
  },
  fear: {
    tagline: "负责提前看见风险",
    description: "怕怕会先想到最容易出问题的环节，帮你做好准备、补足退路和安全感。",
    growthFocus: "被点赞后更会提供稳妥步骤和防翻车提醒。"
  },
  disgust: {
    tagline: "负责筛掉消耗和不适",
    description: "厌厌最会辨认不合适的人事物，替你维持品味、边界和拒绝无效投入的清醒。",
    growthFocus: "被点赞后更擅长快速识别消耗项并帮你做减法。"
  }
};

const levelRules = [
  { minScore: 8, name: "王牌" },
  { minScore: 4, name: "进阶" },
  { minScore: 0, name: "新秀" },
  { minScore: -999, name: "观察中" }
];

const emotionCompassOracle = {
  joy: {
    suitable: "表达期待",
    avoid: "自我扫兴",
    quote: "太棒啦，今天适合把一点点开心放大成一整束光！别急着给自己泼冷水呀！✨😊"
  },
  sadness: {
    suitable: "慢慢感受",
    avoid: "假装没事",
    quote: "没关系的……今天可以允许自己柔软一点。被好好接住，比马上振作更重要……💧💙"
  },
  anger: {
    suitable: "大叫",
    avoid: "隐忍",
    quote: "今天要捍卫你的边界！别让任何人消耗你的能量！🔥💢"
  },
  fear: {
    suitable: "提前准备",
    avoid: "贸然决定",
    quote: "先别急……把可能出问题的地方多看一眼，也许反而会更安心。这样更安全一点……😟👀"
  },
  disgust: {
    suitable: "保持距离",
    avoid: "勉强迎合",
    quote: "呃，今天请把审美和边界都立住。让你不舒服的人和事，离远一点。🙄💅"
  }
};

const modes = {
  emotion_compass: {
    name: "每日情绪签到",
    summary: "固定欢迎语后随机抽取一个情绪角色，给出今天的宜、忌与一句情绪箴言。",
    eyebrow: "Emotion Compass",
    title: "今天的情绪罗盘，会指向哪位分身？",
    personaTitle: "随机情绪占卜",
    personaCopy: "严格忽略输入内容，只随机抽取一位情绪分身，为你播报今日情绪占卜。",
    squad: ["joy", "sadness", "fear", "anger", "disgust"],
    deck: [
      { label: "执行规则", value: "忽略 message，直接抽签" },
      { label: "输出结构", value: "欢迎语 + 占卜标题 + 宜忌 + 箴言" },
      { label: "当前机制", value: "五位情绪分身随机出现" }
    ],
    demo: {
      request: `{
  "mode": "emotion_compass",
  "message": "今天其实有点乱"
}`,
      response: `好的，让我们看看今天的‘情绪罗盘’指向了谁……
今日情绪占卜
宜 大叫 忌 隐忍
[怒怒] 今天要捍卫你的边界！别让任何人消耗你的能量！🔥`
    },
    suggestions: [
      {
        title: "开始抽签卡",
        hint: "忽略具体内容",
        value: "开始今日情绪占卜。"
      },
      {
        title: "罗盘刷新卡",
        hint: "重新抽一次",
        value: "再抽一次今天的情绪罗盘。"
      },
      {
        title: "盲盒心情卡",
        hint: "看看谁来值班",
        value: "随机给我一个今日情绪建议。"
      }
    ],
    actionCards: {
      reflection: {
        title: "立即抽签",
        copy: "不分析内容，直接进入今日占卜。",
        prompt: "开始今日情绪罗盘。"
      },
      ritual: {
        title: "再抽一次",
        copy: "切换一个新的随机情绪结果。",
        prompt: "重新抽取今天的情绪占卜。"
      },
      summary: {
        title: "生成箴言",
        copy: "快速查看今日宜与忌。",
        prompt: "给我今天的宜和忌。"
      }
    },
    welcome: "这里是走神了一会儿，当前模式为 `emotion_compass`。\n输入内容会被忽略，系统将直接随机抽取一位情绪分身播报今日情绪占卜。",
    reply() {
      const chosenKey = pickRandom(["joy", "sadness", "anger", "fear", "disgust"]);
      const oracle = emotionCompassOracle[chosenKey];

      return [
        createAssistantMessage("hq", "好的，让我们看看今天的‘情绪罗盘’指向了谁……"),
        createAssistantMessage(
          chosenKey,
          `今日情绪占卜\n宜 ${oracle.suitable} 忌 ${oracle.avoid}\n[${emotions[chosenKey].name}] ${oracle.quote}`
        )
      ];
    }
  },
  future_theater: {
    name: "未来小剧场",
    summary: "围绕你的问题，同时生成至少三个情绪分身版本的未来剧本。",
    eyebrow: "Future Theater",
    title: "把还没发生的事，先演一小段给我看。",
    personaTitle: "多情绪剧场",
    personaCopy: "固定引导语后，由至少三个不同的情绪分身分别提交自己的未来剧本。",
    squad: ["joy", "fear", "anger", "sadness", "disgust"],
    deck: [
      { label: "执行规则", value: "围绕问题生成多角色剧本" },
      { label: "最少人数", value: "至少 3 位情绪角色上场" },
      { label: "输出结构", value: "[角色名]的剧本：具体情景描述" }
    ],
    demo: {
      request: `{
  "mode": "future_theater",
  "message": "我该不该去大城市发展？"
}`,
      response: `‘未来情景剧场’开演了！对于你的问题，各个情绪有不同的看法：
[乐乐]的剧本：你去了大城市！每天都在接触新机会，虽然忙，但视野一下被打开了，最后你会很庆幸自己试过一次！✨
[怕怕]的剧本：你去了……可万一房租太高、工作不稳定、身边也没有熟人怎么办？这风险真的不小……😟
[怒怒]的剧本：留在原地才更憋屈！去，用实力证明你值得更大的舞台，别再被小环境困住了！🔥`
    },
    suggestions: [
      {
        title: "明日预演卡",
        hint: "先演最担心的一幕",
        value: "我很怕明天的汇报翻车。"
      },
      {
        title: "开口练习卡",
        hint: "模拟一次对话",
        value: "帮我排演一下和别人开口谈需求。"
      },
      {
        title: "焦虑减压卡",
        hint: "把脑补降到现实",
        value: "我想象中的未来总是先往坏处跑。"
      }
    ],
    actionCards: {
      reflection: {
        title: "排三种版本",
        copy: "最坏、最好、最可能，一次摆出来。",
        prompt: "陪我把这件事排成最坏、最好、最可能三个版本。"
      },
      ritual: {
        title: "写可控动作",
        copy: "先抓住一个你能准备的点。",
        prompt: "根据这件事，给我两个现在就能做的可控动作。"
      },
      summary: {
        title: "生成上场台词",
        copy: "把你要说的话先写出来。",
        prompt: "帮我写一段可以直接开口说的版本。"
      }
    },
    welcome: "这里是走神了一会儿，当前模式为 `future_theater`。\n告诉我一个纠结的问题，我会让至少三位情绪分身分别写出他们的未来剧本。",
    reply(userInput) {
      const topic = userInput.trim() || "这件你正在纠结的事";
      const cast = pickDistinct(["joy", "fear", "anger", "sadness", "disgust"], 3);

      return [
        createAssistantMessage("hq", "‘未来情景剧场’开演了！对于你的问题，各个情绪有不同的看法："),
        ...cast.map((emotionKey) => createAssistantMessage(emotionKey, buildFutureScript(emotionKey, topic)))
      ];
    }
  },
  memory: {
    name: "记忆水晶球",
    summary: "回看一段难忘经历，整理它留给你的感受、信念和仍未说完的话。",
    eyebrow: "Memory Crystal Active",
    title: "选一段记忆，我们一起轻轻拿起来看。",
    personaTitle: "回忆修复师",
    personaCopy: "走神了一会儿会让忧忧先陪你回看，再让乐乐帮你从旧故事里找出新的理解。",
    squad: ["sadness", "joy"],
    deck: [
      { label: "记忆质地", value: "轻轻回看，不急着定义" },
      { label: "适合节奏", value: "事实、感受、留下来的信念" },
      { label: "对话目标", value: "理解这段回忆的影响" }
    ],
    demo: {
      request: `{
  "mode": "memory_crystal",
  "message": "我总是想起以前那次失败"
}`,
      response: `示例阶段：这个模式的正式协议你还没发给我。
现在先保留成产品演示位，等你补完规则后，我会按同样方式接成正式输出。`
    },
    suggestions: [
      {
        title: "反复想起卡",
        hint: "适合处理旧念头",
        value: "我总是反复想到以前那次失败。"
      },
      {
        title: "仍在意卡",
        hint: "回看一件旧事",
        value: "有件往事过去很久了，但我还会在意。"
      },
      {
        title: "记忆整理卡",
        hint: "把影响说清楚",
        value: "帮我整理一段对我影响很大的回忆。"
      }
    ],
    actionCards: {
      reflection: {
        title: "拆成三层",
        copy: "从事实、感受、信念三层整理。",
        prompt: "帮我把这段记忆拆成事实层、感受层和信念层。"
      },
      ritual: {
        title: "写一句对过去的话",
        copy: "给那时的自己一句新的回应。",
        prompt: "如果要对那时的自己说一句话，你会建议我怎么说？"
      },
      summary: {
        title: "留下新的解释",
        copy: "把旧记忆换成新的理解。",
        prompt: "帮我把这段记忆整理成一个更温柔的新解释。"
      }
    },
    welcome: "这里是走神了一会儿，当前模式为 `记忆水晶球`。\n忧忧会先陪你把记忆放下来，再由乐乐帮你看见它留下的新意义。",
    reply(userInput) {
      const memoryLens = detectMemoryLens(userInput);
      return [
        createAssistantMessage("hq", `收到，已按 \`mode=记忆水晶球\` 调出回看流程。这段记忆当前更接近“${memoryLens}”的色泽。`),
        createAssistantMessage("sadness", "我在这里……我们可以慢慢看，不必一下子讲完整。那一幕之所以还留着，大概是因为它真的让你很在意……💧💙"),
        createAssistantMessage("joy", "等你把那一幕放稳一点，我们也许能一起找到它后来让你长出来的部分。不是洗白过去，是帮现在的你看得更清楚呀。✨"),
        createAssistantMessage("hq", "你可以接着讲事实层、感受层，或者那段记忆后来最常触发你的时刻。")
      ];
    }
  }
};

const state = {
  activeMode: "emotion_compass",
  histories: {},
  compassRecords: {},
  roleProgress: {}
};

const STORAGE_KEY = "emotion-control-room";
const FEEDBACK_VALUES = {
  up: 1,
  down: -1
};

const modeList = document.getElementById("modeList");
const activeModeName = document.getElementById("activeModeName");
const activeModeSummary = document.getElementById("activeModeSummary");
const heroEyebrow = document.getElementById("heroEyebrow");
const heroTitle = document.getElementById("heroTitle");
const personaTitle = document.getElementById("personaTitle");
const personaCopy = document.getElementById("personaCopy");
const suggestions = document.getElementById("suggestions");
const heroStack = document.getElementById("heroStack");
const messageList = document.getElementById("messageList");
const composer = document.getElementById("composer");
const messageInput = document.getElementById("messageInput");
const messageTemplate = document.getElementById("messageTemplate");
const reflectionCard = document.getElementById("reflectionCard");
const ritualCard = document.getElementById("ritualCard");
const summaryCard = document.getElementById("summaryCard");
const reflectionTitle = document.getElementById("reflectionTitle");
const reflectionCopy = document.getElementById("reflectionCopy");
const ritualTitle = document.getElementById("ritualTitle");
const ritualCopy = document.getElementById("ritualCopy");
const summaryTitle = document.getElementById("summaryTitle");
const summaryCopy = document.getElementById("summaryCopy");
const demoRequest = document.getElementById("demoRequest");
const demoResponse = document.getElementById("demoResponse");
const compassPanel = document.getElementById("compassPanel");
const compassSignBtn = document.getElementById("compassSignBtn");
const calendarTitle = document.getElementById("calendarTitle");
const calendarGrid = document.getElementById("calendarGrid");
const compassResult = document.getElementById("compassResult");
const contextStrip = document.querySelector(".context-strip");
const actionStrip = document.querySelector(".action-strip");
const demoStrip = document.querySelector(".demo-strip");
const chatPanel = document.querySelector(".chat-panel");
const roleGallery = document.getElementById("roleGallery");
const roleGrid = document.getElementById("roleGrid");

initialize();

function initialize() {
  hydrateState();
  bindEvents();
  renderMode();
  autoResize();
}

function bindEvents() {
  modeList.addEventListener("click", (event) => {
    const button = event.target.closest(".mode-card");
    if (!button) {
      return;
    }

    const nextMode = button.dataset.mode;
    if (!nextMode || nextMode === state.activeMode) {
      return;
    }

    state.activeMode = nextMode;
    persistState();
    renderMode();
  });

  composer.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = messageInput.value.trim();
    if (!content) {
      return;
    }

    appendMessage(state.activeMode, "user", content);
    messageInput.value = "";
    autoResize();
    renderMessages();
    showTyping();

    await wait(720);

    hideTyping();
    appendAssistantReply(state.activeMode, modes[state.activeMode].reply(content));
    renderMessages();
  });

  messageInput.addEventListener("input", autoResize);
  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      composer.requestSubmit();
    }
  });

  reflectionCard.addEventListener("click", () => injectActionPrompt("reflection"));
  ritualCard.addEventListener("click", () => injectActionPrompt("ritual"));
  summaryCard.addEventListener("click", () => injectActionPrompt("summary"));
  compassSignBtn.addEventListener("click", signTodayCompass);
  compassResult.addEventListener("click", (event) => {
    const rerollButton = event.target.closest(".compass-reroll-btn");
    if (!rerollButton) {
      return;
    }

    rerollTodayCompass();
  });

  messageList.addEventListener("click", (event) => {
    const feedbackButton = event.target.closest(".feedback-btn");
    if (!feedbackButton) {
      return;
    }

    applyFeedback(feedbackButton.dataset.messageId, feedbackButton.dataset.feedback);
  });
}

function renderMode() {
  const config = modes[state.activeMode];
  document.body.dataset.mode = state.activeMode;

  document.querySelectorAll(".mode-card").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.activeMode);
  });

  activeModeName.textContent = config.name;
  activeModeSummary.textContent = config.summary;
  heroEyebrow.textContent = config.eyebrow;
  heroTitle.textContent = config.title;
  personaTitle.textContent = config.personaTitle;
  personaCopy.textContent = config.personaCopy;
  messageInput.placeholder = config.suggestions[0].value;

  const isCompassMode = state.activeMode === "emotion_compass";
  compassPanel.hidden = !isCompassMode;
  compassPanel.style.display = isCompassMode ? "grid" : "none";
  contextStrip.hidden = false;
  contextStrip.style.display = "grid";
  roleGallery.hidden = isCompassMode;
  roleGallery.style.display = isCompassMode ? "none" : "grid";
  actionStrip.hidden = isCompassMode;
  actionStrip.style.display = isCompassMode ? "none" : "grid";
  demoStrip.hidden = isCompassMode;
  demoStrip.style.display = isCompassMode ? "none" : "grid";
  chatPanel.hidden = isCompassMode;
  chatPanel.style.display = isCompassMode ? "none" : "grid";

  renderHeroStack(config.deck);
  renderSuggestions(config.suggestions);
  renderActionCards(config.actionCards);
  renderDemo(config.demo);
  renderRoleGallery();

  if (isCompassMode) {
    renderCompassPanel();
  } else {
    renderMessages();
  }
}

function renderSuggestions(items) {
  suggestions.innerHTML = "";

  items.forEach((item) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "starter-card";
    chip.innerHTML = `
      <span class="starter-kicker">${item.hint}</span>
      <strong>${item.title}</strong>
      <small>${item.value}</small>
    `;
    chip.addEventListener("click", () => {
      messageInput.value = item.value;
      autoResize();
      messageInput.focus();
    });
    suggestions.appendChild(chip);
  });
}

function renderHeroStack(items) {
  heroStack.innerHTML = "";

  const stackItems = [
    ...items,
    {
      label: "值班分身",
      value: modes[state.activeMode].squad.map((emotionKey) => emotions[emotionKey].name).join(" / ")
    }
  ];

  stackItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "hero-mini-card";
    card.innerHTML = `
      <span>${item.label}</span>
      <strong>${item.value}</strong>
    `;
    heroStack.appendChild(card);
  });
}

function renderActionCards(actionCards) {
  reflectionTitle.textContent = actionCards.reflection.title;
  reflectionCopy.textContent = actionCards.reflection.copy;
  ritualTitle.textContent = actionCards.ritual.title;
  ritualCopy.textContent = actionCards.ritual.copy;
  summaryTitle.textContent = actionCards.summary.title;
  summaryCopy.textContent = actionCards.summary.copy;
}

function renderDemo(demo) {
  demoRequest.textContent = demo.request;
  demoResponse.textContent = demo.response;
}

function renderCompassPanel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayKey = formatDateKey(now);
  const todayRecord = state.compassRecords[todayKey];

  calendarTitle.textContent = `${year}年${month + 1}月`;
  compassSignBtn.textContent = todayRecord ? "今日已签到" : "一键签到";
  buildCalendarGrid(year, month);
  renderCompassResult(todayRecord);
}

function buildCalendarGrid(year, month) {
  calendarGrid.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayKey = formatDateKey(new Date());

  for (let i = 0; i < startWeekday; i += 1) {
    const blankCell = document.createElement("div");
    blankCell.className = "calendar-day muted";
    calendarGrid.appendChild(blankCell);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const cellDate = new Date(year, month, day);
    const key = formatDateKey(cellDate);
    const record = state.compassRecords[key];
    const cell = document.createElement("article");
    cell.className = "calendar-day";

    if (key === todayKey) {
      cell.classList.add("today");
    }

    if (record) {
      cell.classList.add("signed");
      cell.style.setProperty("--day-accent", record.color);
    }

    cell.innerHTML = `
      <span class="calendar-date">${day}</span>
      ${
        record
          ? `<div class="calendar-entry">
              <span class="calendar-entry-icon">${record.emoji}</span>
              <small>${record.speaker}</small>
            </div>`
          : ""
      }
    `;

    calendarGrid.appendChild(cell);
  }
}

function renderCompassResult(record) {
  if (!record) {
    compassResult.innerHTML = `
      <p class="context-label">今日情绪占卜</p>
      <div class="compass-result-empty">
        <strong>今天还没有签到</strong>
        <p>点击右上角 \`一键签到\`，系统会直接为你生成今天的情绪宜忌和一句角色箴言。</p>
      </div>
    `;
    return;
  }

  compassResult.innerHTML = `
    <div class="compass-result-top">
      <p class="context-label">今日情绪占卜</p>
      <button class="compass-reroll-btn" type="button">重新抽取</button>
    </div>
    <div class="compass-result-role" style="--role-color: ${record.color}">
      <span class="compass-result-icon">${record.emoji}</span>
      <div>
        <strong>${record.speaker}</strong>
        <small>${record.dateLabel} 已签到</small>
      </div>
    </div>
    <h3 class="compass-result-heading">宜 ${record.suitable} 忌 ${record.avoid}</h3>
    <p class="compass-result-copy">${record.quote}</p>
  `;
}

function renderMessages() {
  messageList.innerHTML = "";

  state.histories[state.activeMode].forEach((message) => {
    messageList.appendChild(createMessageNode(message, message.content, message.timestamp));
  });

  messageList.scrollTop = messageList.scrollHeight;
}

function createMessageNode(message, content, timestamp) {
  const fragment = messageTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".message");
  const roleNode = fragment.querySelector(".message-role");
  const timeNode = fragment.querySelector(".message-time");
  const bubbleNode = fragment.querySelector(".message-bubble");
  const role = message.role;

  article.classList.add(role);
  if (role === "assistant" && content.speaker) {
    article.dataset.emotion = content.emotionKey || "hq";
    roleNode.textContent = `${content.emoji} ${content.speaker}`;
    bubbleNode.textContent = content.text;
  } else {
    roleNode.textContent = role === "assistant" ? "🧠 走神了一会儿" : "你";
    bubbleNode.textContent = typeof content === "string" ? content : content.text;
  }
  timeNode.textContent = formatTime(timestamp);

  if (shouldRenderFeedback(message)) {
    article.appendChild(createFeedbackNode(message));
  }

  return fragment;
}

function createFeedbackNode(message) {
  const bar = document.createElement("div");
  const scoreState = state.roleProgress[message.content.emotionKey] || createDefaultRoleProgress();
  const currentFeedback = message.feedback || null;

  bar.className = "message-feedback";
  bar.innerHTML = `
    <div class="message-feedback-actions">
      <button class="feedback-btn ${currentFeedback === "up" ? "active" : ""}" type="button" data-message-id="${message.id}" data-feedback="up">👍 有被接住</button>
      <button class="feedback-btn ${currentFeedback === "down" ? "active" : ""}" type="button" data-message-id="${message.id}" data-feedback="down">👎 不太对味</button>
    </div>
    <span class="message-feedback-status">${getLevelName(scoreState.score)} Lv.${scoreState.level}</span>
  `;

  return bar;
}

function appendMessage(mode, role, content) {
  state.histories[mode].push({
    id: createMessageId(),
    role,
    content,
    timestamp: new Date(),
    feedback: null
  });
  persistState();
}

function appendAssistantReply(mode, reply) {
  if (Array.isArray(reply)) {
    reply.forEach((item) => appendMessage(mode, "assistant", item));
    return;
  }

  appendMessage(mode, "assistant", reply);
}

function showTyping() {
  const wrapper = document.createElement("article");
  wrapper.className = "message assistant typing";
  wrapper.id = "typingIndicator";
  wrapper.dataset.emotion = "hq";
  wrapper.innerHTML = `
    <div class="message-card">
      <div class="message-meta">
        <span class="message-role">🧠 走神了一会儿</span>
        <span class="message-time">${formatTime(new Date())}</span>
      </div>
      <div class="message-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
  messageList.appendChild(wrapper);
  messageList.scrollTop = messageList.scrollHeight;
}

function hideTyping() {
  document.getElementById("typingIndicator")?.remove();
}

function autoResize() {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 180)}px`;
}

function formatTime(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function shiftTimestamp(date, offset) {
  return new Date(new Date(date).getTime() + offset * 600);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function hydrateState() {
  const fallbackHistories = createDefaultHistories();
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    state.histories = fallbackHistories;
    state.compassRecords = {};
    state.roleProgress = createDefaultRoleProgressState();
    syncRoleProgressWithHistories();
    return;
  }

  try {
    const saved = JSON.parse(raw);
    state.activeMode = modes[saved.activeMode] ? saved.activeMode : "emotion_compass";
    state.compassRecords = saved.compassRecords && typeof saved.compassRecords === "object" ? saved.compassRecords : {};
    state.roleProgress = normalizeRoleProgress(saved.roleProgress);
    state.histories = Object.keys(modes).reduce((acc, modeKey) => {
      const safeHistory = Array.isArray(saved.histories?.[modeKey])
        ? saved.histories[modeKey]
            .filter((item) => item && item.content && (item.role === "user" || item.role === "assistant"))
            .map((item) => ({
              id: item.id || createMessageId(),
              role: item.role,
              content: item.content,
              timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
              feedback: item.feedback === "up" || item.feedback === "down" ? item.feedback : null
            }))
        : [];

      acc[modeKey] = safeHistory.length ? safeHistory : fallbackHistories[modeKey];
      return acc;
    }, {});
    syncRoleProgressWithHistories();
  } catch {
    state.histories = fallbackHistories;
    state.compassRecords = {};
    state.roleProgress = createDefaultRoleProgressState();
    syncRoleProgressWithHistories();
  }
}

function createDefaultHistories() {
  return Object.keys(modes).reduce((acc, modeKey) => {
    acc[modeKey] = [
      {
        id: createMessageId(),
        role: "assistant",
        content: createAssistantMessage("hq", modes[modeKey].welcome),
        timestamp: new Date(),
        feedback: null
      }
    ];
    return acc;
  }, {});
}

function persistState() {
  const payload = {
    activeMode: state.activeMode,
    histories: state.histories,
    compassRecords: state.compassRecords,
    roleProgress: state.roleProgress
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function injectActionPrompt(kind) {
  const prompt = modes[state.activeMode].actionCards[kind].prompt;
  messageInput.value = prompt;
  autoResize();
  messageInput.focus();
}

function createAssistantMessage(emotionKey, text) {
  return {
    speaker: emotions[emotionKey].name,
    emoji: emotions[emotionKey].emoji,
    emotionKey,
    text
  };
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function signTodayCompass() {
  const now = new Date();
  const todayKey = formatDateKey(now);

  if (!state.compassRecords[todayKey]) {
    const chosenKey = pickRandom(["joy", "sadness", "anger", "fear", "disgust"]);
    const oracle = emotionCompassOracle[chosenKey];

    state.compassRecords[todayKey] = {
      roleKey: chosenKey,
      speaker: emotions[chosenKey].name,
      emoji: emotions[chosenKey].emoji,
      suitable: oracle.suitable,
      avoid: oracle.avoid,
      quote: oracle.quote,
      color: pickRoleColor(chosenKey),
      dateLabel: `${now.getMonth() + 1}月${now.getDate()}日`
    };

    persistState();
  }

  renderCompassPanel();
}

function rerollTodayCompass() {
  const now = new Date();
  const todayKey = formatDateKey(now);
  const chosenKey = pickRandom(["joy", "sadness", "anger", "fear", "disgust"]);
  const oracle = emotionCompassOracle[chosenKey];

  state.compassRecords[todayKey] = {
    roleKey: chosenKey,
    speaker: emotions[chosenKey].name,
    emoji: emotions[chosenKey].emoji,
    suitable: oracle.suitable,
    avoid: oracle.avoid,
    quote: oracle.quote,
    color: pickRoleColor(chosenKey),
    dateLabel: `${now.getMonth() + 1}月${now.getDate()}日`
  };

  persistState();
  renderCompassPanel();
}

function pickDistinct(items, count) {
  const pool = [...items];
  const chosen = [];

  while (pool.length && chosen.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }

  return chosen;
}

function renderRoleGallery() {
  roleGrid.innerHTML = "";

  ["joy", "sadness", "anger", "fear", "disgust"].forEach((roleKey) => {
    const profile = emotionProfiles[roleKey];
    const progress = state.roleProgress[roleKey];
    const card = document.createElement("article");
    card.className = "role-card";
    card.style.setProperty("--role-color", pickRoleColor(roleKey));
    card.innerHTML = `
      <div class="role-card-top">
        <span class="role-card-icon">${emotions[roleKey].emoji}</span>
        <div>
          <strong>${emotions[roleKey].name}</strong>
          <p>${profile.tagline}</p>
        </div>
      </div>
      <p class="role-card-copy">${profile.description}</p>
      <div class="role-level-chip">${getLevelName(progress.score)} Lv.${progress.level}</div>
      <div class="role-stats">
        <span>支持 ${progress.likes}</span>
        <span>踩下 ${progress.dislikes}</span>
        <span>分值 ${progress.score}</span>
      </div>
      <p class="role-growth-copy">${profile.growthFocus}</p>
    `;
    roleGrid.appendChild(card);
  });
}

function shouldRenderFeedback(message) {
  return message.role === "assistant" && Boolean(message.content?.emotionKey) && message.content.emotionKey !== "hq";
}

function applyFeedback(messageId, nextFeedback) {
  if (!messageId || !FEEDBACK_VALUES[nextFeedback]) {
    return;
  }

  const message = findMessageById(messageId);
  if (!message || !shouldRenderFeedback(message)) {
    return;
  }

  const roleKey = message.content.emotionKey;
  const previousFeedback = message.feedback;

  if (previousFeedback === nextFeedback) {
    updateRoleScore(roleKey, previousFeedback, "remove");
    message.feedback = null;
  } else {
    if (previousFeedback) {
      updateRoleScore(roleKey, previousFeedback, "remove");
    }
    updateRoleScore(roleKey, nextFeedback, "add");
    message.feedback = nextFeedback;
  }

  persistState();
  renderMessages();
  renderRoleGallery();
}

function updateRoleScore(roleKey, feedback, direction) {
  const progress = state.roleProgress[roleKey];
  const multiplier = direction === "remove" ? -1 : 1;

  progress.score += FEEDBACK_VALUES[feedback] * multiplier;

  if (feedback === "up") {
    progress.likes += multiplier;
  } else if (feedback === "down") {
    progress.dislikes += multiplier;
  }

  progress.level = getLevel(progress.score);
}

function findMessageById(messageId) {
  return Object.values(state.histories)
    .flat()
    .find((item) => item.id === messageId);
}

function normalizeRoleProgress(savedRoleProgress) {
  const defaults = createDefaultRoleProgressState();

  return Object.keys(defaults).reduce((acc, roleKey) => {
    const source = savedRoleProgress?.[roleKey] || {};
    const score = Number.isFinite(source.score) ? source.score : 0;
    acc[roleKey] = {
      likes: Number.isFinite(source.likes) ? source.likes : 0,
      dislikes: Number.isFinite(source.dislikes) ? source.dislikes : 0,
      score,
      level: getLevel(score)
    };
    return acc;
  }, {});
}

function createDefaultRoleProgressState() {
  return {
    joy: createDefaultRoleProgress(),
    sadness: createDefaultRoleProgress(),
    anger: createDefaultRoleProgress(),
    fear: createDefaultRoleProgress(),
    disgust: createDefaultRoleProgress()
  };
}

function syncRoleProgressWithHistories() {
  const nextProgress = createDefaultRoleProgressState();

  Object.values(state.histories)
    .flat()
    .forEach((message) => {
      if (!shouldRenderFeedback(message) || !message.feedback) {
        return;
      }

      const progress = nextProgress[message.content.emotionKey];
      if (message.feedback === "up") {
        progress.likes += 1;
        progress.score += 1;
      } else if (message.feedback === "down") {
        progress.dislikes += 1;
        progress.score -= 1;
      }
    });

  Object.values(nextProgress).forEach((progress) => {
    progress.level = getLevel(progress.score);
  });

  state.roleProgress = nextProgress;
}

function createDefaultRoleProgress() {
  return {
    likes: 0,
    dislikes: 0,
    score: 0,
    level: 1
  };
}

function getLevel(score) {
  if (score >= 8) {
    return 4;
  }
  if (score >= 4) {
    return 3;
  }
  if (score >= 0) {
    return 2;
  }
  return 1;
}

function getLevelName(score) {
  return levelRules.find((rule) => score >= rule.minScore)?.name || "新秀";
}

function createMessageId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function pickRoleColor(roleKey) {
  if (roleKey === "joy") {
    return "#ffc862";
  }
  if (roleKey === "sadness") {
    return "#78c9ff";
  }
  if (roleKey === "anger") {
    return "#ff7d57";
  }
  if (roleKey === "fear") {
    return "#a89bff";
  }
  return "#8fe18a";
}

function buildFutureScript(emotionKey, topic) {
  if (emotionKey === "joy") {
    return `[乐乐]的剧本：你决定围绕“${topic}”勇敢迈出一步，虽然过程忙得团团转，但一路上遇到了新机会和新伙伴，最后你会很开心自己没有错过这次成长！✨😊`;
  }

  if (emotionKey === "fear") {
    return `[怕怕]的剧本：你开始处理“${topic}”，可是万一中途出岔子怎么办？万一别人不支持你、计划失控、连退路都没留好怎么办？这真的需要先想清楚……😟😨`;
  }

  if (emotionKey === "anger") {
    return `[怒怒]的剧本：如果“${topic}”背后藏着委屈和不公平，那就别再忍了！你这次干脆把态度亮出来，直接争取自己该得的东西，让所有轻视你的人闭嘴！🔥👊`;
  }

  if (emotionKey === "sadness") {
    return `[忧忧]的剧本：你面对“${topic}”的时候，先承认自己其实有点舍不得、也有点累……慢一点没关系。这个剧本里，你没有逞强，而是被好好理解了。💧🫂`;
  }

  return `[厌厌]的剧本：围绕“${topic}”，你终于看清哪些人和选项根本不值得投入。呃，不合适就是不合适，及时筛掉这些消耗项，品味和边界都要在线。🙄💅`;
}

function detectVibe(text) {
  if (/[累困疲]/.test(text)) {
    return "疲惫里夹着一点硬撑";
  }
  if (/[烦躁气火怒]/.test(text)) {
    return "压抑过久的烦闷";
  }
  if (/[怕慌焦虑紧张]/.test(text)) {
    return "悬着的担心";
  }
  if (/[开心期待轻松兴奋]/.test(text)) {
    return "亮起来的期待";
  }
  return "说不清但确实存在的波动";
}

function summarizeTopic(text) {
  const cleaned = text.replace(/[。！？!?,，]/g, " ").trim();
  if (cleaned.length <= 18) {
    return cleaned || "这件还没发生的事";
  }
  return `${cleaned.slice(0, 18)}...`;
}

function detectMemoryLens(text) {
  if (/[失败丢脸后悔]/.test(text)) {
    return "遗憾";
  }
  if (/[想念离开失去]/.test(text)) {
    return "想念";
  }
  if (/[委屈误会忽略]/.test(text)) {
    return "委屈";
  }
  return "复杂";
}
