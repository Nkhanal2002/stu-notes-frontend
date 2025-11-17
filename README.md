# StuNotes

**StuNotes** is a modern web application designed to make studying more effective and accessible for students. It helps organize lecture materials, transcribe audio, generate notes, and create AI-powered quizzes — all in one place.

---

## Introduction

Many students struggle to keep up with lectures, organize notes, and retain key concepts effectively. **StuNotes** tackles this challenge by combining **audio transcription**, **smart note-taking**, and **AI-powered quiz generation** into a single, intuitive platform.

With StuNotes, students can:

- Record or upload lecture audio.
- Automatically transcribe speech to text.
- Convert transcriptions into structured notes.
- Generate quizzes using AI to reinforce learning.
- Access and manage all study materials in one place.

---

## Tech Stack

### **Frontend**

- React.js — Modern UI framework
- Tailwind CSS — Utility-first styling
- shadcn/ui— Elegant, accessible UI components
- Speech Recognition Library — For live transcription and voice input

### **Backend**

- Node.js— Server-side JavaScript runtime
- MongoDB— NoSQL database for storing users and notes
- Nodemailer— Handles email sending and verification
- Gemini API 2.5 Flash — Powers AI-driven features like quiz generation, content summarization, and smart note enhancement

---

## Features

- **Speech-to-Text Transcription** — Convert lectures or audio input into text instantly.
- **Smart Note Organization** — Clean, structured notes with easy access.
- **AI-Powered Quiz Generation** — Automatically generate quizzes to reinforce understanding.
- **Email Verification** — Secure signup/login using email validation.
- **Modern UI** — Responsive and accessible design using TailwindCSS + shadcn/ui.
- **MongoDB Integration** — Store notes, user data, and transcriptions efficiently.

---

## Installation & Setup

### **Prerequisites**

Make sure you have the following installed:

- Node.js (v18+)
- npm or yarn
- MongoDB (local or cloud instance)

### **Clone the Repository**

```bash
git clone https://github.com/yourusername/StuNotes.git
cd StuNotes
```

### **Frontend Setup**

```bash
cd frontend
npm install
npm run dev
```

The frontend should now be running at [http://localhost:5173](http://localhost:5173) 

### **Backend Setup**

```bash
cd backend
npm install
npm run dev
```

Backend will start on [http://localhost:4000](http://localhost:4000)


