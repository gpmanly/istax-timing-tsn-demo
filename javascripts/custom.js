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

// Native selection must remain enabled for reliable browser copy/paste.  The
// prompt is useful on screen but should not be included in a command pasted
// into a terminal, so remove it from manually selected console text here.
document.addEventListener("copy", function (event) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const anchor = selection.anchorNode?.parentElement;
  const code = anchor?.closest(".language-console, .language-generic");
  if (!code) return;

  const text = selection
    .toString()
    .replace(/^[ \t]*(?:\([^\r\n)]*\)|\$|#)[ \t]*#?[ \t]*/gm, "")
    .trim();

  event.preventDefault();
  event.clipboardData?.setData("text/plain", text);
});
