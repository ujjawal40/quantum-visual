// Experiments for lesson 6.4. The simulation announces what happens with
// document events (watched, halflife, runcomplete); this file turns those
// into finished tasks.

import { createTasks } from "../../assets/js/ui/lesson.js";

const lab = createTasks(document.querySelector("[data-tasks]"), "half-life", [
  {
    id: "watch",
    title: "Watch one nucleus decay",
    detail: "Click a bright square, press Play, and wait for it to flash.",
  },
  {
    id: "half",
    title: "Run a big sample for one half-life",
    detail: "Use 1,000 or 10,000 nuclei of a known isotope and step or play to 1 T½. How many are left?",
  },
  {
    id: "noise",
    title: "Compare 100 nuclei with 10,000",
    detail: "Run each for three half-lives. Which one follows the dashed prediction more closely?",
  },
  {
    id: "three",
    kind: "measure",
    title: "What fraction is left after three half-lives?",
    detail: "Predict it first, then check in the simulation.",
    answer: 12.5,
    tolerance: 0.5,
    unit: "%",
    explain: "12.5%: halve three times, ½ × ½ × ½ = ⅛.",
  },
  {
    id: "carbon",
    kind: "measure",
    title: "Date a bone",
    detail: "A bone has 25% of its carbon-14 left. How old is it? (Carbon-14's half-life is 5,730 years.)",
    answer: 11460,
    tolerance: 100,
    unit: "years",
    explain: "11,460 years: 25% is two halvings, so two half-lives of 5,730 years.",
  },
  {
    id: "mystery",
    kind: "measure",
    title: "Find the half-life of Mystery isotope X",
    detail: "Choose it in the isotope menu and run 10,000 nuclei. Read the time when half are left, from the graph or by pausing when the fraction reaches 50%.",
    answer: 4.5,
    tolerance: 0.5,
    unit: "hours",
    explain: "4.5 hours. Reading where the curve crosses 5,000 works; so does where it crosses 2,500 (then halve the time).",
  },
]);

document.addEventListener("watched", ({ detail: { lived } }) => {
  lab.complete("watch", `It lasted ${lived.toFixed(2)} half-lives. Nothing could have told you that in advance.`);
});

document.addEventListener("halflife", ({ detail: { k, left, n0, isotope } }) => {
  if (k === 1 && n0 >= 1000 && !isotope.hidden) {
    const pct = ((100 * left) / n0).toFixed(1);
    lab.complete("half", `${left.toLocaleString("en-US")} of ${n0.toLocaleString("en-US")} left (${pct}%): close to half, but not exactly.`);
  }
});

const deviation = {};
document.addEventListener("runcomplete", ({ detail: { n0, deviation: dev } }) => {
  if (n0 === 100 || n0 === 10000) deviation[n0] = dev;
  if (deviation[100] !== undefined && deviation[10000] !== undefined) {
    lab.complete(
      "noise",
      `100 nuclei strayed up to ${(100 * deviation[100]).toFixed(1)}% from the prediction; 10,000 only ${(100 * deviation[10000]).toFixed(1)}%. Bigger samples are more predictable.`
    );
  }
});
