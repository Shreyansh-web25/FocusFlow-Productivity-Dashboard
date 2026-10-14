const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE_KEY = "focusflow.tasks.v1";
const SESSION_KEY = "focusflow.sessions.v1";
const THEME_KEY = "focusflow.theme.v1";

let tasks = loadTasks();
let currentView = "today";
let currentFilter = "all";
let sessionCount = Number(localStorage.getItem(SESSION_KEY) || 0);
let timerMode = "focus";
let timerDuration = 25 * 60;
let remainingSeconds = timerDuration;
let timerInterval = null;
let timerRunning = false;
let toastTimeout;

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function safeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

function todayTasks() {
  return tasks.filter(task => task.createdDay === todayKey());
}

function getVisibleTasks() {
  let list = currentView === "completed" ? tasks.filter(t => t.completed)
    : currentView === "today" ? todayTasks()
    : tasks;
  if (currentFilter === "active") list = list.filter(t => !t.completed);
  if (currentFilter === "completed") list = list.filter(t => t.completed);
  return [...list].sort((a,b) => Number(a.completed)-Number(b.completed) ||
    ({high:0,medium:1,low:2}[a.priority] - {high:0,medium:1,low:2}[b.priority]) ||
    b.createdAt-a.createdAt);
}

function renderTasks() {
  const list = getVisibleTasks();
  $("#taskList").innerHTML = list.map(task => `
    <article class="task-item ${task.completed ? "is-complete" : ""}" data-id="${task.id}">
      <button class="task-check" data-action="toggle" aria-label="${task.completed ? "Mark incomplete" : "Mark complete"}">${task.completed ? "✓" : ""}</button>
      <div class="task-main">
        <div class="task-title">${safeText(task.title)}</div>
        <div class="task-meta"><span class="priority priority-${task.priority}">${task.priority}</span><span class="task-date">${task.createdDay === todayKey() ? "Added today" : "Added " + new Date(task.createdAt).toLocaleDateString()}</span></div>
      </div>
      <button class="delete-task" data-action="delete" aria-label="Delete task" title="Delete task">×</button>
    </article>`).join("");
  $("#emptyState").classList.toggle("visible", list.length === 0);
  $("#taskList").style.display = list.length ? "grid" : "none";
  $("#taskCount").textContent = `${list.length} ${list.length === 1 ? "task" : "tasks"}`;
  updateStats();
}

function updateStats() {
  const today = todayTasks();
  const completed = today.filter(t => t.completed).length;
  const total = today.length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  $("#statTotal").textContent = total;
  $("#statCompleted").textContent = completed;
  $("#completionRate").textContent = `${percent}%`;
  $("#statSessions").textContent = sessionCount;
  $("#navTodayCount").textContent = today.filter(t => !t.completed).length;
  $("#miniProgress").style.width = `${percent}%`;
  $("#miniPercent").textContent = `${percent}%`;
}

function addTask(title, priority) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return;
  tasks.unshift({
    id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    title: cleanTitle,
    priority,
    completed: false,
    createdAt: Date.now(),
    createdDay: todayKey()
  });
  saveTasks();
  currentView = "today";
  currentFilter = "all";
  $$(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.view === currentView));
  $$(".filter-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.filter === currentFilter));
  $("#taskHeading").textContent = "Today's tasks";
  $("#taskEyebrow").textContent = "YOUR PRIORITIES";
  renderTasks();
  showToast("Task added. One step closer ✦");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2300);
}

$("#taskForm").addEventListener("submit", event => {
  event.preventDefault();
  addTask($("#taskInput").value, $("#taskPriority").value);
  $("#taskInput").value = "";
  $("#taskInput").focus();
});

$("#taskList").addEventListener("click", event => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const item = actionButton.closest("[data-id]");
  const task = tasks.find(t => t.id === item.dataset.id);
  if (!task) return;
  if (actionButton.dataset.action === "toggle") {
    task.completed = !task.completed;
    showToast(task.completed ? "Nice work! Task completed ✓" : "Task moved back to active");
  } else if (actionButton.dataset.action === "delete") {
    tasks = tasks.filter(t => t.id !== task.id);
    showToast("Task deleted");
  }
  saveTasks();
  renderTasks();
});

$("#clearCompleted").addEventListener("click", () => {
  const before = tasks.length;
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
  showToast(before === tasks.length ? "No completed tasks to clear" : "Completed tasks cleared");
});

$$(".nav-item").forEach(button => button.addEventListener("click", () => {
  currentView = button.dataset.view;
  $$(".nav-item").forEach(btn => btn.classList.toggle("active", btn === button));
  $("#taskHeading").textContent = currentView === "today" ? "Today's tasks" :
    currentView === "upcoming" ? "All tasks" : "Completed tasks";
  $("#taskEyebrow").textContent = currentView === "today" ? "YOUR PRIORITIES" :
    currentView === "upcoming" ? "YOUR WORKSPACE" : "LOOK HOW FAR YOU'VE COME";
  renderTasks();
}));

$$(".filter-tab").forEach(button => button.addEventListener("click", () => {
  currentFilter = button.dataset.filter;
  $$(".filter-tab").forEach(btn => btn.classList.toggle("active", btn === button));
  renderTasks();
}));

function openTaskInput() {
  $("#taskInput").focus();
  $("#taskInput").scrollIntoView({behavior:"smooth", block:"center"});
}
$("#newTaskTop").addEventListener("click", openTaskInput);
$("#emptyAdd").addEventListener("click", openTaskInput);

const quotes = [
  ["You don't have to see the whole staircase, just take the first step.", "MARTIN LUTHER KING JR."],
  ["It always seems impossible until it's done.", "NELSON MANDELA"],
  ["The secret of getting ahead is getting started.", "MARK TWAIN"],
  ["Great things are done by a series of small things brought together.", "VINCENT VAN GOGH"],
  ["Focus on being productive instead of busy.", "TIM FERRISS"],
  ["Success is the sum of small efforts, repeated day in and day out.", "ROBERT COLLIER"]
];
let quoteIndex = 0;
$("#newQuote").addEventListener("click", () => {
  quoteIndex = (quoteIndex + 1) % quotes.length;
  $("#quoteText").textContent = quotes[quoteIndex][0];
  $("#quoteAuthor").textContent = quotes[quoteIndex][1];
});

const circumference = 2 * Math.PI * 96;
$("#timerRing").style.strokeDasharray = circumference;
function renderTimer() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  $("#timerTime").textContent = `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
  const elapsedRatio = timerDuration ? 1 - remainingSeconds / timerDuration : 0;
  $("#timerRing").style.strokeDashoffset = circumference * elapsedRatio;
  $("#timerCaption").textContent = timerMode === "focus" ? "TIME TO FOCUS" :
    timerMode === "short" ? "TAKE A BREATHER" : "RESET & RECHARGE";
  $("#timerStart").innerHTML = timerRunning ? "Ⅱ Pause timer" : remainingSeconds === timerDuration ? "▶ Start focus" : "▶ Resume timer";
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  renderTimer();
}

function finishTimer() {
  stopTimer();
  if (timerMode === "focus") {
    sessionCount++;
    localStorage.setItem(SESSION_KEY, String(sessionCount));
    updateStats();
    showToast("Focus session complete. Take a well-earned break! ✦");
  } else {
    showToast("Break complete. Ready when you are!");
  }
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("FocusFlow", {body: timerMode === "focus" ? "Focus session complete. Time for a break!" : "Your break is over."});
  }
}

function startTimer() {
  if (timerRunning) {
    stopTimer();
    return;
  }
  if (remainingSeconds <= 0) remainingSeconds = timerDuration;
  timerRunning = true;
  renderTimer();
  timerInterval = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      renderTimer();
      finishTimer();
    } else renderTimer();
  }, 1000);
}

function selectTimerMode(button) {
  stopTimer();
  timerMode = button.dataset.mode;
  timerDuration = Number(button.dataset.minutes) * 60;
  remainingSeconds = timerDuration;
  $$(".timer-tab").forEach(btn => btn.classList.toggle("active", btn === button));
  renderTimer();
}

$$(".timer-tab").forEach(button => button.addEventListener("click", () => selectTimerMode(button)));
$("#timerStart").addEventListener("click", startTimer);
$("#timerReset").addEventListener("click", () => {
  stopTimer();
  remainingSeconds = timerDuration;
  renderTimer();
  showToast("Timer reset");
});

$("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  const theme = document.body.classList.contains("light") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, theme);
  $("#themeToggle").textContent = theme === "light" ? "☾" : "☼";
});
if (localStorage.getItem(THEME_KEY) === "light") {
  document.body.classList.add("light");
  $("#themeToggle").textContent = "☾";
}

function setGreeting() {
  const hour = new Date().getHours();
  $("#greeting").innerHTML = `${hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}<span class="accent-dot">.</span>`;
  $("#dateLabel").textContent = new Date().toLocaleDateString(undefined, {weekday:"long", month:"long", day:"numeric"}).toUpperCase();
}
setGreeting();
renderTasks();
renderTimer();
