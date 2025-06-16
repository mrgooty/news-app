/**
 * Test script for the AI news orchestration system
 * Run with: node src/ai/test.js
 */

const { NewsAggregator } = require('./index');
const config = require('../config/config');

// Sample news articles for testing
const sampleArticles = [
  {
    id: '1',
    title: 'Tech Giant Unveils New AI Chip',
    description: 'A leading technology company has announced a breakthrough in AI chip design that promises to revolutionize machine learning applications.',
    content: 'The new chip, developed after years of research, offers 5x performance improvement while consuming 50% less power compared to previous generations. Industry analysts suggest this could significantly accelerate AI adoption across various sectors including healthcare, automotive, and consumer electronics.',
    url: 'https://example.com/tech-ai-chip',
    imageUrl: 'https://example.com/images/ai-chip.jpg',
    source: 'Tech News',
    publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    category: 'technology',
  },
  {
    id: '2',
    title: 'Global Markets React to Interest Rate Decision',
    description: 'Stock markets worldwide showed volatility following the central bank\'s decision on interest rates.',
    content: 'The Federal Reserve announced it would maintain current interest rates, contrary to market expectations of a 25 basis point cut. This decision triggered immediate reactions across global markets, with technology stocks experiencing the sharpest decline. Economists are divided on the long-term implications, with some warning of potential slowdown in economic growth while others praise the move as necessary to control inflation.',
    url: 'https://example.com/markets-interest-rates',
    imageUrl: 'https://example.com/images/stock-market.jpg',
    source: 'Financial Times',
    publishedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    category: 'business',
  },
  {
    id: '3',
    title: 'Scientists Discover Potential Breakthrough in Cancer Treatment',
    description: 'A team of researchers has identified a novel approach that could transform how certain types of cancer are treated.',
    content: 'The research, published in Nature Medicine, details a new immunotherapy technique that specifically targets cancer stem cells, which are often responsible for tumor recurrence and metastasis. In preliminary clinical trials, patients with advanced stages of pancreatic and ovarian cancers showed significant improvement, with 60% experiencing tumor reduction. The treatment works by reprogramming the body\'s T-cells to recognize and attack cancer stem cells while leaving healthy cells intact.',
    url: 'https://example.com/cancer-breakthrough',
    imageUrl: 'https://example.com/images/medical-research.jpg',
    source: 'Science Daily',
    publishedAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    category: 'health',
  }
];

// Test the news orchestration system
async function runTest() {
  console.log('Testing AI News Orchestration System...');
  
  try {
    // Initialize the news aggregator
    const newsAggregator = new NewsAggregator();
    
    console.log('\n1. Testing single article processing:');
    const processedArticle = await newsAggregator.processArticle(sampleArticles[0]);
    console.log('Processed article:');
    console.log('- Title:', processedArticle.title);
    console.log('- Summary:', processedArticle.summary);
    console.log('- Category:', processedArticle.category);
    console.log('- Importance:', processedArticle.importance);
    console.log('- Relevance Score:', processedArticle.relevanceScore);
    console.log('- Final Score:', processedArticle.finalScore);
    
    console.log('\n2. Testing batch processing:');
    const processedArticles = await newsAggregator.processArticles(sampleArticles);
    console.log(`Processed ${processedArticles.length} articles`);
    
    console.log('\n3. Testing article ranking:');
    const rankedArticles = await newsAggregator.rankArticles(processedArticles);
    console.log('Ranked articles (by score):');
    rankedArticles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} - Score: ${article.combinedScore.toFixed(2)}`);
    });
    
    console.log('\n4. Testing top stories aggregation:');
    const articlesByCategory = {
      technology: [sampleArticles[0]],
      business: [sampleArticles[1]],
      health: [sampleArticles[2]],
    };
    
    const topStories = await newsAggregator.getTopStories(articlesByCategory, 3);
    console.log('Top stories across categories:');
    topStories.forEach((article, index) => {
      console.log(`${index + 1}. [${article.category}] ${article.title} - Score: ${article.finalScore.toFixed(2)}`);
    });
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  if (!config.ai.openaiApiKey || config.ai.openaiApiKey === 'your_openai_key_here') {
    console.error('Error: OpenAI API key not configured. Please set OPENAI_API_KEY in .env file.');
  } else {
    runTest();
  }
}

module.exports = { runTest };