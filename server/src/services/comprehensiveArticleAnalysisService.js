// server/src/services/comprehensiveArticleAnalysisService.js

import ArticleScraperService from './articleScraperService.js';
import summarizationService from '../ai/summarizationService.js';
import { EnhancedSentimentAnalysisService } from '../ai/sentimentIndex.js';

class ComprehensiveArticleAnalysisService {
  constructor() {
    this.articleScraper = new ArticleScraperService();
    this.sentimentAnalyzer = new EnhancedSentimentAnalysisService();
  }

  /**
   * Performs comprehensive analysis of an article from URL
   * @param {string} url - The URL of the article to analyze
   * @param {Object} options - Analysis options
   * @returns {Object} - Comprehensive analysis results
   */
  async analyzeArticleFromUrl(url, options = {}) {
    try {
      console.log(`Starting comprehensive analysis for URL: ${url}`);
      
      // Step 1: Scrape the article content
      const scrapedContent = await this.articleScraper.scrape(url);
      
      if (!scrapedContent || scrapedContent.startsWith('Could not extract') || scrapedContent.startsWith('Failed to scrape')) {
        throw new Error('Failed to extract article content');
      }
      
      // Parse the scraped content to extract title and content
      const lines = scrapedContent.split('\n\n');
      const title = lines[0] || 'Unknown Title';
      const content = lines.slice(1).join('\n\n');
      
      // Step 2: Generate summary
      const summaryText = await summarizationService.summarize(content);

      // Step 3: Perform comprehensive sentiment analysis
      const sentimentAnalysis = await this.sentimentAnalyzer.analyzeSentiment(
        content,
        {
          url: url,
          title: title,
          ...options
        }
      );
      
      // Step 4: Combine results
      const comprehensiveAnalysis = {
        metadata: {
          url: url,
          analysisTimestamp: new Date().toISOString(),
          analysisVersion: '1.0',
          options: options
        },
        articleData: {
          title: title,
          contentLength: content.length,
          wordCount: content.split(/\s+/).length,
          readingTime: this.calculateReadingTime(content),
          summary: summaryText
        },
        sentimentAnalysis: sentimentAnalysis,
        summary: this.createComprehensiveSummary({ title, content }, sentimentAnalysis)
      };
      
      console.log('Comprehensive analysis completed successfully');
      return comprehensiveAnalysis;
      
    } catch (error) {
      console.error('Error in comprehensive article analysis:', error);
      throw error;
    }
  }

  /**
   * Performs comprehensive analysis of article text
   * @param {string} articleText - The article text to analyze
   * @param {Object} articleMetadata - Article metadata
   * @param {Object} options - Analysis options
   * @returns {Object} - Comprehensive analysis results
   */
  async analyzeArticleText(articleText, articleMetadata = {}, options = {}) {
    try {
      console.log('Starting comprehensive analysis of article text');
      
      // Perform comprehensive sentiment analysis
      const sentimentAnalysis = await this.sentimentAnalyzer.analyzeSentiment(
        articleText,
        { ...articleMetadata, ...options }
      );
      
      // Create comprehensive results
      const comprehensiveAnalysis = {
        metadata: {
          analysisTimestamp: new Date().toISOString(),
          analysisVersion: '1.0',
          options: options
        },
        articleData: {
          title: articleMetadata.title || 'Unknown',
          author: articleMetadata.author || 'Unknown',
          publishedDate: articleMetadata.publishedDate || null,
          source: articleMetadata.source || 'Unknown',
          contentLength: articleText.length,
          wordCount: articleText.split(/\s+/).length,
          readingTime: this.calculateReadingTime(articleText)
        },
        sentimentAnalysis: sentimentAnalysis,
        summary: this.createComprehensiveSummary(
          { content: articleText, ...articleMetadata }, 
          sentimentAnalysis
        )
      };
      
      console.log('Comprehensive text analysis completed successfully');
      return comprehensiveAnalysis;
      
    } catch (error) {
      console.error('Error in comprehensive text analysis:', error);
      throw error;
    }
  }

  /**
   * Creates a comprehensive summary of the analysis
   * @param {Object} articleData - Article data
   * @param {Object} sentimentAnalysis - Sentiment analysis results
   * @returns {Object} - Comprehensive summary
   */
  createComprehensiveSummary(articleData, sentimentAnalysis) {
    const summary = {
      overview: {
        title: articleData.title,
        source: articleData.source,
        sentiment: sentimentAnalysis.sentimentAnalysis.overallSentiment,
        confidence: sentimentAnalysis.sentimentAnalysis.confidence,
        keyTakeaways: []
      },
      politicalImpact: {
        partiesAffected: sentimentAnalysis.identifiedEntities.politicalParties.length,
        highImpactParties: this.getHighImpactEntities(sentimentAnalysis, 'politicalParties'),
        keyPoliticalIssues: this.extractKeyIssues(sentimentAnalysis, 'politicalParties')
      },
      internationalImpact: {
        countriesAffected: sentimentAnalysis.identifiedEntities.countries.length,
        highImpactCountries: this.getHighImpactEntities(sentimentAnalysis, 'countries'),
        keyInternationalIssues: this.extractKeyIssues(sentimentAnalysis, 'countries')
      },
      socialImpact: {
        populationGroupsAffected: sentimentAnalysis.identifiedEntities.populationGroups.length,
        highImpactGroups: this.getHighImpactEntities(sentimentAnalysis, 'populationGroups'),
        keySocialIssues: this.extractKeyIssues(sentimentAnalysis, 'populationGroups')
      },
      recommendations: {
        forReaders: this.generateReaderRecommendations(sentimentAnalysis),
        forPolicymakers: this.generatePolicyRecommendations(sentimentAnalysis),
        forMedia: this.generateMediaRecommendations(sentimentAnalysis)
      },
      analysisQuality: {
        confidence: sentimentAnalysis.sentimentAnalysis.confidence,
        limitations: sentimentAnalysis.summary.limitations,
        validationIssues: sentimentAnalysis.metadata.validation
      }
    };

    // Generate key takeaways
    summary.overview.keyTakeaways = this.generateKeyTakeaways(sentimentAnalysis);

    return summary;
  }

  /**
   * Gets high impact entities from analysis
   * @param {Object} sentimentAnalysis - Sentiment analysis results
   * @param {string} entityType - Type of entity (politicalParties, countries, populationGroups)
   * @returns {Array} - High impact entities
   */
  getHighImpactEntities(sentimentAnalysis, entityType) {
    const highImpact = [];
    
    if (entityType === 'politicalParties') {
      for (const [partyName, analysis] of Object.entries(sentimentAnalysis.sentimentAnalysis.politicalParties)) {
        if (analysis.impact === 'high') {
          highImpact.push({
            name: partyName,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence
          });
        }
      }
    } else if (entityType === 'countries') {
      for (const [countryCode, analysis] of Object.entries(sentimentAnalysis.sentimentAnalysis.countries)) {
        if (analysis.impact === 'high') {
          highImpact.push({
            code: countryCode,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence
          });
        }
      }
    } else if (entityType === 'populationGroups') {
      for (const [groupName, analysis] of Object.entries(sentimentAnalysis.sentimentAnalysis.populationGroups)) {
        if (analysis.impact === 'high') {
          highImpact.push({
            name: groupName,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence
          });
        }
      }
    }
    
    return highImpact;
  }

  /**
   * Extracts key issues from analysis
   * @param {Object} sentimentAnalysis - Sentiment analysis results
   * @param {string} entityType - Type of entity
   * @returns {Array} - Key issues
   */
  extractKeyIssues(sentimentAnalysis, entityType) {
    const issues = [];
    
    if (entityType === 'politicalParties') {
      for (const [partyName, analysis] of Object.entries(sentimentAnalysis.sentimentAnalysis.politicalParties)) {
        if (analysis.keyIssues && analysis.keyIssues.length > 0) {
          issues.push({
            party: partyName,
            issues: analysis.keyIssues
          });
        }
      }
    } else if (entityType === 'countries') {
      for (const [countryCode, analysis] of Object.entries(sentimentAnalysis.sentimentAnalysis.countries)) {
        if (analysis.keyIssues && analysis.keyIssues.length > 0) {
          issues.push({
            country: countryCode,
            issues: analysis.keyIssues
          });
        }
      }
    } else if (entityType === 'populationGroups') {
      for (const [groupName, analysis] of Object.entries(sentimentAnalysis.sentimentAnalysis.populationGroups)) {
        if (analysis.keyIssues && analysis.keyIssues.length > 0) {
          issues.push({
            group: groupName,
            issues: analysis.keyIssues
          });
        }
      }
    }
    
    return issues;
  }

  /**
   * Generates key takeaways from the analysis
   * @param {Object} sentimentAnalysis - Sentiment analysis results
   * @returns {Array} - Key takeaways
   */
  generateKeyTakeaways(sentimentAnalysis) {
    const takeaways = [];
    
    // Overall sentiment takeaway
    takeaways.push({
      type: 'overall',
      message: `This article has an overall ${sentimentAnalysis.sentimentAnalysis.overallSentiment} sentiment`,
      importance: 'high'
    });
    
    // Political takeaways
    const highImpactParties = this.getHighImpactEntities(sentimentAnalysis, 'politicalParties');
    if (highImpactParties.length > 0) {
      takeaways.push({
        type: 'political',
        message: `${highImpactParties.length} political parties are significantly affected by this article`,
        details: highImpactParties,
        importance: 'high'
      });
    }
    
    // International takeaways
    const highImpactCountries = this.getHighImpactEntities(sentimentAnalysis, 'countries');
    if (highImpactCountries.length > 0) {
      takeaways.push({
        type: 'international',
        message: `${highImpactCountries.length} countries are significantly affected by this article`,
        details: highImpactCountries,
        importance: 'high'
      });
    }
    
    // Social takeaways
    const highImpactGroups = this.getHighImpactEntities(sentimentAnalysis, 'populationGroups');
    if (highImpactGroups.length > 0) {
      takeaways.push({
        type: 'social',
        message: `${highImpactGroups.length} population groups are significantly affected by this article`,
        details: highImpactGroups,
        importance: 'medium'
      });
    }
    
    return takeaways;
  }

  /**
   * Generates recommendations for readers
   * @param {Object} sentimentAnalysis - Sentiment analysis results
   * @returns {Array} - Reader recommendations
   */
  generateReaderRecommendations(sentimentAnalysis) {
    const recommendations = [];
    
    // Based on overall sentiment
    if (sentimentAnalysis.sentimentAnalysis.overallSentiment === 'negative') {
      recommendations.push({
        type: 'caution',
        message: 'This article contains negative sentiment - consider multiple sources for balanced perspective',
        priority: 'high'
      });
    }
    
    // Based on political impact
    const highImpactParties = this.getHighImpactEntities(sentimentAnalysis, 'politicalParties');
    if (highImpactParties.length > 0) {
      recommendations.push({
        type: 'political',
        message: 'This article has significant political implications - monitor follow-up coverage',
        priority: 'high'
      });
    }
    
    // Based on international impact
    const highImpactCountries = this.getHighImpactEntities(sentimentAnalysis, 'countries');
    if (highImpactCountries.length > 0) {
      recommendations.push({
        type: 'international',
        message: 'This article has international implications - consider global context',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Generates recommendations for policymakers
   * @param {Object} sentimentAnalysis - Sentiment analysis results
   * @returns {Array} - Policy recommendations
   */
  generatePolicyRecommendations(sentimentAnalysis) {
    const recommendations = [];
    
    // High impact political parties
    const highImpactParties = this.getHighImpactEntities(sentimentAnalysis, 'politicalParties');
    if (highImpactParties.length > 0) {
      recommendations.push({
        type: 'political',
        message: 'Monitor political reactions and prepare for potential policy implications',
        priority: 'high',
        affectedParties: highImpactParties
      });
    }
    
    // High impact population groups
    const highImpactGroups = this.getHighImpactEntities(sentimentAnalysis, 'populationGroups');
    if (highImpactGroups.length > 0) {
      recommendations.push({
        type: 'social',
        message: 'Consider social impact and potential policy responses for affected groups',
        priority: 'medium',
        affectedGroups: highImpactGroups
      });
    }
    
    // International implications
    const highImpactCountries = this.getHighImpactEntities(sentimentAnalysis, 'countries');
    if (highImpactCountries.length > 0) {
      recommendations.push({
        type: 'international',
        message: 'Monitor international relations and diplomatic implications',
        priority: 'high',
        affectedCountries: highImpactCountries
      });
    }
    
    return recommendations;
  }

  /**
   * Generates recommendations for media
   * @param {Object} sentimentAnalysis - Sentiment analysis results
   * @returns {Array} - Media recommendations
   */
  generateMediaRecommendations(sentimentAnalysis) {
    const recommendations = [];
    
    // Coverage recommendations
    const highImpactParties = this.getHighImpactEntities(sentimentAnalysis, 'politicalParties');
    if (highImpactParties.length > 0) {
      recommendations.push({
        type: 'coverage',
        message: 'Consider follow-up coverage on political reactions and implications',
        priority: 'high'
      });
    }
    
    // Balance recommendations
    if (sentimentAnalysis.sentimentAnalysis.overallSentiment === 'negative') {
      recommendations.push({
        type: 'balance',
        message: 'Consider balanced coverage with opposing viewpoints',
        priority: 'medium'
      });
    }
    
    // Context recommendations
    const highImpactCountries = this.getHighImpactEntities(sentimentAnalysis, 'countries');
    if (highImpactCountries.length > 0) {
      recommendations.push({
        type: 'context',
        message: 'Provide international context and background information',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Calculates reading time for content
   * @param {string} content - The content to calculate reading time for
   * @returns {number} - Reading time in minutes
   */
  calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Performs batch analysis of multiple articles
   * @param {Array} urls - Array of URLs to analyze
   * @param {Object} options - Analysis options
   * @returns {Array} - Array of analysis results
   */
  async analyzeMultipleArticles(urls, options = {}) {
    try {
      console.log(`Starting batch analysis of ${urls.length} articles`);
      
      const results = [];
      const errors = [];
      
      for (const url of urls) {
        try {
          const analysis = await this.analyzeArticleFromUrl(url, options);
          results.push(analysis);
        } catch (error) {
          console.error(`Error analyzing ${url}:`, error);
          errors.push({ url, error: error.message });
        }
      }
      
      return {
        successful: results,
        failed: errors,
        summary: {
          total: urls.length,
          successful: results.length,
          failed: errors.length
        }
      };
      
    } catch (error) {
      console.error('Error in batch analysis:', error);
      throw error;
    }
  }

  /**
   * Gets analysis statistics
   * @param {Array} analyses - Array of analysis results
   * @returns {Object} - Analysis statistics
   */
  getAnalysisStatistics(analyses) {
    const stats = {
      totalArticles: analyses.length,
      sentimentDistribution: {
        positive: 0,
        negative: 0,
        neutral: 0
      },
      entityDistribution: {
        politicalParties: 0,
        countries: 0,
        populationGroups: 0
      },
      averageConfidence: 0,
      highImpactArticles: 0
    };
    
    let totalConfidence = 0;
    
    for (const analysis of analyses) {
      // Sentiment distribution
      const sentiment = analysis.sentimentAnalysis.sentimentAnalysis.overallSentiment;
      stats.sentimentDistribution[sentiment]++;
      
      // Entity distribution
      stats.entityDistribution.politicalParties += analysis.sentimentAnalysis.identifiedEntities.politicalParties.length;
      stats.entityDistribution.countries += analysis.sentimentAnalysis.identifiedEntities.countries.length;
      stats.entityDistribution.populationGroups += analysis.sentimentAnalysis.identifiedEntities.populationGroups.length;
      
      // Confidence
      totalConfidence += analysis.sentimentAnalysis.sentimentAnalysis.confidence;
      
      // High impact articles
      const hasHighImpact = this.hasHighImpactEntities(analysis);
      if (hasHighImpact) {
        stats.highImpactArticles++;
      }
    }
    
    stats.averageConfidence = totalConfidence / analyses.length;
    
    return stats;
  }

  /**
   * Checks if an analysis has high impact entities
   * @param {Object} analysis - Analysis result
   * @returns {boolean} - Whether the analysis has high impact entities
   */
  hasHighImpactEntities(analysis) {
    const politicalParties = this.getHighImpactEntities(analysis.sentimentAnalysis, 'politicalParties');
    const countries = this.getHighImpactEntities(analysis.sentimentAnalysis, 'countries');
    const populationGroups = this.getHighImpactEntities(analysis.sentimentAnalysis, 'populationGroups');
    
    return politicalParties.length > 0 || countries.length > 0 || populationGroups.length > 0;
  }
}

export default ComprehensiveArticleAnalysisService; 