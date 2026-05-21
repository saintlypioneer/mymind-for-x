// Saves a URL to mymind by replicating the mymind extension's API call.
// Auth: the `_jwt` cookie on access.mymind.com is used directly as a bearer token.

const MYMIND_HOST = "access.mymind.com";

async function getJwt() {
  const cookie = await chrome.cookies.get({
    name: "_jwt",
    url: `https://${MYMIND_HOST}`,
  });
  return cookie ? cookie.value : null;
}

async function saveToMymind(url) {
  const token = await getJwt();
  if (!token) return { ok: false, error: "not-signed-in" };

  let res;
  try {
    res = await fetch(`https://${MYMIND_HOST}/objects`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-extension-version": chrome.runtime.getManifest().version,
      },
      body: JSON.stringify({ type: "WebPage", url }),
    });
  } catch (e) {
    return { ok: false, error: "network" };
  }

  if (res.status === 201) return { ok: true, already: false };
  if (res.status === 200) return { ok: true, already: true };
  if (res.status === 401) return { ok: false, error: "not-signed-in" };
  return { ok: false, error: `http-${res.status}` };
}

async function isLoggedIn() {
  return !!(await getJwt());
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  if (msg.action === "saveToMymind") {
    saveToMymind(msg.url)
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // keep the message channel open for the async response
  }

  if (msg.action === "checkLogin") {
    isLoggedIn()
      .then((loggedIn) => sendResponse({ loggedIn }))
      .catch(() => sendResponse({ loggedIn: false }));
    return true;
  }

  if (msg.action === "openSignin") {
    chrome.tabs.create({ url: `https://${MYMIND_HOST}/signin` });
    sendResponse({ ok: true });
    return;
  }
});
