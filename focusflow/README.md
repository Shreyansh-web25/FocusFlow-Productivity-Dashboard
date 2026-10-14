# FocusFlow ✦

FocusFlow is a responsive productivity dashboard that helps you manage tasks and build focused work habits. It is built with vanilla HTML, CSS, and JavaScript.

## Features
- Add, complete, and delete tasks
- Task priority labels (high, medium, low)
- Filter tasks by all, active, and completed
- Today, all tasks, and completed task views
- Pomodoro-style focus timer with short and long breaks
- Focus session counter
- Daily completion progress
- Light and dark themes
- Rotating motivational quotes
- Saves tasks, theme, and session count in browser `localStorage`
- Responsive layout for desktop, tablet, and mobile

## Run locally
1. Download or clone this repository.
2. Open `index.html` in your browser.

No build step or package installation is required.

## Deploy to GitHub Pages
1. Create a new GitHub repository.
2. Upload `index.html`, `style.css`, `script.js`, and this README.
3. Open the repository's **Settings → Pages**.
4. Under Build and deployment, select **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)` folder, then save.
6. Wait for GitHub Pages to publish your site.

## Project structure
```text
focusflow/
├── index.html
├── style.css
├── script.js
├── README.md
└── .gitignore
```

## Data and privacy
Tasks and preferences are stored in this browser on the current device using `localStorage`. There is no server or account system in this version. Clearing browser site data will remove locally stored tasks.

## Built with
- HTML5
- CSS3
- Vanilla JavaScript
- Browser localStorage API
