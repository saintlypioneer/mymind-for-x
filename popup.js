const statusEl = document.getElementById("status");
const loginBtn = document.getElementById("login");
const dotEl = document.getElementById("dot");

function render(loggedIn) {
  if (loggedIn) {
    statusEl.textContent = "Connected. Save buttons are active on X.";
    dotEl.classList.add("connected");
    loginBtn.classList.add("hidden");
  } else {
    statusEl.textContent = "Log in to mymind to start saving tweets.";
    dotEl.classList.remove("connected");
    loginBtn.classList.remove("hidden");
  }
}

function checkLogin() {
  chrome.runtime.sendMessage({ action: "checkLogin" }, (resp) => {
    if (chrome.runtime.lastError || !resp) {
      statusEl.textContent = "Couldn't reach the extension. Try reopening.";
      return;
    }
    render(resp.loggedIn);
  });
}

loginBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "openSignin" });
  window.close();
});

checkLogin();
