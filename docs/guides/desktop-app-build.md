# Building & Running the Desktop App

Welcome! This guide explains how to run the classroom rewards app as a native desktop application on your computer, how to build installers (for Windows, macOS, and Linux), and how the app stores your classroom data.

Whether you are a developer setting up the app or a teacher running it in your classroom, this guide has everything you need.

---

## 1. How to Run the App Locally (Developer Mode)

If you want to test the app on your computer without installing anything permanently, you can run it in "Developer Mode". This launches the app inside a desktop window.

### Prerequisites
You will need **Node.js** installed on your computer. You can download and install it from [nodejs.org](https://nodejs.org/).

### Steps
1. **Open your Terminal or Command Prompt.**
2. **Navigate to the app folder:**
   ```bash
   cd /path/to/repo_rewards
   ```
3. **Install the dependencies:** (You only need to do this once)
   ```bash
   npm install
   ```
4. **Start the app:**
   ```bash
   npm start
   ```

The application window will pop up immediately. Any changes you make to the source files (like editing `src/students.js` to update your class roster) will be visible the next time you launch or reload the app!

---

## 2. How to Build Installers Locally (Per OS)

If you want to package the app into an installer file (like an `.exe` for Windows, a `.dmg` for Mac, or an `.AppImage` for Linux) on your local computer, you can use the packaging tool we have configured.

### Commands
Run the appropriate command in your terminal depending on what system you are building:

* **For Linux (AppImage):**
  ```bash
  npx electron-builder --linux
  ```
* **For Windows (.exe):**
  ```bash
  npx electron-builder --win
  ```
* **For macOS (.dmg):**
  ```bash
  npx electron-builder --mac
  ```

Alternatively, you can try to build for all platforms at once using our shortcut:
```bash
npm run dist
```

### ⚠️ Important Note on Local Builds
* **Mac & Windows Requirements:** Building installer files for macOS and Windows locally requires you to be running those specific operating systems. For example, you cannot build a macOS `.dmg` installer on a Windows computer, and building Windows installers on macOS can require complex helper tools.
* **The Solution:** If you don't have a Mac or Windows computer handy, don't worry! We have set up an automated system (detailed in the next section) that builds installers for all platforms perfectly and automatically.

---

## 3. Automated Cross-Platform Installers (GitHub Actions)

We have configured an automated build pipeline using **GitHub Actions**. This is the easiest and most reliable way to get real, working installers for Windows, macOS, and Linux without having to set up build environments on multiple native machines.

Whenever you want to release a new version of the desktop app, you simply push a version tag to GitHub.

### How to release a new version:
1. **Prepare your changes** (e.g., updating the default roster or styling) and commit them to git:
   ```bash
   git add .
   git commit -m "Prepare version 1.0.0"
   git push origin main
   ```
2. **Create and push a version tag** (always start with a `v` followed by the version number, like `v1.0.0`):
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

### What happens next?
* Pushing the `v*` tag triggers our automated build workflow on GitHub.
* The system spins up Windows, macOS, and Linux virtual machines in the cloud to build the corresponding installers:
  * **Windows:** `.exe` installer (via NSIS)
  * **macOS:** `.dmg` installer
  * **Linux:** `.AppImage` package
* Once the build finishes, the workflow **automatically creates a new Release** on your GitHub repository page and attaches these three installers as download links!
* You and other teachers can simply go to the **Releases** tab on GitHub and download the correct installer for your classroom computer.

---

## 4. Reassurance: Where does your Classroom Data live?

As a teacher, your classroom rosters and points are incredibly important. You might be wondering: *If I run this as a desktop app, where is my data stored? Will I lose my points if I update the app?*

Here is the reassuring news: **Nothing changes about how your classroom data is stored.**

* **Isolated Local Storage:** The desktop app is powered by Electron, which runs an isolated browser window (Chromium) on your computer. All classroom rosters, daily points, history, and settings are saved directly in this window's browser-standard `localStorage`.
* **Safe from Updates:** Just like your web browser remembers your website logins even when you close the browser or restart your computer, the desktop app remembers all your classroom data. Upgrading or updating the app to a newer version will **not** wipe out your students' points, because the local storage persists safely on your computer.
* **No Server/No Internet Needed:** Since the data is kept locally on your physical device, the app works 100% offline. No classroom data is sent to external servers or the cloud, keeping student names and points private and secure.
* **Pro-Tip (Backups):** To be absolutely safe or to move your roster to a different teacher's device, you can use the **Settings → Export data** feature inside the app to save a backup file, which can then be imported on any other machine!

---

Happy teaching! ⭐️ If you run into any issues during setup, contact your school's technical coordinator or open an issue on our GitHub repository.
