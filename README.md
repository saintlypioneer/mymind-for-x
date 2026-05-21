# mymind for X

A small Chrome extension that adds a one-click **"Save to mymind"** button next to
the share button on every tweet — so you can stash tweets into your
[mymind](https://mymind.com) without leaving X.

![Save button on a tweet](icons/icon-128.png)

---

## Install (takes 1 minute)

This extension isn't on the Chrome Web Store — you install it manually. It's easy:

1. **Download it.** Get the latest `mymind-for-x.zip` from the
   [Releases](../../releases) page (or download this repo as a ZIP via the green
   **Code** button → **Download ZIP**).
2. **Unzip it.** You'll get a folder — remember where it is.
3. Open Chrome and go to **`chrome://extensions`** (type it in the address bar).
4. Turn on **Developer mode** — the toggle in the **top-right** corner.
5. Click **Load unpacked** (top-left) and select the **unzipped folder**.
6. Done — you'll see "mymind for X" in your extensions list.

> 💡 Pin it: click the puzzle-piece icon in Chrome's toolbar and pin "mymind for X"
> so you can see its status easily.

## How to use it

1. Click the extension icon in the toolbar. If you're not signed into mymind,
   click **Log in to mymind** and sign in.
2. Go to [x.com](https://x.com) (refresh the tab if it was already open).
3. On any tweet, click the small **orange circle** next to the share button.
4. A pill at the bottom of the screen confirms **"Saved"** — the tweet is now in
   your mind.

## How it works

- The extension checks whether you're signed into mymind by looking for mymind's
  login cookie (`_jwt`) on `access.mymind.com`.
- When you click save, it sends the tweet's URL to mymind's save endpoint
  (`https://access.mymind.com/objects`) — the same call the official mymind
  extension makes.
- Nothing is sent anywhere else. There is no analytics, no server, no tracking.

## Privacy

- The extension reads **one cookie** (`_jwt`) from `access.mymind.com`, only to
  authenticate your save request to mymind. It is never stored or sent elsewhere.
- It runs only on `x.com` / `twitter.com` and `access.mymind.com`.
- All code is in this repo — read it yourself.

## ⚠️ Disclaimer

This is an **unofficial** project and is **not affiliated with mymind, Inc.** It
works by replicating mymind's private extension API, which could change or break
at any time. Use it at your own risk. The mymind name and artwork belong to
mymind, Inc.

## Development

Plain JavaScript, no build step. Edit the files and click the refresh icon on
`chrome://extensions`, then refresh your X tab.

| File            | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `manifest.json` | Extension config (Manifest V3)                       |
| `background.js` | Service worker — checks login, calls the save API    |
| `content.js`    | Injects the save button into tweets                  |
| `content.css`   | Styles for the button and status pill                |
| `popup.html/js` | Toolbar popup with the login state                   |

## Releasing a new version

1. Bump `version` in `manifest.json` (e.g. `1.0.0` → `1.0.1`).
2. Commit and push the change.
3. Build the ZIP and cut a GitHub release:

   ```sh
   ./build.sh
   gh release create v1.0.1 mymind-for-x.zip \
     --title "v1.0.1" \
     --notes "What changed in this release."
   ```

The attached ZIP is what users download from the [Releases](../../releases) page.

## License

[MIT](LICENSE)
