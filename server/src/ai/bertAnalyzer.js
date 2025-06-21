let transformers;

async function getPipeline() {
  if (!transformers) {
    transformers = await import('@xenova/transformers');
  }
  return transformers.pipeline;
}

/**
 * Analyzer using a distilled BERT model for sentiment analysis.
 */
class BertAnalyzer {
  constructor() {
    this.sentimentPipeline = null;
    this.initializing = this.init();
  }

  async init() {
    try {
      const pipeline = await getPipeline();
      this.sentimentPipeline = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
    } catch (error) {
      console.error("Failed to initialize sentiment analysis pipeline:", error);
    }
  }

  async analyzeSentiment(text) {
    await this.initializing;
    if (!this.sentimentPipeline) {
      return 'neutral'; // Fallback if pipeline fails
    }
    const result = await this.sentimentPipeline(text);
    return result[0]?.label.toLowerCase() || 'neutral';
  }
}

export default BertAnalyzer;
