import layer, { confirm, load, msg } from "../src";

const root = document.querySelector(".container");

if (root) {
  root.innerHTML = `
    <div class="box">
      <h1>layer-esm</h1>
      <p>Native ESM migration playground.</p>
      <button id="message-btn">Show message</button>
      <button id="confirm-btn">Show confirm</button>
      <button id="loading-btn">Show loading</button>
    </div>
  `;

  document.querySelector("#message-btn")?.addEventListener("click", () => {
    msg("Saved from the ESM demo.");
  });

  document.querySelector("#confirm-btn")?.addEventListener("click", () => {
    confirm("Continue with the migration demo?", {}, () => {
      msg("Confirmed.");
    });
  });

  document.querySelector("#loading-btn")?.addEventListener("click", () => {
    const index = load(1, {
      content: "Loading...",
      shadeClose: true,
    });

    window.setTimeout(() => {
      layer.close(index);
      msg("Loading finished.");
    }, 1200);
  });
}
