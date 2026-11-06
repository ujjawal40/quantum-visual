// Saves a student's progress in their own browser. Storage can be missing
// (private windows, blocked cookies), so every read and write is guarded and
// the site works the same without it — progress just isn't remembered.

const KEY = "quantum-visual:v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable: keep going without saving */
  }
}

/** IDs of finished experiments for one lesson. */
export function doneTasks(slug) {
  return new Set(load().tasks?.[slug] ?? []);
}

export function markTask(slug, taskId) {
  const data = load();
  data.tasks ??= {};
  const set = new Set(data.tasks[slug] ?? []);
  set.add(taskId);
  data.tasks[slug] = [...set];
  save(data);
}

export function resetLesson(slug) {
  const data = load();
  if (data.tasks) delete data.tasks[slug];
  if (data.quiz) delete data.quiz[slug];
  save(data);
}

export function quizScore(slug) {
  return load().quiz?.[slug] ?? null;
}

export function saveQuizScore(slug, correct, total) {
  const data = load();
  data.quiz ??= {};
  const prev = data.quiz[slug];
  if (!prev || correct >= prev.correct) data.quiz[slug] = { correct, total };
  save(data);
}

export function getTheme() {
  return load().theme ?? null;
}

export function setTheme(theme) {
  const data = load();
  data.theme = theme;
  save(data);
}
