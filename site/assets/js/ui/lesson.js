// Boots a lesson page: page chrome, the quiz, and links to the Python lab.
// Each lesson's own sim.js imports createTasks and builds the simulation.

import "./chrome.js";
import { mountQuiz } from "./quiz.js";
import { REPO } from "../course.js";

export { createTasks } from "./tasks.js";

const slug = document.body.dataset.lesson;

const quiz = document.querySelector("[data-quiz]");
if (quiz) mountQuiz(quiz, slug);

// <a data-colab="labs/03-bohr/balmer_lines.ipynb"> opens the notebook in Google Colab;
// <a data-repo="labs/..."> opens the file on GitHub.
for (const a of document.querySelectorAll("[data-colab]")) {
  a.href = `https://colab.research.google.com/github/${REPO.replace("https://github.com/", "")}/blob/main/${a.dataset.colab}`;
  a.target = "_blank";
  a.rel = "noopener";
}
for (const a of document.querySelectorAll("[data-repo]")) {
  a.href = `${REPO}/blob/main/${a.dataset.repo}`;
}
