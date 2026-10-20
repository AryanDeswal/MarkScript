# MarkScript

A collaborative Markdown editor: write in a shared Quill editor that syncs in real time over Socket.IO, then convert your Markdown to HTML.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Quill](https://img.shields.io/badge/Quill-1.3-1D1D1D)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## About

MarkScript has three parts. A React + Quill editor in `client/` lets several people edit the same document at once. A Socket.IO server in `server/` relays edits between them and saves each document to MongoDB. An Express + EJS web app in `main/` handles accounts and keeps a list of your documents, and it can turn a document's Markdown into HTML with [Showdown](https://github.com/showdownjs/showdown).

## Features

- **Real-time collaboration.** Every document has a UUID URL (`/documents/<id>`). Clients that open the same URL join a Socket.IO room. Each Quill change (delta) is broadcast to the other clients in that room as soon as it happens.
- **Autosave.** The editor sends its contents to the server every 2 seconds, and the server stores them in MongoDB. A new document is created the first time its ID is opened.
- **Rich-text toolbar.** Quill "snow" theme with headings, fonts, lists, bold/italic/underline, text and background colour, sub/superscript, alignment, images, blockquotes and code blocks.
- **User accounts.** Register, log in and log out in the `main/` app. Passwords are hashed with bcrypt and sessions use `express-session`, with flash messages for feedback.
- **My Documents.** Logged-in users save a name and editor link for each document, open it to edit, or remove it from their list.
- **Markdown to HTML.** "Generate" reads the document's text from MongoDB and converts it with Showdown (tables, strikethrough, emoji, full HTML document). The page shows the HTML source with a "Copy HTML" button.

## Tech Stack

| Part | Technologies |
| --- | --- |
| Editor (`client/`) | React 18, Quill 1.3, socket.io-client, React Router 5, uuid (Create React App) |
| Collaboration server (`server/`) | Node.js, Socket.IO 4, Mongoose 5 |
| Web app (`main/`) | Express 4, EJS + ejs-mate, express-session, connect-flash, bcrypt, Showdown, Mongoose 7, Bootstrap |
| Database | MongoDB (`markScriptDB`) |

## Project Structure

```
MarkScript/
├── client/                 # React editor (port 3000)
│   └── src/
│       ├── App.js          # Redirects "/" to a new /documents/<uuid>
│       └── TextEditor.js   # Quill editor + Socket.IO sync and autosave
├── server/                 # Socket.IO collaboration server (port 3001)
│   ├── server.js           # Rooms, change broadcast, document load/save
│   └── Document.js         # Document model
├── main/                   # Express + EJS web app (port 3100)
│   ├── app.js              # Routes: home, register, login, my-docs, generate, delete, logout
│   ├── middlewares.js      # isLoggedIn guard, document text lookup
│   ├── models/             # User and Document models
│   ├── views/              # EJS templates
│   └── public/             # Static assets (CSS, JS, Bootstrap vendor files)
└── LICENSE
```

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB running locally on `mongodb://127.0.0.1:27017`. Both servers connect to the `markScriptDB` database; the URI is hard-coded in `server/server.js` and `main/app.js`.

### Installation

```bash
git clone https://github.com/AryanDeswal/MarkScript.git
cd MarkScript

cd server && npm install && cd ..
cd client && npm install && cd ..
cd main && npm install && cd ..
```

### Running

Start each part in its own terminal:

```bash
# 1. Collaboration server -> ws://localhost:3001
cd server && npm start

# 2. Editor -> http://localhost:3000
cd client && npm start

# 3. Web app -> http://localhost:3100
cd main && npm start
```

There are no environment variables. Ports, the MongoDB URI, the allowed CORS origin (`http://localhost:3000`) and the session secret are all hard-coded.

## Usage

1. Open `http://localhost:3100`, register, and log in.
2. On **My Documents**, click **Create New Document**. The editor opens at `http://localhost:3000/documents/<uuid>`.
3. Share that URL with others to edit the document together in real time.
4. Back on **My Documents**, add the document's name and its full editor URL as the link.
5. Click **Generate** to convert the document's Markdown to HTML, then **Copy HTML**.

## Routes (`main/`)

| Method | Route | Description |
| --- | --- | --- |
| GET | `/` | Home page |
| GET / POST | `/register` | Registration form / create account and start a session |
| GET / POST | `/login` | Login form / authenticate |
| GET | `/my-docs` | List the logged-in user's documents (login required) |
| POST | `/my-docs` | Add a document `{ name, link }` to the user's list (login required) |
| POST | `/generate/:id` | Convert the document's Markdown to HTML and show it (login required) |
| POST | `/delete/:id` | Remove a document from the user's list (login required) |
| GET | `/logout` | End the session |

### Socket.IO events (`server/`)

| Event | Direction | Description |
| --- | --- | --- |
| `get-document` | client to server | Join the room for a document ID; creates the document if it does not exist |
| `load-document` | server to client | Initial document contents (Quill delta) |
| `send-changes` | client to server | A local edit (delta) |
| `receive-changes` | server to clients | An edit from another collaborator in the same room |
| `save-document` | client to server | Save the full contents (sent every 2 seconds) |

## License

Released under the [MIT License](LICENSE).
