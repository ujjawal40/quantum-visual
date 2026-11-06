// Experiments: the "try this" checklist beside each simulation.
//
// Two kinds of task:
//   observe  – the simulation calls lab.complete(id) when the student does it
//   measure  – the student types a value they found; it is checked against
//              `answer` within `tolerance`
//
// Usage:
//   const lab = createTasks(document.querySelector("[data-tasks]"), "bohr-spectra", [
//     { id: "red", title: "Make hydrogen glow red", detail: "..." },
//     { id: "speed", kind: "measure", title: "...", answer: 2.19, tolerance: 0.05, unit: "×10⁶ m/s",
//       explain: "shown after a correct answer" },
//   ]);
//   lab.complete("red", "656 nm, from 3 → 2");

import { doneTasks, markTask, resetLesson } from "./store.js";

export function createTasks(host, slug, tasks) {
  const done = doneTasks(slug);
  const notes = {};
  const listeners = [];

  host.classList.add("tasks");
  host.innerHTML = `
    <div class="tasks__head">
      <h2 class="tasks__title">Experiments</h2>
      <p class="tasks__count" aria-live="polite"></p>
    </div>
    <ol class="tasks__list"></ol>
    <p class="tasks__finished" hidden>All experiments done. Try the questions in the lesson to check your understanding.</p>
    <button class="tasks__reset" type="button">Start experiments again</button>`;

  const list = host.querySelector(".tasks__list");
  const count = host.querySelector(".tasks__count");
  const finished = host.querySelector(".tasks__finished");

  for (const t of tasks) {
    const li = document.createElement("li");
    li.className = "task";
    li.dataset.id = t.id;
    li.innerHTML = `
      <span class="task__mark" aria-hidden="true"></span>
      <div class="task__body">
        <p class="task__title">${t.title}</p>
        ${t.detail ? `<p class="task__detail">${t.detail}</p>` : ""}
        ${t.kind === "measure" ? measureForm(t) : ""}
        <p class="task__note" hidden></p>
      </div>`;
    list.append(li);

    if (t.kind === "measure") {
      const form = li.querySelector("form");
      const msg = li.querySelector(".task__feedback");
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const raw = form.elements.value.value.trim().replace(",", ".");
        const v = Number(raw);
        if (raw === "" || Number.isNaN(v)) {
          msg.textContent = "Enter a number, for example 2.5.";
          msg.className = "task__feedback task__feedback--warn";
          return;
        }
        if (Math.abs(v - t.answer) <= t.tolerance) {
          complete(t.id, t.explain ?? `Correct: ${t.answer} ${t.unit ?? ""}`);
        } else {
          msg.textContent = v < t.answer ? "Too low. Check your reading and try again." : "Too high. Check your reading and try again.";
          msg.className = "task__feedback task__feedback--warn";
        }
      });
    }
  }

  function measureForm(t) {
    return `
      <form class="task__form" novalidate>
        <label class="sr-only" for="task-${t.id}">Your answer${t.unit ? ` in ${t.unit}` : ""}</label>
        <input id="task-${t.id}" name="value" inputmode="decimal" autocomplete="off" placeholder="Your value">
        ${t.unit ? `<span class="task__unit">${t.unit}</span>` : ""}
        <button class="btn btn--quiet" type="submit">Check</button>
      </form>
      <p class="task__feedback" aria-live="polite"></p>`;
  }

  function render() {
    let n = 0;
    for (const li of list.children) {
      const id = li.dataset.id;
      const isDone = done.has(id);
      if (isDone) n++;
      li.classList.toggle("task--done", isDone);
      const note = li.querySelector(".task__note");
      const text = notes[id] ?? (isDone ? "Done earlier." : "");
      note.hidden = !isDone || !text;
      note.textContent = text;
      const form = li.querySelector("form");
      if (form) {
        form.hidden = isDone;
        li.querySelector(".task__feedback").textContent = "";
      }
    }
    count.textContent = `${n} of ${tasks.length} done`;
    finished.hidden = n < tasks.length;
  }

  function complete(id, note) {
    if (!tasks.some((t) => t.id === id)) return;
    const fresh = !done.has(id);
    done.add(id);
    if (note) notes[id] = note;
    markTask(slug, id);
    render();
    if (fresh) {
      const li = list.querySelector(`[data-id="${id}"]`);
      li?.classList.add("task--just-done");
      setTimeout(() => li?.classList.remove("task--just-done"), 1200);
      listeners.forEach((fn) => fn(id));
    }
  }

  host.querySelector(".tasks__reset").addEventListener("click", () => {
    resetLesson(slug);
    done.clear();
    for (const k of Object.keys(notes)) delete notes[k];
    render();
  });

  render();

  return {
    complete,
    isDone: (id) => done.has(id),
    onComplete: (fn) => listeners.push(fn),
  };
}
