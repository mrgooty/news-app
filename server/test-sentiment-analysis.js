// server/test-sentiment-analysis.js

import { EnhancedSentimentAnalysisService } from './src/ai/index.js';
import ComprehensiveArticleAnalysisService from './src/services/comprehensiveArticleAnalysisService.js';
import { PartyIdentificationService } from './src/ai/index.js';

// Test article text for demonstration
const testArticleText = `
President Biden announced new economic policies today that will significantly impact the middle class and low-income families. 
The Democratic Party's proposal includes tax increases for wealthy individuals and corporations, while providing relief for 
working families. Republican leaders immediately criticized the plan, calling it "anti-business" and "harmful to economic growth."

The new policies are expected to affect the United States economy and could influence international trade relations with 
China and other countries. Women and minority communities are expected to benefit from the proposed changes, according to 
the administration's analysis.

The European Union has expressed interest in similar policies, while Russia has criticized the approach. The elderly 
population may see improved healthcare benefits, while young people could benefit from new educational opportunities.
`;

async function testPartyIdentification() {
  console.log('=== Testing Party Identification Service ===');
  
  try {
    const partyIdentificationService = new PartyIdentificationService();
    const identifiedEntities = await partyIdentificationService.identifyParties(testArticleText);
    const validation = partyIdentificationService.validateEntities(identifiedEntities);
    
    console.log('Identified Political Parties:');
    identifiedEntities.politicalParties.forEach(party => {
      console.log(`- ${party.name} (${party.country}): ${party.mentions.length} mentions`);
    });
    
    console.log('\nIdentified Countries:');
    identifiedEntities.countries.forEach(country => {
      console.log(`- ${country.code.toUpperCase()}: ${country.mentions.length} mentions`);
    });
    
    console.log('\nIdentified Population Groups:');
    identifiedEntities.populationGroups.forEach(group => {
      console.log(`- ${group.name} (${group.category}): ${group.mentions.length} mentions`);
    });
    
    console.log('\nValidation Results:');
    console.log(JSON.stringify(validation, null, 2));
    
  } catch (error) {
    console.error('Error in party identification test:', error);
  }
}

async function testEnhancedSentimentAnalysis() {
  console.log('\n=== Testing Enhanced Sentiment Analysis Service ===');
  
  try {
    const sentimentAnalyzer = new EnhancedSentimentAnalysisService();
    const analysis = await sentimentAnalyzer.analyzeSentiment(testArticleText, {
      title: 'Biden Announces New Economic Policies',
      source: 'Test News Source',
      author: 'Test Author'
    });
    
    console.log('Overall Sentiment:', analysis.sentimentAnalysis.overallSentiment);
    console.log('Confidence:', analysis.sentimentAnalysis.confidence);
    
    console.log('\nPolitical Parties Analysis:');
    for (const [partyName, partyAnalysis] of Object.entries(analysis.sentimentAnalysis.politicalParties)) {
      console.log(`- ${partyName}: ${partyAnalysis.sentiment} sentiment, ${partyAnalysis.impact} impact, ${partyAnalysis.confidence} confidence`);
    }
    
    console.log('\nCountries Analysis:');
    for (const [countryCode, countryAnalysis] of Object.entries(analysis.sentimentAnalysis.countries)) {
      console.log(`- ${countryCode.toUpperCase()}: ${countryAnalysis.sentiment} sentiment, ${countryAnalysis.impact} impact, ${countryAnalysis.confidence} confidence`);
    }
    
    console.log('\nPopulation Groups Analysis:');
    for (const [groupName, groupAnalysis] of Object.entries(analysis.sentimentAnalysis.populationGroups)) {
      console.log(`- ${groupName}: ${groupAnalysis.sentiment} sentiment, ${groupAnalysis.impact} impact, ${groupAnalysis.confidence} confidence`);
    }
    
    console.log('\nKey Insights:');
    analysis.sentimentAnalysis.keyInsights.forEach(insight => {
      console.log(`- ${insight.insight}`);
    });
    
  } catch (error) {
    console.error('Error in enhanced sentiment analysis test:', error);
  }
}

async function testComprehensiveAnalysis() {
  console.log('\n=== Testing Comprehensive Article Analysis Service ===');
  
  try {
    const comprehensiveService = new ComprehensiveArticleAnalysisService();
    const analysis = await comprehensiveService.analyzeArticleText(testArticleText, {
      title: 'Biden Announces New Economic Policies',
      source: 'Test News Source',
      author: 'Test Author'
    });
    
    console.log('Article Data:');
    console.log(`- Title: ${analysis.articleData.title}`);
    console.log(`- Word Count: ${analysis.articleData.wordCount}`);
    console.log(`- Reading Time: ${analysis.articleData.readingTime} minutes`);
    
    console.log('\nSummary Overview:');
    console.log(`- Overall Sentiment: ${analysis.summary.overview.sentiment}`);
    console.log(`- Confidence: ${analysis.summary.overview.confidence}`);
    
    console.log('\nPolitical Impact:');
    console.log(`- Parties Affected: ${analysis.summary.politicalImpact.partiesAffected}`);
    console.log(`- High Impact Parties: ${analysis.summary.politicalImpact.highImpactParties.length}`);
    
    console.log('\nInternational Impact:');
    console.log(`- Countries Affected: ${analysis.summary.internationalImpact.countriesAffected}`);
    console.log(`- High Impact Countries: ${analysis.summary.internationalImpact.highImpactCountries.length}`);
    
    console.log('\nSocial Impact:');
    console.log(`- Population Groups Affected: ${analysis.summary.socialImpact.populationGroupsAffected}`);
    console.log(`- High Impact Groups: ${analysis.summary.socialImpact.highImpactGroups.length}`);
    
    console.log('\nKey Takeaways:');
    analysis.summary.overview.keyTakeaways.forEach(takeaway => {
      console.log(`- ${takeaway.message}`);
    });
    
    console.log('\nReader Recommendations:');
    analysis.summary.recommendations.forReaders.forEach(rec => {
      console.log(`- ${rec.message}`);
    });
    
  } catch (error) {
    console.error('Error in comprehensive analysis test:', error);
  }
}

async function testBatchAnalysis() {
  console.log('\n=== Testing Batch Analysis ===');
  
  try {
    const comprehensiveService = new ComprehensiveArticleAnalysisService();
    
    // Create multiple test articles
    const testArticles = [
      {
        text: 'The Republican Party criticized the new tax policies today. Wealthy individuals expressed concerns about the impact on their investments.',
        metadata: { title: 'Republicans Criticize Tax Policies', source: 'Test Source 1' }
      },
      {
        text: 'China and the United States reached a new trade agreement. The deal benefits both countries and supports economic growth.',
        metadata: { title: 'US-China Trade Agreement', source: 'Test Source 2' }
      },
      {
        text: 'New policies will support women and minority communities. The middle class is expected to benefit from these changes.',
        metadata: { title: 'Support for Women and Minorities', source: 'Test Source 3' }
      }
    ];
    
    const analyses = [];
    for (const article of testArticles) {
      const analysis = await comprehensiveService.analyzeArticleText(article.text, article.metadata);
      analyses.push(analysis);
    }
    
    const statistics = comprehensiveService.getAnalysisStatistics(analyses);
    
    console.log('Batch Analysis Statistics:');
    console.log(`- Total Articles: ${statistics.totalArticles}`);
    console.log(`- Sentiment Distribution:`, statistics.sentimentDistribution);
    console.log(`- Entity Distribution:`, statistics.entityDistribution);
    console.log(`- Average Confidence: ${statistics.averageConfidence.toFixed(2)}`);
    console.log(`- High Impact Articles: ${statistics.highImpactArticles}`);
    
  } catch (error) {
    console.error('Error in batch analysis test:', error);
  }
}

async function runAllTests() {
  console.log('Starting Comprehensive Sentiment Analysis Tests\n');
  
  await testPartyIdentification();
  await testEnhancedSentimentAnalysis();
  await testComprehensiveAnalysis();
  await testBatchAnalysis();
  
  console.log('\n=== All Tests Completed ===');
}

// Run the tests
runAllTests().catch(console.error); 