import { createThinkingDots } from "@reuse-sh/loaders";

const exchanges = [
  [
    "Which frame suits Coral sky?",
    "A thin oak frame keeps the sand tones warm. Black would pull the blue forward and make the print feel cooler.",
  ],
  [
    "And for Blue hour?",
    "White or natural ash. The gold veins read best with a pale edge and a wide mount.",
  ],
  [
    "Can both hang side by side?",
    "Yes. Hang them at the same center height with a 6 cm gap, and keep the frames alike so the colors carry the pair.",
  ],
];
const form = document.querySelector(".re-chat-compose");
const input = form.querySelector("input");
const button = form.querySelector("button");
const messages = document.querySelector(".re-chat-messages");
let count = 1;
let timer;
let loader;
button.disabled = false;
function send(event) {
  event.preventDefault();
  if (button.disabled) return;
  const [question, answer] = exchanges[count % exchanges.length];
  count++;
  const turn = document.createElement("div");
  turn.className = "re-chat-turn";
  const prompt = document.createElement("p");
  prompt.className = "re-chat-question";
  prompt.textContent = question;
  const reply = document.createElement("div");
  reply.className = "re-chat-answer";
  reply.setAttribute("aria-busy", "true");
  const status = document.createElement("span");
  status.className = "re-thinking-dots";
  status.setAttribute("role", "status");
  status.setAttribute("aria-label", "Writing a reply");
  const canvas = document.createElement("canvas");
  status.append(canvas);
  reply.append(status);
  turn.append(prompt, reply);
  messages.append(turn);
  while (messages.children.length > 2) messages.firstElementChild.remove();
  loader = createThinkingDots(canvas, {
    size: 22,
  });
  button.disabled = true;
  input.value = exchanges[count % exchanges.length][0];
  timer = setTimeout(() => {
    loader.destroy();
    loader = undefined;
    reply.textContent = answer;
    reply.setAttribute("aria-busy", "false");
    button.disabled = false;
  }, 2400);
}
form.addEventListener("submit", send);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  clearTimeout(timer);
  loader?.destroy();
  form.removeEventListener("submit", send);
  window.removeEventListener("pagehide", cleanup);
});
