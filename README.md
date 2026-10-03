**🎯 Why I Built This**
Fashion content creation often involves repetitive manual steps.
I wanted to explore whether AI and browser automation could be combined to create a workflow where a user only needs to provide the basic inputs and the rest of the process can be automated.
This project combines:
- AI image generation
- AI video generation
- Browser automation
- React UI
- Python automation
- File processing


**📁 Project Structure**
fashion-ai/
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── ...
│
├── public/
│
├── package.json
├── vite.config.js
└── README.md

The Python automation is maintained separately from the frontend.
⚙️ Current Workflow

The current prototype works through a browser-based automation workflow.
The frontend sends the selected model and product images to the automation service.
The automation then performs the AI generation workflow through the browser.
🔮 Future Improvements
- ☁️ Cloud deployment
- 📱 Better mobile experience
- ⚡ Faster generation workflow
- 👩 Multiple model management
- 👗 Better product management
- 🎬 Automated video generation
- 📥 Automatic final-file delivery
- 🔐 User authentication
- 📊 Generation history
- ☁️ Cloud storage
- 🚀 Scalable backend


⚠️ Project Status
This project is currently a prototype / work in progress.
The main goal is to experiment with AI-powered content generation and workflow automation.
Some automation components currently depend on the local environment and browser session.

👨‍💻 Author
Rohit Singh

Built as a personal project to explore AI automation, frontend development, and browser-based workflows.

⭐ Feedback
If you have suggestions, ideas, or improvements, feel free to open an issue or contribute to the project.



# 👗 FASHION AI

An AI-powered fashion content automation platform designed to simplify the process of creating AI-generated fashion images and short-form videos.

## 🚀 Overview

Creating fashion content manually can take a lot of time.

The workflow usually involves:

1. Selecting a model image
2. Selecting a clothing/product image
3. Generating an AI image of the model wearing the selected product
4. Generating a short fashion video/reel
5. Downloading the final content

**FASHION AI** is designed to simplify this workflow through a single interface.

The user selects a model and a product, then starts the automation process.

---

## ✨ Features

### 👩 Model Management

- Upload and save model images
- Support for multiple saved models
- Select a model for content generation
- Store model images locally in the browser

### 👗 Product Upload

- Upload clothing/product images
- Select the product to use for generation

### 🤖 AI Image Generation

The automation uses the selected model and product images to generate a new fashion image.

The workflow aims to preserve:

- Model identity
- Face
- Pose
- Body proportions
- Background
- Lighting
- Camera composition

while replacing the clothing with the selected product.

### 🎬 AI Video Generation

After the AI image is generated, the workflow can continue toward short-form fashion video/reel generation.

The final content can be used for:

- Instagram Reels
- YouTube Shorts
- Fashion marketing
- Product promotion

### 📊 Automation Status

The interface provides progress information while the automation is running.

The frontend communicates with the automation service to:

- Start the workflow
- Check automation status
- Detect generated images
- Detect generated videos
- Display the final results

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Automation

- Python
- Playwright
- Chrome
- Gemini
- Google Flow

### Storage


- IndexedDB
- Local browser storage


---

## 🔄 Workflow

```text
             FASHION AI
                  │
                  ▼
          Select Model Image
                  │
                  ▼
         Upload Product Image
                  │
                  ▼
          Start Automation
                  │
                  ▼
        ┌──────────────────┐
        │     Gemini AI    │
        │ Image Generation │
        └────────┬─────────┘
                 │
                 ▼
        Generated Model Image
                 │
                 ▼
        ┌──────────────────┐
        │   Google Flow    │
        │ Video Generation │
        └────────┬─────────┘
                 │
                 ▼
          Fashion Reel
                 │
                 ▼
             Final Output






**🎯 Why I Built This**
Fashion content creation often involves repetitive manual steps.
I wanted to explore whether AI and browser automation could be combined to create a workflow where a user only needs to provide the basic inputs and the rest of the process can be automated.
This project combines:
- AI image generation
- AI video generation
- Browser automation
- React UI
- Python automation
- File processing


**📁 Project Structure**
fashion-ai/
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── ...
│
├── public/
│
├── package.json
├── vite.config.js
└── README.md

The Python automation is maintained separately from the frontend.
⚙️ Current Workflow
The current prototype works through a browser-based automation workflow.
The frontend sends the selected model and product images to the automation service.
The automation then performs the AI generation workflow through the browser.
🔮 Future Improvements
- ☁️ Cloud deployment
- 📱 Better mobile experience
- ⚡ Faster generation workflow
- 👩 Multiple model management
- 👗 Better product management
- 🎬 Automated video generation
- 📥 Automatic final-file delivery
- 🔐 User authentication
- 📊 Generation history
- ☁️ Cloud storage
- 🚀 Scalable backend
⚠️ Project Status
This project is currently a prototype / work in progress.
The main goal is to experiment with AI-powered content generation and workflow automation.
Some automation components currently depend on the local environment and browser session.
👨‍💻 Author
Rohit Singh
Built as a personal project to explore AI automation, frontend development, and browser-based workflows.
⭐ Feedback
If you have suggestions, ideas, or improvements, feel free to open an issue or contribute to the project.
