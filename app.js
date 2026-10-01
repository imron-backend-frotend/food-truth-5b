// ==========================================================================
// FOOD TRUTH PROJECT - JAVASCRIPT ENGINE
// Author: Raimov Ikhlas, 5 "B" Grade
// Theme: Emerald & Deep Black (with Monochrome White/Black option)
// ==========================================================================

// Global state
let soundEnabled = true;
let currentQuestionIndex = 0;
let userScore = 0;
let isAnswerLocked = false;
let surveyChartInstance = null;

// Audio Synthesizer (Web Audio API)
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'correct') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

      osc2.frequency.setValueAtTime(659.25, now);
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.18); // C6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);

    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);

    } else if (type === 'win') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.45);
      });

    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch (e) {
    // Handled silently
  }
}

// --------------------------------------------------------------------------
// ROBUST STARTUP HANDLER (Runs on DOMContentLoaded or immediately if ready)
// --------------------------------------------------------------------------
function startApp() {
  // 1. Initialize Quiz immediately
  try { initQuiz(); } catch (e) { console.error('Quiz init error:', e); }

  // 2. Initialize Theme
  try { initThemeToggle(); } catch (e) { console.warn(e); }

  // 3. Initialize Sound Toggle
  try { initSoundToggle(); } catch (e) { console.warn(e); }

  // 4. Initialize Sugarometer
  try { selectSugarItem('cola'); } catch (e) { console.warn(e); }

  // 5. Initialize Organ Explorer
  try { showOrganInfo('brain'); } catch (e) { console.warn(e); }

  // 6. Initialize Fitness Calculator
  try { initCalculator(); } catch (e) { console.warn(e); }

  // 7. Initialize Certificate Input
  try { initCertificateInput(); } catch (e) { console.warn(e); }

  // 8. Initialize Survey Chart
  try { initSurveyChart(); } catch (e) { console.warn(e); }

  // 9. Mobile menu toggle
  try {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }
  } catch (e) {}

  // 10. Lucide Icons
  if (window.lucide && typeof lucide.createIcons === 'function') {
    try { lucide.createIcons(); } catch (e) {}
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// --------------------------------------------------------------------------
// THEME TOGGLE: Green/Black <-> White/Black
// --------------------------------------------------------------------------
function initThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (!themeBtn) return;

  const savedTheme = localStorage.getItem('food-truth-theme');
  if (savedTheme === 'monochrome') {
    document.body.classList.add('theme-monochrome');
    updateThemeBtnLabel(true);
  }

  themeBtn.addEventListener('click', () => {
    playSound('click');
    const isMono = document.body.classList.toggle('theme-monochrome');
    localStorage.setItem('food-truth-theme', isMono ? 'monochrome' : 'emerald');
    updateThemeBtnLabel(isMono);
    if (surveyChartInstance) {
      updateChartColors(isMono);
    }
  });
}

function updateThemeBtnLabel(isMono) {
  const label = document.getElementById('theme-toggle-label');
  const icon = document.getElementById('theme-toggle-icon');
  if (label) {
    label.textContent = isMono ? 'Бело-чёрный' : 'Изумрудно-чёрный';
  }
  if (icon) {
    icon.textContent = isMono ? '⚪' : '🌿';
  }
}

// --------------------------------------------------------------------------
// SOUND TOGGLE
// --------------------------------------------------------------------------
function initSoundToggle() {
  const soundBtn = document.getElementById('sound-toggle-btn');
  if (!soundBtn) return;

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const label = document.getElementById('sound-toggle-label');
    const icon = document.getElementById('sound-toggle-icon');
    if (label) label.textContent = soundEnabled ? 'Звук: Вкл' : 'Звук: Выкл';
    if (icon) icon.textContent = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled) playSound('click');
  });
}

// --------------------------------------------------------------------------
// 1. SUGAROMETER LOGIC
// --------------------------------------------------------------------------
const sugarData = {
  cola: {
    name: 'Кола / Газировка (0.5 л)',
    cubes: 12,
    grams: 48,
    percent: '+192%',
    verdict: '⚠️ Выпив одну бутылочку колы (0.5л), ты за раз получаешь ДВЕ суточные нормы сахара! Организм пятиклассника испытывает тяжелый скачок глюкозы.'
  },
  juice: {
    name: 'Пакетированный сок (0.5 л)',
    cubes: 10,
    grams: 40,
    percent: '+160%',
    verdict: '⚠️ В промышленном соке нет полезной растительной клетчатки — это просто подкрашенный фруктозный сироп, нагружающий поджелудочную железу.'
  },
  energy: {
    name: 'Энергетический напиток (0.33 л)',
    cubes: 9,
    grams: 36,
    percent: '+144%',
    verdict: '⚠️ 9 кубиков сахара в комбинации с ударной дозой кофеина и таурина перегружают сердце школьника и расшатывают нервную систему.'
  },
  shake: {
    name: 'Молочный коктейль в фастфуде (0.4 л)',
    cubes: 14,
    grams: 56,
    percent: '+224%',
    verdict: '⚠️ Один стакан такого коктейля содержит почти ТРИ дневные нормы сахара и рекордное количество скрытых гидрогенизированных жиров!'
  },
  water: {
    name: 'Чистая питьевая вода (0.5 л)',
    cubes: 0,
    grams: 0,
    percent: '0% (Идеал)',
    verdict: '✅ Золотой выбор Раимова Ихласа! Вода утоляет жажду, питает мозг на контрольных работах и очищает тело от токсинов.'
  }
};

window.selectSugarItem = function(key, btnElement) {
  const item = sugarData[key];
  if (!item) return;

  const targetBtn = btnElement || (typeof window !== 'undefined' && window.event ? window.event.target.closest('.sugar-btn') : null);
  const buttons = document.querySelectorAll('.sugar-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  if (targetBtn) {
    targetBtn.classList.add('active');
  } else {
    const defaultBtn = document.querySelector(`.sugar-btn[data-key="${key}"]`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }

  const nameEl = document.getElementById('sugar-name');
  const gramsEl = document.getElementById('sugar-grams');
  const percentEl = document.getElementById('sugar-percent');
  const verdictEl = document.getElementById('sugar-verdict');
  const container = document.getElementById('sugar-cubes-container');

  if (nameEl) nameEl.textContent = item.name;
  if (gramsEl) gramsEl.textContent = `${item.grams} грамм`;
  if (percentEl) percentEl.textContent = item.percent;
  if (verdictEl) verdictEl.textContent = item.verdict;

  if (container) {
    container.innerHTML = '';
    if (item.cubes === 0) {
      container.innerHTML = `
        <div class="py-6 text-center animate-bounce">
          <span class="text-6xl">💧</span>
          <p class="text-base font-bold text-emerald-400 mt-2 font-display">0 кубиков сахара!</p>
          <p class="text-xs text-slate-400">Идеальный выбор для ума и здоровья!</p>
        </div>
      `;
    } else {
      for (let i = 0; i < item.cubes; i++) {
        const cube = document.createElement('div');
        cube.className = 'sugar-cube';
        cube.title = `Кубик сахара #${i + 1} (~4 грамма)`;
        cube.style.animationDelay = `${i * 35}ms`;
        container.appendChild(cube);
      }
    }
  }
};

// --------------------------------------------------------------------------
// 2. ORGAN DETAILS LOGIC
// --------------------------------------------------------------------------
const organData = {
  brain: {
    icon: '🧠',
    category: 'Нервная система и интеллект',
    title: 'Головной мозг и внимание на уроках',
    desc1: 'После употребления сладостей и фастфуда наступает резкий всплеск глюкозы. Мозг чувствует короткую эйфорию, но уже через 20 минут уровень сахара резко падает ниже нормы — начинаются «сахарные качели».',
    desc2: '⚡ <strong>Результат на уроках:</strong> Пятиклассник теряет концентрацию, отвлекается, допускает обидные ошибки на контрольных по математике и засыпает на третьем уроке.',
    enemy: 'Скрытый сахар, энергетики, сладкая газировка',
    friend: 'Грецкие орехи, свежие ягоды, чистая питьевая вода'
  },
  teeth: {
    icon: '🦷',
    category: 'Зубочелюстная система',
    title: 'Зубы и прочность эмали',
    desc1: 'Сладкие газированные напитки содержат ортофосфорную кислоту (pH около 2.5), которая буквально вымывает кальций из детской зубной эмали.',
    desc2: '⚡ <strong>Результат:</strong> Бактерии полости рта питаются остатками сахара от карамели и чипсов, вырабатывая кислоту, вызывающую глубокий кариес и боль.',
    enemy: 'Лимонады, ириски, леденцы с красителями',
    friend: 'Творог, твердый сыр, свежая морковь и яблоки'
  },
  stomach: {
    icon: '🫄',
    category: 'Пищеварительный тракт',
    title: 'Желудок и микрофлора кишечника',
    desc1: 'Агрессивные химические специи из сухариков, чипсов и пережаренное во фритюре масло обжигают слизистую оболочку желудка, провоцируя развитие гастрита.',
    desc2: '⚡ <strong>Результат:</strong> В фастфуде нет клетчатки. Полезные бактерии кишечника голодают, что ослабляет иммунитет школьника и вызывает боли в животе.',
    enemy: 'Чипсы, сухарики со вкусовыми добавками Е621',
    friend: 'Овсяная каша, овощи, натуральный кефир'
  },
  heart: {
    icon: '🫀',
    category: 'Сердечно-сосудистая система',
    title: 'Сердце и кровеносные сосуды',
    desc1: 'Одна пачка снеков содержит до 100% суточной нормы натрия. Избыток соли задерживает воду в организме, повышая артериальное давление и перегружая сердце.',
    desc2: '⚡ <strong>Результат:</strong> Искусственные трансжиры повышают «плохой» холестерин, который начинает засорять сосуды уже в школьном возрасте.',
    enemy: 'Трансжиры, картофель фри, избыток соли',
    friend: 'Бананы (источник калия), рыба, спорт'
  },
  skin: {
    icon: '🧒',
    category: 'Кожа и внешний вид',
    title: 'Кожа лица и подростковое здоровье',
    desc1: 'Продукты с высоким гликемическим индексом (булочки, пирожные, фастфуд) вызывают выброс инсулина, который чрезмерно активирует сальные железы.',
    desc2: '⚡ <strong>Результат:</strong> Поры забиваются, воспаляются, появляются неприятные угри и высыпания, которые часто портят настроение ребятам.',
    enemy: 'Молочный шоколад, майонезные соусы, бургеры',
    friend: 'Свежая зелень, морковь, огурцы, чистая вода'
  },
  liver: {
    icon: '🫁',
    category: 'Фильтры организма',
    title: 'Печень и почки',
    desc1: 'Печени приходится круглосуточно нейтрализовать синтетические красители (Е102, Е129) и консерванты, поступающие с фастфудом.',
    desc2: '⚡ <strong>Результат:</strong> Избыток фруктозы из сладких напитков печень перерабатывает сразу в висцеральный жир, вызывая раннее ожирение.',
    enemy: 'Химические добавки, избыток фруктозы из пакетов',
    friend: 'Брокколи, свекла, травяные чаи'
  }
};

window.showOrganInfo = function(organKey, btnElement) {
  const organ = organData[organKey];
  if (!organ) return;

  const targetBtn = btnElement || (typeof window !== 'undefined' && window.event ? window.event.target.closest('.organ-btn') : null);
  const buttons = document.querySelectorAll('.organ-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  if (targetBtn) {
    targetBtn.classList.add('active');
  } else {
    const defaultBtn = document.querySelector(`.organ-btn[data-organ="${organKey}"]`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }

  const iconEl = document.getElementById('organ-icon');
  const catEl = document.getElementById('organ-category');
  const titleEl = document.getElementById('organ-title');
  const desc1El = document.getElementById('organ-desc-1');
  const desc2El = document.getElementById('organ-desc-2');
  const enemyEl = document.getElementById('organ-enemy');
  const friendEl = document.getElementById('organ-friend');

  if (iconEl) iconEl.textContent = organ.icon;
  if (catEl) catEl.textContent = organ.category;
  if (titleEl) titleEl.textContent = organ.title;
  if (desc1El) desc1El.textContent = organ.desc1;
  if (desc2El) desc2El.innerHTML = organ.desc2;
  if (enemyEl) enemyEl.textContent = organ.enemy;
  if (friendEl) friendEl.textContent = organ.friend;
};

// --------------------------------------------------------------------------
// 3. CALORIE & WORKOUT CALCULATOR
// --------------------------------------------------------------------------
function initCalculator() {
  const checkboxes = document.querySelectorAll('.calc-checkbox');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      playSound('click');
      calculateBurn();
    });
  });
  calculateBurn();
}

function calculateBurn() {
  const checkboxes = document.querySelectorAll('.calc-checkbox:checked');
  let totalKcal = 0;

  checkboxes.forEach(cb => {
    totalKcal += parseInt(cb.dataset.kcal || 0, 10);
  });

  const dailyStandard = 2300;
  const percent = Math.round((totalKcal / dailyStandard) * 100);

  const laps = totalKcal > 0 ? Math.ceil(totalKcal / 35) : 0;
  const cycling = totalKcal > 0 ? Math.ceil(totalKcal / 9.5) : 0;
  const rope = totalKcal > 0 ? Math.ceil(totalKcal / 11) : 0;

  const kcalEl = document.getElementById('total-kcal');
  const percentEl = document.getElementById('total-percent');
  const lapsEl = document.getElementById('laps-count');
  const cyclingEl = document.getElementById('cycling-mins');
  const ropeEl = document.getElementById('rope-mins');

  if (kcalEl) kcalEl.textContent = `${totalKcal} ккал`;
  if (percentEl) percentEl.textContent = `${percent}%`;
  if (lapsEl) lapsEl.textContent = `${laps} ${getRussianPlural(laps, 'круг', 'круга', 'кругов')}`;
  if (cyclingEl) cyclingEl.textContent = `${cycling} ${getRussianPlural(cycling, 'минута', 'минуты', 'минут')}`;
  if (ropeEl) ropeEl.textContent = `${rope} ${getRussianPlural(rope, 'минута', 'минуты', 'минут')}`;
}

function getRussianPlural(number, one, two, five) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) return five;
  n %= 10;
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return two;
  return five;
}

// --------------------------------------------------------------------------
// 4. CHART.JS SURVEY DATA (5 «Б» КЛАСС)
// --------------------------------------------------------------------------
function initSurveyChart() {
  const canvas = document.getElementById('surveyChart1');
  if (!canvas) return;

  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded, skipping chart canvas');
    return;
  }

  const isMono = document.body.classList.contains('theme-monochrome');
  const colors = isMono 
    ? ['#ffffff', '#888888', '#333333'] 
    : ['#10b981', '#34d399', '#064e3b'];

  const ctx = canvas.getContext('2d');
  surveyChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Каждый день (12 чел)', '2-3 раза в нед. (9 чел)', 'Редко / никогда (5 чел)'],
      datasets: [{
        data: [12, 9, 5],
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#050811'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = 26;
              const val = context.raw;
              const pct = ((val / total) * 100).toFixed(1);
              return ` ${context.label}: ${pct}%`;
            }
          }
        }
      },
      cutout: '72%'
    }
  });
}

function updateChartColors(isMono) {
  if (!surveyChartInstance) return;
  surveyChartInstance.data.datasets[0].backgroundColor = isMono
    ? ['#ffffff', '#888888', '#333333']
    : ['#10b981', '#34d399', '#064e3b'];
  surveyChartInstance.update();
}

// --------------------------------------------------------------------------
// 5. INTERACTIVE QUIZ ENGINE - ULTRA RELIABLE & BULLETPROOF
// --------------------------------------------------------------------------
const quizQuestions = [
  {
    q: '1. Сколько кубиков рафинированного сахара скрыто в обычной бутылке колы (0.5 л)?',
    options: [
      { text: 'Около 1–2 кубиков для легкого вкуса', correct: false },
      { text: 'Примерно 12 кубиков (почти 50 грамм!)', correct: true },
      { text: 'Сахара там нет, только газ и вода', correct: false }
    ],
    explanation: 'Верно! В бутылке 0.5 л содержится около 12 кубиков сахара — это сразу ДВЕ дневные нормы пятиклассника!'
  },
  {
    q: '2. Какое опасное вещество образуется в картошке фри и чипсах при жарке в перегретом масле?',
    options: [
      { text: 'Акриламид и канцерогенные трансжиры', correct: true },
      { text: 'Полезный витамин D', correct: false },
      { text: 'Натуральная морская соль', correct: false }
    ],
    explanation: 'Точно! При сильном нагревании крахмала с перегретым маслом образуются опасный акриламид и токсичные трансжиры.'
  },
  {
    q: '3. Чем автор проекта Раимов Ихлас предлагает заменить покупные химические чипсы?',
    options: [
      { text: 'Ничем, чипсы невозможно ничем заменить', correct: false },
      { text: 'Запеченными хрустящими чипсами из лаваша с паприкой или сушеными яблоками', correct: true },
      { text: 'Острыми сухариками с глутаматом', correct: false }
    ],
    explanation: 'Абсолютно верно! Тонкий лаваш, запеченный с капелькой оливкового масла и специями, хрустит так же аппетитно, но не содержит канцерогенов.'
  },
  {
    q: '4. Почему после перекуса сладостями и колой на уроке наступает вялость и сонливость?',
    options: [
      { text: 'Мозг резко теряет энергию из-за «сахарных качелей»', correct: true },
      { text: 'Потому что в газировку добавляют снотворное', correct: false },
      { text: 'Это просто случайное совпадение', correct: false }
    ],
    explanation: 'Правильно! Быстрый сахар вызывает резкий скачок инсулина, после чего уровень глюкозы падает ниже нормы — наступает апатия и усталость.'
  },
  {
    q: '5. Какую часть тарелки по правилу здорового питания должны занимать свежие овощи и фрукты?',
    options: [
      { text: 'Примерно половину тарелки (50%)', correct: true },
      { text: 'Не больше 5% от всей еды', correct: false },
      { text: 'Овощи вообще можно не есть, если пьешь чай с сахаром', correct: false }
    ],
    explanation: 'Превосходно! По стандартам ВОЗ не менее 50% суточного рациона должны составлять богатые клетчаткой свежие овощи, зелень и фрукты.'
  }
];

function initQuiz() {
  currentQuestionIndex = 0;
  userScore = 0;
  isAnswerLocked = false;
  renderQuestion(0);
}

function renderQuestion(index) {
  isAnswerLocked = false;
  const qData = quizQuestions[index];
  if (!qData) return;

  const progressPercent = ((index + 1) / quizQuestions.length) * 100;
  const progressBar = document.getElementById('quiz-progress');
  const stepLabel = document.getElementById('quiz-step');
  const scoreBadge = document.getElementById('quiz-score-badge');

  if (progressBar) progressBar.style.width = `${progressPercent}%`;
  if (stepLabel) stepLabel.textContent = `Вопрос ${index + 1} из ${quizQuestions.length}`;
  if (scoreBadge) scoreBadge.textContent = `Баллы: ${userScore}`;

  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('quiz-next-btn');
  if (feedbackEl) {
    feedbackEl.classList.add('hidden');
    feedbackEl.innerHTML = '';
  }
  if (nextBtn) {
    nextBtn.classList.add('hidden');
  }

  const questionEl = document.getElementById('quiz-question');
  if (questionEl) {
    questionEl.textContent = qData.q;
  }

  const container = document.getElementById('quiz-options');
  if (!container) return;
  container.innerHTML = '';

  const keyLabels = ['А', 'Б', 'В'];

  qData.options.forEach((opt, optIdx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-opt-btn';
    btn.setAttribute('data-correct', opt.correct ? 'true' : 'false');
    btn.setAttribute('onclick', `handleOptionIndex(${optIdx})`);
    btn.innerHTML = `
      <div class="flex items-center gap-3 text-left">
        <span class="quiz-opt-key">${keyLabels[optIdx] || optIdx + 1}</span>
        <span class="quiz-opt-text">${opt.text}</span>
      </div>
      <span class="quiz-opt-status text-lg opacity-40">⚪</span>
    `;
    container.appendChild(btn);
  });
}

// Global option click handler accessible anywhere
window.handleOptionIndex = function(optIdx) {
  if (isAnswerLocked) return;
  isAnswerLocked = true;

  const qData = quizQuestions[currentQuestionIndex];
  if (!qData) return;
  const selectedOption = qData.options[optIdx];
  if (!selectedOption) return;

  const allBtns = document.querySelectorAll('.quiz-opt-btn');
  const clickedBtn = allBtns[optIdx];
  allBtns.forEach(btn => btn.classList.add('locked'));

  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('quiz-next-btn');
  const scoreBadge = document.getElementById('quiz-score-badge');

  if (selectedOption.correct) {
    userScore++;
    if (scoreBadge) scoreBadge.textContent = `Баллы: ${userScore}`;
    if (clickedBtn) {
      clickedBtn.classList.add('is-correct');
      const statusEl = clickedBtn.querySelector('.quiz-opt-status');
      if (statusEl) {
        statusEl.textContent = '✅';
        statusEl.classList.remove('opacity-40');
      }
    }

    playSound('correct');

    if (feedbackEl) {
      feedbackEl.className = 'p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm mb-6 flex items-start gap-3 shadow-lg';
      feedbackEl.innerHTML = `
        <span class="text-2xl">🎉</span>
        <div>
          <strong class="font-bold text-white block mb-0.5">В яблочко!</strong>
          ${qData.explanation}
        </div>
      `;
      feedbackEl.classList.remove('hidden');
    }
  } else {
    if (clickedBtn) {
      clickedBtn.classList.add('is-wrong');
      const statusEl = clickedBtn.querySelector('.quiz-opt-status');
      if (statusEl) {
        statusEl.textContent = '❌';
        statusEl.classList.remove('opacity-40');
      }
    }

    // Highlight the correct answer
    allBtns.forEach(btn => {
      if (btn.getAttribute('data-correct') === 'true') {
        btn.classList.add('is-correct');
        const corStatus = btn.querySelector('.quiz-opt-status');
        if (corStatus) corStatus.textContent = '✅';
      }
    });

    playSound('wrong');

    if (feedbackEl) {
      feedbackEl.className = 'p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs sm:text-sm mb-6 flex items-start gap-3 shadow-lg';
      feedbackEl.innerHTML = `
        <span class="text-2xl">⚠️</span>
        <div>
          <strong class="font-bold text-white block mb-0.5">Не совсем верно!</strong>
          ${qData.explanation}
        </div>
      `;
      feedbackEl.classList.remove('hidden');
    }
  }

  if (nextBtn) {
    nextBtn.classList.remove('hidden');
    nextBtn.classList.add('btn-next-pulse');
  }
};

window.nextQuestion = function() {
  playSound('click');
  currentQuestionIndex++;
  if (currentQuestionIndex < quizQuestions.length) {
    renderQuestion(currentQuestionIndex);
  } else {
    showQuizResults();
  }
};

function showQuizResults() {
  const container = document.getElementById('quiz-container');
  const resultBox = document.getElementById('quiz-result-box');
  if (container) container.classList.add('hidden');
  if (resultBox) resultBox.classList.remove('hidden');

  const titleEl = document.getElementById('result-title');
  const subEl = document.getElementById('result-subtitle');
  const scoreNumberEl = document.getElementById('cert-score-number');

  if (scoreNumberEl) {
    scoreNumberEl.textContent = `${userScore} из 5`;
  }

  if (userScore >= 4) {
    if (titleEl) titleEl.textContent = '🏆 Браво! Отличник ЗОЖ!';
    if (subEl) subEl.textContent = `Ты ответил правильно на ${userScore} из 5 вопросов! Твоим знаниям о правильном питании позавидует любой старшеклассник!`;
    playSound('win');
    launchConfetti();
  } else {
    if (titleEl) titleEl.textContent = '👍 Хороший результат!';
    if (subEl) subEl.textContent = `Ты набрал ${userScore} из 5 баллов. Перечитай проект Раимова Ихласа и попробуй ещё раз на круглую 5!`;
    playSound('correct');
  }
}

window.restartQuiz = function() {
  playSound('click');
  const container = document.getElementById('quiz-container');
  const resultBox = document.getElementById('quiz-result-box');
  if (resultBox) resultBox.classList.add('hidden');
  if (container) container.classList.remove('hidden');
  initQuiz();
};

function launchConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 60,
        spread: 60,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 70,
        angle: 120,
        spread: 60,
        origin: { x: 1 }
      });
    }, 450);
  }
}

// --------------------------------------------------------------------------
// 6. CERTIFICATE LIVE NAME SYNC
// --------------------------------------------------------------------------
function initCertificateInput() {
  const input = document.getElementById('student-name-input');
  const certNameDisplay = document.getElementById('cert-student-name');
  if (input && certNameDisplay) {
    input.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      certNameDisplay.textContent = val ? val : 'Ученик 5 «Б» класса';
    });
  }
}
