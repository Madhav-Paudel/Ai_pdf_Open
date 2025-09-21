# PDF Reader AI 🤖📚

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.30+-red.svg)](https://streamlit.io)
[![LangChain](https://img.shields.io/badge/LangChain-0.1+-green.svg)](https://www.langchain.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An intelligent Streamlit application that allows you to chat with your PDF documents. Upload multiple PDFs, and ask questions about their content using the power of Google's Gemini Pro and local HuggingFace embeddings.

## 🚀 Features

-   **Chat with Multiple PDFs**: Upload one or more PDF documents to create a single knowledge base.
-   **Local Embeddings**: Uses HuggingFace's `all-MiniLM-L6-v2` model to generate text embeddings locally, avoiding API costs and rate limits from cloud providers.
-   **Advanced LLM for Q&A**: Leverages Google's `gemini-pro` model for accurate and context-aware answers.
-   **Conversation History**: Remembers the context of the conversation for follow-up questions.
-   **User-Friendly Interface**: A clean and simple UI built with Streamlit, making it easy for anyone to use.

## ⚙️ Installation

Follow these steps to set up and run the project on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/Madhav-Paudel/Ai_pdf_Open.git
cd Ai_pdf_Open
```

### 2. Create and Activate a Virtual Environment

It is highly recommended to use a virtual environment to avoid dependency conflicts.

```bash
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows
.venv\Scripts\Activate.ps1
# On macOS/Linux
source .venv/bin/activate
```

### 3. Install Dependencies

Install all the required packages from the `requirements.txt` file.

```bash
pip install -r requirements.txt
```

### 4. Configure API Key

You need a Google API key to use the Gemini model.

-   Create a file named `.env` in the root of the project directory.
-   Add your Google API key to the file as follows:

```
GOOGLE_API_KEY="YOUR_API_KEY_HERE"
```

## ▶️ How to Run

Once you have completed the installation steps, you can run the application with a single command:

```bash
streamlit run app.py
```

The application will open in your web browser.

## 📝 Example Usage

1.  **Launch the app**: Run `streamlit run app.py` in your terminal.
2.  **Upload PDFs**: Use the sidebar to upload one or more PDF files.
3.  **Process Files**: Click the "Process" button and wait for the files to be processed.
4.  **Ask Questions**: Type your questions in the chat input box and get instant answers from your documents!

## 📂 Folder Structure

```
.
├── .venv/                  # Virtual environment directory
├── .env                    # API key configuration
├── app.py                  # Main Streamlit application
├── HtmlTemplate.py         # HTML and CSS for the chat interface
├── requirements.txt        # Project dependencies
└── README.md               # Project documentation
```