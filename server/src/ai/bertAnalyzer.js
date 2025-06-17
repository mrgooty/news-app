let transformers;

async function getPipeline() {
  if (!transformers) {
    transformers = await import('@xenova/transformers');
  }
  return transformers.pipeline;
}

/**
 * Analyzer using BERT-based models for summarization and sentiment analysis
 */
class BertAnalyzer {
  constructor() {
    this.loaders = {
      summarizer: null,
      sentiment: null,
    };
  }

  async loadModels() {
    const pipeline = await getPipeline();
    if (!this.loaders.summarizer) {
      this.loaders.summarizer = pipeline(
        'summarization',
        'Xenova/bart-large-cnn'
      );
    }
    if (!this.loaders.sentiment) {
      this.loaders.sentiment = pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
    }
    this.summarizer = await this.loaders.summarizer;
    this.sentiment = await this.loaders.sentiment;
  }

  async summarize(text) {
    await this.loadModels();
    const result = await this.summarizer(text, { max_length: 60 });
    return result[0]?.summary_text || '';
  }

  async analyzeSentiment(text) {
    await this.loadModels();
    const result = await this.sentiment(text);
    return result[0]?.label.toLowerCase() || 'neutral';
  }
}

module.exports = BertAnalyzer;
