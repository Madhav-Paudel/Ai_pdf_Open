const electron = require('electron');
const { app, BrowserWindow, ipcMain, dialog, Menu } = electron;
const path = require('path');
const fs = require('fs');

// Load environment variables (if using .env file)
// require('dotenv').config();

// Import AI service
const AIService = require('./ai-service');

let mainWindow;
let aiService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');

  // Initialize AI service
  initializeAIService();

  // Create menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open PDF',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'PDF Files', extensions: ['pdf'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('open-pdf', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Configure AI',
          click: () => {
            showAIConfigDialog();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'AI',
      submenu: [
        {
          label: 'Summarize Selection',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('ai-summarize-selection');
          }
        },
        {
          label: 'Summarize Document',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => {
            mainWindow.webContents.send('ai-summarize-document');
          }
        },
        {
          label: 'Ask AI',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            mainWindow.webContents.send('ai-ask-question');
          }
        },
        { type: 'separator' },
        {
          label: 'Test AI Connection',
          click: async () => {
            await testAIConnection();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function initializeAIService() {
  // Initialize AI service with multiple fallback options
  const config = {
    // Priority order: direct config > environment variable > prompt user
    apiKey: process.env.OPENAI_API_KEY || 'YOUR_API_KEY_HERE', // Replace with your key if not using env variables
    model: 'gpt-3.5-turbo',
    maxTokens: 500
  };

  aiService = new AIService(config);
  
  // If no API key is found, the service will use local fallback
  if (!config.apiKey || config.apiKey === 'YOUR_API_KEY_HERE') {
    console.warn('No OpenAI API key found. AI features will use local processing.');
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'AI Configuration',
      message: 'No OpenAI API key found. AI features will use basic local processing.',
      detail: 'To enable full AI features, please set your OpenAI API key in the environment variables or through the File > Configure AI menu.'
    });
  }
}

async function showAIConfigDialog() {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'AI Configuration',
    message: 'Configure AI Service',
    detail: 'Choose how to configure your AI service:',
    buttons: ['Set API Key', 'Use Environment Variable', 'Use Local Processing', 'Cancel'],
    defaultId: 0
  });

  switch (result.response) {
    case 0: // Set API Key
      // In a real app, you'd want a proper input dialog
      // For now, show instructions
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Set API Key',
        message: 'To set your OpenAI API key:',
        detail: '1. Get your API key from https://platform.openai.com/api-keys\n' +
                '2. Set environment variable: OPENAI_API_KEY=your-key-here\n' +
                '3. Restart the application\n\n' +
                'Or modify the apiKey in main.js directly (less secure)'
      });
      break;
    case 1: // Environment Variable
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Environment Variable Setup',
        message: 'Set OPENAI_API_KEY environment variable',
        detail: 'Windows: set OPENAI_API_KEY=your-key-here\n' +
                'macOS/Linux: export OPENAI_API_KEY=your-key-here\n' +
                'Then restart the application'
      });
      break;
    case 2: // Local Processing
      aiService.setAPIKey(null); // Force local processing
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Local Processing',
        message: 'AI service configured for local processing',
        detail: 'Basic text processing will be used instead of AI services.'
      });
      break;
  }
}

async function testAIConnection() {
  try {
    const isConnected = await aiService.testConnection();
    dialog.showMessageBox(mainWindow, {
      type: isConnected ? 'info' : 'error',
      title: 'AI Connection Test',
      message: isConnected ? 'AI service is working!' : 'AI service connection failed',
      detail: isConnected 
        ? 'OpenAI API is accessible and working correctly.'
        : 'Check your API key and internet connection. The app will use local processing as fallback.'
    });
  } catch (error) {
    dialog.showErrorBox('AI Connection Error', error.message);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('read-pdf-file', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer;
  } catch (error) {
    console.error('Error reading PDF file:', error);
    throw error;
  }
});

ipcMain.handle('ai-process', async (event, { type, content, question = null }) => {
  try {
    console.log(`Processing AI request: ${type}`);
    
    if (!aiService) {
      throw new Error('AI service not initialized');
    }

    let result;
    switch (type) {
      case 'summarize-selection':
      case 'summarize-document':
        result = await aiService.summarizeText(content, type.replace('summarize-', ''));
        break;
      case 'ask-question':
        result = await aiService.answerQuestion(content, question);
        break;
      default:
        throw new Error('Unknown AI process type: ' + type);
    }

    console.log('AI processing completed successfully');
    return result;

  } catch (error) {
    console.error('AI processing error:', error);
    
    // Return user-friendly error with fallback
    return {
      error: true,
      message: error.message,
      fallbackResponse: getFallbackResponse(type, content, question)
    };
  }
});

// Fallback responses when AI fails
function getFallbackResponse(type, content, question) {
  const words = content.split(' ').length;
  
  switch (type) {
    case 'summarize-selection':
      return {
        summary: `Selected text contains ${words} words. AI processing unavailable - this is a fallback response. The selected content appears to contain important information that would benefit from AI analysis.`,
        wordCount: words,
        type: 'selection',
        fallback: true
      };
    case 'summarize-document':
      return {
        summary: `Document contains approximately ${words} words across multiple sections. AI processing unavailable - this is a fallback response. For full AI-powered analysis, please configure your OpenAI API key.`,
        wordCount: words,
        type: 'document',
        fallback: true
      };
    case 'ask-question':
      return {
        question: question,
        answer: `AI processing unavailable. Question: "${question}" - To get AI-powered answers about your document content, please configure your OpenAI API key through File > Configure AI.`,
        confidence: 0.0,
        relevantSections: [],
        fallback: true
      };
    default:
      return {
        error: true,
        message: 'Unknown request type',
        fallback: true
      };
  }
}