# PDF Assist — AI-Powered PDF Assistant

A modern, fast, in-browser web application for working with PDFs: upload, view, chat with AI, generate summaries, annotate, merge, split, and extract text.

## 🚀 Features
- **Upload & Interactive Viewer**: Drag-and-drop or file selection with page navigation, zoom controls, and fullscreen view.
- **AI Chat**: Conversational AI assistant contextually aware of uploaded documents.
- **Intelligent Summarization**: Multi-format summaries (paragraph, bullet points, structured) across short, medium, and detailed lengths.
- **Live Annotations**: Direct canvas annotations (highlight, underline, sticky notes, eraser) with custom color palette.
- **PDF Tools**: In-browser tools for merging multiple documents, splitting pages, and raw text extraction.
- **Premium Dark UI**: Neon purple/blue gradient aesthetic with smooth animations and responsive mobile/desktop layouts.

## 📂 Project Structure
```
d:/pdf assist/
├── index.html               # Main application entry point
├── README.md                # Documentation & guide
├── assets/
│   └── icons/
│       ├── favicon.svg      # App favicon
│       └── logo.svg         # Glowing AI PDF vector logo
├── css/
│   ├── variables.css        # Design tokens, color palette, gradients, typography
│   ├── reset.css            # Standardized CSS reset and box-sizing
│   ├── base.css             # Base styles, global typography, utilities
│   ├── layout.css           # Grid/flex app shell, sidebar, and page layouts
│   ├── components.css       # Buttons, cards, dropzones, chat bubbles, toasts
│   ├── animations.css       # Keyframes, transitions, shimmer skeletons
│   └── responsive.css       # Mobile and tablet breakpoints
└── js/
    ├── utils.js             # Notification toasts, formatting, and DOM helpers
    ├── store.js             # Central reactive state manager
    ├── router.js            # Client-side multi-page routing
    ├── pdf-loader.js        # File upload parser and progress handler
    ├── viewer.js            # Canvas-based PDF renderer and controls
    ├── chat.js              # AI chat system with document context
    ├── summarize.js         # Document summarization engine
    ├── annotate.js          # Direct canvas annotation tools
    ├── tools.js             # Merge, Split, and Text Extraction workflows
    └── app.js               # Application bootstrap and global events
```

## 🛠️ How to Run
Simply open [index.html](file:///d:/pdf%20assist/index.html) in any modern web browser or serve via any static web server (e.g. `npx serve .` or VS Code Live Server).
