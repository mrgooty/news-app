const log = require('../utils/logger')('SummarizationService');

// Helper to dynamically import the pipeline function, ensuring it's only imported once.
let pipelinePromise = null;
const getPipeline = () => {
  if (pipelinePromise === null) {
    pipelinePromise = new Promise(async (resolve, reject) => {
      try {
        const { pipeline } = await import('@xenova/transformers');
        resolve(pipeline);
      } catch (e) {
        reject(e);
      }
    });
  }
  return pipelinePromise;
};

class SummarizationService {
  constructor() {
    this.summarizer = null;
    this.initializing = this.init();
  }

  async init() {
    try {
      log('Initializing summarization pipeline...');
      const pipeline = await getPipeline();
      // 'facebook/bart-large-cnn' is a well-regarded model for summarization.
      this.summarizer = await pipeline('summarization', 'Xenova/bart-large-cnn', {
        // Suppress verbose ONNX Runtime warnings by setting log level to Error
        session_options: { logSeverityLevel: 3 }, // 0:V, 1:I, 2:W, 3:E, 4:F
      });
      log('Summarization pipeline initialized successfully.');
    } catch (error) {
      log('ERROR: Failed to initialize summarization pipeline:', error);
      this.summarizer = null; // Ensure summarizer is null on failure
    }
  }

  /**
   * Summarizes the given text content.
   * @param {string} text The text to summarize.
   * @returns {Promise<string|null>} The summarized text, or null if an error occurs.
   */
  async summarize(text) {
    // Ensure the model is initialized before trying to use it.
    await this.initializing;

    if (!this.summarizer) {
      log('ERROR: Summarizer not available. Cannot perform summarization.');
      return 'Summarization service is currently unavailable.';
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      log('WARN: Summarization called with empty or invalid text.');
      return 'No content provided for summarization.';
    }

    try {
      log('Starting summarization...');
      const result = await this.summarizer(text, {
        min_length: 30,
        max_length: 150,
        // Other parameters like temperature can be added if supported by the model
      });
      const summary = result[0]?.summary_text || 'Could not generate summary.';
      log('Summarization complete.');
      return summary;
    } catch (error) {
      log('ERROR: Error during summarization:', error);
      return 'An error occurred while generating the summary.';
    }
  }
}

// Export a singleton instance so the model is only loaded once.
module.exports = new SummarizationService(); 