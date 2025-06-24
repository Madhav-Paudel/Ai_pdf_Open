// ai-service.js - AI Integration Service
const axios = require('axios');

class AIService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.apiUrl = config.apiUrl || 'https://api.openai.com/v1/chat/completions';
    this.model = config.model || 'gpt-3.5-turbo';
    this.maxTokens = config.maxTokens || 500;
  }

  async summarizeText(text, type = 'selection') {
    const prompt = this.getSummarizePrompt(text, type);
    
    try {
      const response = await this.callOpenAI(prompt);
      return {
        summary: response,
        wordCount: text.split(' ').length,
        type: type
      };
    } catch (error) {
      console.error('AI Summarization Error:', error);
      throw new Error('Failed to summarize text');
    }
  }

  async answerQuestion(documentText, question) {
    const prompt = this.getQuestionPrompt(documentText, question);
    
    try {
      const response = await this.callOpenAI(prompt);
      return {
        question: question,
        answer: response,
        confidence: this.estimateConfidence(response),
        relevantSections: this.findRelevantSections(documentText, question)
      };
    } catch (error) {
      console.error('AI Question Answering Error:', error);
      throw new Error('Failed to answer question');
    }
  }

  getSummarizePrompt(text, type) {
    const wordCount = text.split(' ').length;
    const summaryLength = type === 'selection' ? '2-3 sentences' : '3-5 sentences';
    
    return `Please provide a clear and concise summary of the following ${type} in ${summaryLength}. 
    Focus on the key points and main ideas:

    Text to summarize (${wordCount} words):
    ${text}

    Summary:`;
  }

  getQuestionPrompt(documentText, question) {
    return `Based on the following document, please answer the question as accurately as possible. 
    If the answer is not clearly stated in the document, please indicate that and provide the best 
    possible answer based on the available information.

    Document:
    ${documentText.substring(0, 4000)} ${documentText.length > 4000 ? '...' : ''}

    Question: ${question}

    Answer:`;
  }

  async callOpenAI(prompt) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await axios.post(
      this.apiUrl,
      {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  estimateConfidence(response) {
    // Simple confidence estimation based on response characteristics
    const indicators = {
      certain: ['definitely', 'clearly', 'explicitly', 'specifically'],
      uncertain: ['might', 'possibly', 'appears', 'seems', 'unclear', 'not specified']
    };

    const lowerResponse = response.toLowerCase();
    let certainCount = 0;
    let uncertainCount = 0;

    indicators.certain.forEach(word => {
      if (lowerResponse.includes(word)) certainCount++;
    });

    indicators.uncertain.forEach(word => {
      if (lowerResponse.includes(word)) uncertainCount++;
    });

    const confidence = Math.max(0.3, Math.min(0.95, 0.7 + (certainCount * 0.1) - (uncertainCount * 0.15)));
    return Math.round(confidence * 100) / 100;
  }

  findRelevantSections(documentText, question) {
    // Simple keyword matching to find relevant sections
    const questionWords = question.toLowerCase().split(' ')
      .filter(word => word.length > 3)
      .filter(word => !['what', 'where', 'when', 'how', 'why', 'which', 'this', 'that', 'does', 'have'].includes(word));

    const sections = documentText.split('\n\n');
    const relevantSections = [];

    sections.forEach((section, index) => {
      const sectionLower = section.toLowerCase();
      let matchCount = 0;

      questionWords.forEach(word => {
        if (sectionLower.includes(word)) {
          matchCount++;
        }
      });

      if (matchCount > 0) {
        relevantSections.push({
          section: index + 1,
          matches: matchCount,
          preview: section.substring(0, 100) + '...'
        });
      }
    });

    return relevantSections
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 3)
      .map(item => `Section ${item.section}`);
  }

  // Alternative AI service implementations
  async callHuggingFace(prompt) {
    // Implementation for Hugging Face API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      {
        inputs: prompt,
        parameters: {
          max_length: this.maxTokens,
          min_length: 50,
          do_sample: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data[0].summary_text || response.data[0].generated_text;
  }

  async callAnthropic(prompt) {
    // Implementation for Anthropic Claude API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return response.data.content[0].text;
  }

  // Local AI processing (for offline use)
  async processLocally(text, type) {
    // Simple local processing using basic NLP techniques
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (type === 'summarize-selection' || type === 'summarize-document') {
      return this.extractiveSummary(sentences, type === 'summarize-selection' ? 2 : 3);
    }
    
    return 'Local AI processing not fully implemented. Please configure an AI service.';
  }

  extractiveSummary(sentences, maxSentences) {
    // Simple extractive summarization
    const wordFreq = {};
    const sentenceScores = {};

    // Calculate word frequencies
    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().split(/\W+/).filter(word => word.length > 3);
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
    });

    // Score sentences based on word frequencies
    sentences.forEach((sentence, index) => {
      const words = sentence.toLowerCase().split(/\W+/).filter(word => word.length > 3);
      let score = 0;
      words.forEach(word => {
        score += wordFreq[word] || 0;
      });
      sentenceScores[index] = score / words.length;
    });

    // Get top sentences
    const topSentences = Object.entries(sentenceScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxSentences)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([index]) => sentences[parseInt(index)]);

    return topSentences.join('. ') + '.';
  }

  // Configuration methods
  setAPIKey(key) {
    this.apiKey = key;
  }

  setModel(model) {
    this.model = model;
  }

  setMaxTokens(tokens) {
    this.maxTokens = tokens;
  }

  // Health check
  async testConnection() {
    try {
      const response = await this.callOpenAI('Test connection. Please respond with "OK".');
      return response.toLowerCase().includes('ok');
    } catch (error) {
      console.error('AI service connection test failed:', error);
      return false;
    }
  }
}

module.exports = AIService;