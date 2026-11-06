// Check-your-understanding questions with instant feedback.
//
// Markup: <section data-quiz> holding a <script type="application/json">
// with an array of { q, options: [...], answer: <index>, explain }.
// Questions may contain simple HTML (sub/sup, em).

import { quizScore, saveQuizScore } from "./store.js";

export function mountQuiz(host, slug) {
  const data = JSON.parse(host.querySelector('script[type="application/json"]').textContent);
  host.classList.add("quiz");

  const best = quizScore(slug);
  host.insertAdjacentHTML(
    "beforeend",
    `<div class="quiz__head">
       <h2 class="quiz__title">Check your understanding</h2>
       <p class="quiz__score" aria-live="polite"></p>
     </div>
     <div class="quiz__items"></div>
     <button class="btn btn--quiet quiz__again" type="button" hidden>Try the questions again</button>`
  );

  const items = host.querySelector(".quiz__items");
  const score = host.querySelector(".quiz__score");
  const again = host.querySelector(".quiz__again");
  let answered = 0;
  let correct = 0;

  const showScore = () => {
    if (answered < data.length) {
      score.textContent = best ? `Best so far: ${best.correct} of ${best.total}` : `${data.length} questions`;
    } else {
      score.textContent = `You got ${correct} of ${data.length}`;
      saveQuizScore(slug, correct, data.length);
      again.hidden = false;
    }
  };

  function build() {
    items.innerHTML = "";
    answered = 0;
    correct = 0;
    again.hidden = true;
    data.forEach((item, qi) => {
      const fs = document.createElement("fieldset");
      fs.className = "question";
      const name = `${slug}-q${qi}`;
      fs.innerHTML = `
        <legend class="question__prompt"><span class="question__n">${qi + 1}.</span> ${item.q}</legend>
        <div class="question__options">
          ${item.options
            .map(
              (opt, oi) => `
            <label class="option">
              <input type="radio" name="${name}" value="${oi}">
              <span>${opt}</span>
            </label>`
            )
            .join("")}
        </div>
        <p class="question__feedback" aria-live="polite" hidden></p>`;
      items.append(fs);

      fs.addEventListener("change", (ev) => {
        const pick = Number(ev.target.value);
        const right = pick === item.answer;
        answered++;
        if (right) correct++;
        fs.querySelectorAll("input").forEach((inp) => (inp.disabled = true));
        fs.querySelectorAll(".option").forEach((lab, oi) => {
          if (oi === item.answer) lab.classList.add("option--right");
          else if (oi === pick) lab.classList.add("option--wrong");
        });
        const fb = fs.querySelector(".question__feedback");
        fb.hidden = false;
        fb.className = `question__feedback ${right ? "question__feedback--right" : "question__feedback--wrong"}`;
        fb.innerHTML = `<strong>${right ? "Right." : "Not quite."}</strong> ${item.explain}`;
        showScore();
      });
    });
    showScore();
  }

  again.addEventListener("click", () => {
    build();
    items.querySelector("input")?.focus();
  });
  build();
}
