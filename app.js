const lessons = [
  {
    title: 'Meet JavaScript',
    duration: '8 min',
    description: 'Discover what JavaScript does and how it brings web pages to life.',
    concept: [
      'HTML gives a page its structure. CSS gives it a look. JavaScript adds behavior: menus that open, forms that respond, and little details that make a site feel alive.',
      'Your browser can run JavaScript right on the page. You can ask it to respond to a click, update some text, or work with information entered by a visitor.'
    ],
    question: 'Which task is JavaScript best suited to?',
    options: ['Choosing the structure of a page', 'Responding when someone clicks a button', 'Setting the color of every heading'],
    answer: 1
  },
  {
    title: 'Variables & values',
    duration: '12 min',
    description: 'Give information a name so you can use it again in your program.',
    concept: [
      'A variable is a named place to keep a value. Use <code>const</code> when the name should keep pointing to the same value, and <code>let</code> when you plan to assign it a new value.',
      '<code>const learner = "Jamie";</code> stores some text. <code>const lessonsDone = 2;</code> stores a number. The value can be used later by referring to its name.'
    ],
    question: 'Which keyword is a good default when you will not reassign a variable?',
    options: ['const', 'change', 'repeat'],
    answer: 0
  },
  {
    title: 'Working with strings',
    duration: '10 min',
    description: 'Combine and shape text using JavaScript strings.',
    concept: [
      'A string is text wrapped in quotes. Template literals use backticks and let you place a value directly inside text with <code>${...}</code>.',
      '<code>const greeting = `Hello, ${learner}!`;</code> builds a friendly message from a variable and a string.'
    ],
    question: 'Which characters wrap a JavaScript template literal?',
    options: ['Parentheses ( )', 'Backticks ` `', 'Square brackets [ ]'],
    answer: 1
  },
  {
    title: 'Functions that do things',
    duration: '14 min',
    description: 'Bundle reusable instructions into functions you can call when needed.',
    concept: [
      'A function groups instructions under a name. Define it once, then call that name whenever you need those steps to run.',
      '<code>function sayHello() { return "Hello!"; }</code> defines a function. Calling <code>sayHello()</code> gives you its returned value.'
    ],
    question: 'What happens when you call a function?',
    options: ['The instructions inside it run', 'The function changes into a variable', 'The browser deletes the function'],
    answer: 0
  },
  {
    title: 'Make decisions with conditions',
    duration: '12 min',
    description: 'Use if and else to let your code choose what to do next.',
    concept: [
      'A condition lets your code choose between paths. An <code>if</code> block runs when its condition is true; an optional <code>else</code> block runs otherwise.',
      '<code>if (lessonsDone &gt;= 6) { ... }</code> checks whether the learner has finished six lessons before running the code inside.'
    ],
    question: 'When does the code inside an if block run?',
    options: ['Whenever the page loads', 'When its condition is true', 'Only after an else block'],
    answer: 1
  },
  {
    title: 'Arrays & the DOM',
    duration: '18 min',
    description: 'Keep lists of information and find page elements to update.',
    concept: [
      'An array keeps an ordered list of values: <code>const topics = ["strings", "functions"];</code>. Each item has a position, starting from index zero.',
      'The DOM is the browser’s representation of your page. JavaScript can find an element with <code>document.querySelector("h1")</code> and update its text or respond to an event.'
    ],
    question: 'Which index holds the first item in a JavaScript array?',
    options: ['0', '1', '-1'],
    answer: 0
  }
];

const storageKey = 'sprout-academy-progress-v1';
const today = new Date().toLocaleDateString('en-CA');
const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || typeof saved !== 'object') throw new Error('Missing progress');
    return {
      completed: Array.isArray(saved.completed) ? saved.completed.filter(index => Number.isInteger(index) && index >= 0 && index < lessons.length) : [],
      quizEarned: Array.isArray(saved.quizEarned) ? saved.quizEarned.filter(index => Number.isInteger(index) && index >= 0 && index < lessons.length) : [],
      xp: Number.isFinite(saved.xp) && saved.xp >= 0 ? saved.xp : 0,
      streak: Number.isInteger(saved.streak) && saved.streak >= 0 ? saved.streak : 0,
      lastStudyDate: typeof saved.lastStudyDate === 'string' ? saved.lastStudyDate : '',
      goalMinutes: saved.goalDate === today && Number.isFinite(saved.goalMinutes) ? saved.goalMinutes : 0
    };
  } catch {
    return { completed: [], quizEarned: [], xp: 0, streak: 0, lastStudyDate: '', goalMinutes: 0 };
  }
}

const progress = loadProgress();
if (progress.lastStudyDate !== today && progress.lastStudyDate !== yesterday) progress.streak = 0;
let activeLesson = 0;
let selectedAnswer = null;
let toastTimeout;

const listElement = document.querySelector('#lesson-list-items');
const dialog = document.querySelector('#lesson-dialog');
const toast = document.querySelector('#toast');

function saveProgress() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      ...progress,
      goalDate: today
    }));
  } catch {
    showToast('Progress could not be saved in this browser.');
  }
}

function renderLessons() {
  listElement.innerHTML = lessons.map((lesson, index) => {
    const isComplete = progress.completed.includes(index);
    const isCurrent = !isComplete && index === lessons.findIndex((_, itemIndex) => !progress.completed.includes(itemIndex));
    const marker = isComplete ? '✓' : String(index + 1).padStart(2, '0');
    return `<article class="lesson-item${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}">
      <span class="lesson-marker" aria-hidden="true">${marker}</span>
      <button class="lesson-open" data-lesson="${index}" aria-label="${isComplete ? 'Review' : 'Open'} lesson ${index + 1}: ${lesson.title}">
        <strong>${lesson.title}</strong><span>${lesson.description}</span>
      </button>
      <span class="lesson-duration">${isComplete ? 'Complete' : lesson.duration}</span>
      <span class="lesson-arrow" aria-hidden="true">${isComplete ? '✓' : '›'}</span>
    </article>`;
  }).join('');
  listElement.querySelectorAll('[data-lesson]').forEach(button => {
    button.addEventListener('click', () => openLesson(Number(button.dataset.lesson)));
  });
}

function renderProgress() {
  const completedCount = progress.completed.length;
  const coursePercent = Math.round((completedCount / lessons.length) * 100);
  const xpInLevel = progress.xp % 200;
  const minutes = Math.min(progress.goalMinutes, 20);
  const goalTrack = document.querySelector('.goal-track');
  const courseTrack = document.querySelector('.course-track');
  const xpTrack = document.querySelector('.xp-track');

  document.querySelector('#course-progress-text').textContent = `${completedCount} of ${lessons.length} lessons`;
  document.querySelector('#lesson-count').textContent = `${completedCount} / ${lessons.length} complete`;
  document.querySelector('#course-progress-fill').style.width = `${coursePercent}%`;
  courseTrack.setAttribute('aria-valuenow', String(completedCount));
  document.querySelector('#xp-total').textContent = String(progress.xp);
  document.querySelector('#level-progress-label').textContent = `${xpInLevel} / 200 XP`;
  document.querySelector('#xp-fill').style.width = `${(xpInLevel / 200) * 100}%`;
  xpTrack.setAttribute('aria-valuenow', String(xpInLevel));
  document.querySelector('#streak-count').textContent = String(progress.streak);
  document.querySelector('#goal-progress').textContent = String(minutes);
  document.querySelector('#goal-fill').style.width = `${(minutes / 20) * 100}%`;
  goalTrack.setAttribute('aria-valuenow', String(minutes));

  const challengeDone = progress.lastStudyDate === today;
  const challengePanel = document.querySelector('.challenge-panel');
  challengePanel.classList.toggle('is-done', challengeDone);
  document.querySelector('#challenge-status').textContent = challengeDone ? 'Challenge complete. Lovely work!' : 'Waiting for your first lesson';
  document.querySelector('.next-badge strong').textContent = completedCount > 0 ? 'Curiosity looks good on you' : 'Curiosity looks good on you';
  document.querySelector('.next-badge div:last-child span').textContent = completedCount > 0 ? `${completedCount} lesson${completedCount === 1 ? '' : 's'} complete. Keep collecting.` : 'Complete a lesson to earn your first badge.';
  renderLessons();
}

function openLesson(index) {
  activeLesson = index;
  selectedAnswer = null;
  const lesson = lessons[index];
  document.querySelector('#dialog-title').textContent = lesson.title;
  document.querySelector('#dialog-unit').textContent = `LESSON ${index + 1} OF ${lessons.length}`;
  document.querySelector('#dialog-description').textContent = lesson.description;
  document.querySelector('#lesson-concept').innerHTML = lesson.concept.map(paragraph => `<p>${paragraph}</p>`).join('');
  document.querySelector('#quiz-question').textContent = lesson.question;
  document.querySelector('#quiz-options').innerHTML = lesson.options.map((option, optionIndex) => `
    <button class="quiz-option" data-option="${optionIndex}" aria-pressed="false">
      <span class="option-marker">${String.fromCharCode(65 + optionIndex)}</span>${option}
    </button>`).join('');
  document.querySelectorAll('[data-option]').forEach(button => {
    button.addEventListener('click', () => selectAnswer(Number(button.dataset.option)));
  });
  const feedback = document.querySelector('#quiz-feedback');
  feedback.textContent = '';
  feedback.classList.remove('is-wrong');
  const checkButton = document.querySelector('#check-answer');
  checkButton.disabled = false;
  checkButton.textContent = progress.quizEarned.includes(index) ? 'Check answer again' : 'Check answer';
  const completeButton = document.querySelector('#complete-lesson');
  completeButton.disabled = progress.completed.includes(index);
  completeButton.innerHTML = progress.completed.includes(index) ? 'Lesson complete <span aria-hidden="true">✓</span>' : 'Complete lesson <span aria-hidden="true">→</span>';
  dialog.showModal();
}

function selectAnswer(optionIndex) {
  selectedAnswer = optionIndex;
  document.querySelectorAll('[data-option]').forEach((button, index) => {
    button.classList.toggle('selected', index === optionIndex);
    button.setAttribute('aria-pressed', String(index === optionIndex));
    button.classList.remove('correct', 'incorrect');
  });
  const feedback = document.querySelector('#quiz-feedback');
  feedback.textContent = '';
  feedback.classList.remove('is-wrong');
  document.querySelector('#check-answer').disabled = false;
}

function checkAnswer() {
  if (selectedAnswer === null) {
    const feedback = document.querySelector('#quiz-feedback');
    feedback.textContent = 'Choose an answer first.';
    feedback.classList.add('is-wrong');
    return;
  }

  const isCorrect = selectedAnswer === lessons[activeLesson].answer;
  const feedback = document.querySelector('#quiz-feedback');
  const option = document.querySelector(`[data-option="${selectedAnswer}"]`);
  if (isCorrect) {
    option.classList.add('correct');
    feedback.classList.remove('is-wrong');
    if (!progress.quizEarned.includes(activeLesson)) {
      progress.quizEarned.push(activeLesson);
      progress.xp += 20;
      saveProgress();
      renderProgress();
      showToast('Correct! You earned 20 XP.');
    }
    feedback.textContent = progress.quizEarned.includes(activeLesson) ? 'That’s right. Nice work!' : 'That’s right. Nice work!';
    document.querySelector('#check-answer').disabled = true;
  } else {
    option.classList.add('incorrect');
    feedback.textContent = 'Not quite. Give it another try.';
    feedback.classList.add('is-wrong');
  }
}

function completeLesson() {
  if (progress.completed.includes(activeLesson)) return;
  progress.completed.push(activeLesson);
  progress.xp += 50;
  progress.goalMinutes = Math.min(progress.goalMinutes + 5, 20);
  if (progress.lastStudyDate !== today) {
    progress.streak = progress.lastStudyDate === yesterday ? progress.streak + 1 : 1;
    progress.lastStudyDate = today;
  }
  saveProgress();
  renderProgress();
  dialog.close();
  showToast(`Lesson complete! 50 XP earned. Total: ${progress.xp} XP.`);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

document.querySelector('#check-answer').addEventListener('click', checkAnswer);
document.querySelector('#complete-lesson').addEventListener('click', completeLesson);
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});

document.querySelector('.eyebrow').textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
const hour = new Date().getHours();
document.querySelector('#welcome-title').innerHTML = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, Jamie <span aria-hidden="true">✳</span>`;
renderProgress();
