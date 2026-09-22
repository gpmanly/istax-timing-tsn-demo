// docs/javascripts/custom.js
document.addEventListener(
  "click",
  function (event) {
    const button = event.target.closest(
      '.md-clipboard, .md-code__button[data-md-type="copy"]'
    );
    if (!button) return;

    let code = null;
    const target = button.getAttribute("data-clipboard-target");
    if (target) code = document.querySelector(target);
    if (!code) code = button.closest(".highlight, pre")?.querySelector("code");
    if (!code) return;

    const clone = code.cloneNode(true);
    clone
      .querySelectorAll(
        ".gp, .gp-VirtualEnv, .go, .gt, .linenos, [data-linenos], a[id^='__codelineno']"
      )
      .forEach((el) => el.remove());

    // Material's own handler will copy this and show its popup and checkmark
    button.setAttribute("data-clipboard-text", clone.textContent.trim());
  },
  true // capture phase: runs before Material's handler
);
