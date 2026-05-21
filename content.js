// Injects a "save to mymind" button beside the share button on each tweet.
// If the user isn't signed into mymind, a "Log in" button is shown instead.

const MARKER = "mymind-btn";

// null = unknown (login check not yet returned), true/false once known.
let loggedIn = null;

// True once the extension has been reloaded/removed under this page.
// When that happens every chrome.* call throws "Extension context invalidated".
let contextDead = false;

// chrome.runtime.id becomes undefined once the context is invalidated.
function isAlive() {
  if (contextDead) return false;
  try {
    if (chrome.runtime && chrome.runtime.id) return true;
  } catch (e) {
    /* fall through */
  }
  contextDead = true;
  shutdown();
  return false;
}

// Stop observing and drop our UI — the old script can't talk to the extension.
function shutdown() {
  try {
    observer && observer.disconnect();
  } catch (e) {
    /* ignore */
  }
  document.querySelectorAll("." + MARKER).forEach((el) => el.remove());
}

// --- Status pill ----------------------------------------------------------

let pillEl = null;
let pillTimer = null;

// type: "loading" stays until replaced; "saved" / "error" auto-hide after 1s.
function showPill(text, type) {
  if (!pillEl) {
    pillEl = document.createElement("div");
    pillEl.className = "mymind-pill";
    document.body.appendChild(pillEl);
  }

  clearTimeout(pillTimer);
  pillEl.textContent = text;
  pillEl.classList.toggle("is-error", type === "error");
  void pillEl.offsetWidth; // force reflow so the transition replays
  pillEl.classList.add("is-visible");

  if (type !== "loading") {
    pillTimer = setTimeout(() => {
      pillEl.classList.remove("is-visible");
    }, 1000);
  }
}

// --- Buttons --------------------------------------------------------------

function createSaveButton() {
  const btn = document.createElement("div");
  btn.className = MARKER + " mymind-save";
  btn.setAttribute("role", "button");
  btn.setAttribute("aria-label", "Add to my mind");
  btn.title = "Add to my mind";

  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("icons/mymind-icon.png");
  img.alt = "mymind";
  btn.appendChild(img);

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSave(btn);
  });

  return btn;
}

// --- Save flow ------------------------------------------------------------

// Resolve the permalink URL of the tweet that owns this button.
function findTweetUrl(group) {
  const article =
    group.closest('article[data-testid="tweet"]') || group.closest("article");
  if (!article) return null;

  // The timestamp link is the tweet's permalink.
  const timeLink = article.querySelector("a:has(time)");
  const link = timeLink || article.querySelector('a[href*="/status/"]');
  if (!link) return null;

  const href = link.getAttribute("href") || "";
  if (/^https?:\/\//.test(href)) return href;
  return "https://x.com" + href;
}

function setLoading(btn, loading) {
  btn.classList.toggle("is-loading", loading);
}

function handleSave(btn) {
  if (btn.classList.contains("is-loading")) return;

  const group = btn.closest('[role="group"]');
  const url = group && findTweetUrl(group);
  if (!url) {
    showPill("Couldn't find tweet", "error");
    return;
  }

  if (!isAlive()) {
    showPill("Reload the X tab", "error");
    return;
  }

  setLoading(btn, true);
  showPill("Saving…", "loading");

  chrome.runtime.sendMessage({ action: "saveToMymind", url }, (resp) => {
    setLoading(btn, false);

    if (chrome.runtime.lastError || !resp) {
      showPill("Error", "error");
      return;
    }
    if (resp.ok) {
      showPill(resp.already ? "Already saved" : "Saved", "saved");
    } else if (resp.error === "not-signed-in") {
      // Session expired since the last check — swap to the login button.
      loggedIn = false;
      refreshButtons();
      showPill("Sign in to mymind", "error");
    } else {
      showPill("Error", "error");
    }
  });
}

// --- Injection ------------------------------------------------------------

function injectIntoGroup(group) {
  if (!loggedIn) return; // only inject once the user is signed into mymind
  if (!isAlive()) return;
  if (group.querySelector("." + MARKER)) return; // already injected

  // The share button is the action item with a "Share" aria-label.
  const shareBtn = group.querySelector('[aria-label*="Share" i]');
  if (!shareBtn) return;

  // Walk up to the action-item wrapper that is a direct child of the group.
  let wrapper = shareBtn;
  while (wrapper.parentElement && wrapper.parentElement !== group) {
    wrapper = wrapper.parentElement;
  }

  group.insertBefore(createSaveButton(), wrapper.nextSibling);
}

function scan() {
  if (!isAlive()) return;
  document
    .querySelectorAll('[role="group"]')
    .forEach((group) => injectIntoGroup(group));
}

// Remove every injected button and re-inject for the current login state.
function refreshButtons() {
  document.querySelectorAll("." + MARKER).forEach((el) => el.remove());
  scan();
}

// --- Login state ----------------------------------------------------------

function checkLogin() {
  if (!isAlive()) return;
  try {
    chrome.runtime.sendMessage({ action: "checkLogin" }, (resp) => {
      if (chrome.runtime.lastError || !resp) return;
      if (resp.loggedIn !== loggedIn) {
        loggedIn = resp.loggedIn;
        refreshButtons();
      }
    });
  } catch (e) {
    isAlive(); // marks the context dead and shuts down
  }
}

// Re-check when the tab regains focus (e.g. after signing in elsewhere).
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkLogin();
});

// --- Start ----------------------------------------------------------------

const observer = new MutationObserver(() => scan());
observer.observe(document.body, { childList: true, subtree: true });
checkLogin();
