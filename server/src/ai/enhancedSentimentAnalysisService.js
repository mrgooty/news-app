import PartyIdentificationService from './partyIdentificationService.js';

class EnhancedSentimentAnalysisService {
  constructor() {
    this.partyIdentificationService = new PartyIdentificationService();
  }

  /**
   * Performs comprehensive multi-dimensional sentiment analysis on an article
   * @param {string} articleText - The full text content of the article
   * @param {Object} articleMetadata - Additional metadata about the article
   * @returns {Object} - Comprehensive sentiment analysis results
   */
  async analyzeSentiment(articleText, articleMetadata = {}) {
    try {
      console.log('Starting enhanced sentiment analysis');
      
      // Step 1: Identify all parties, countries, and population groups
      const identifiedEntities = await this.partyIdentificationService.identifyParties(articleText);
      
      // Step 2: Validate the identified entities
      const validation = this.partyIdentificationService.validateEntities(identifiedEntities);
      
      // Step 3: Perform comprehensive sentiment analysis
      const sentimentResults = await this.performComprehensiveAnalysis(
        articleText, 
        identifiedEntities, 
        articleMetadata
      );
      
      // Step 4: Generate detailed breakdowns
      const detailedAnalysis = await this.generateDetailedBreakdowns(
        articleText,
        identifiedEntities,
        sentimentResults
      );
      
      // Step 5: Create summary and recommendations
      const summary = this.createAnalysisSummary(
        identifiedEntities,
        sentimentResults,
        detailedAnalysis,
        validation
      );
      
      const results = {
        metadata: {
          timestamp: new Date().toISOString(),
          articleLength: articleText.length,
          entitiesIdentified: {
            politicalParties: identifiedEntities.politicalParties.length,
            countries: identifiedEntities.countries.length,
            populationGroups: identifiedEntities.populationGroups.length
          },
          validation: validation
        },
        identifiedEntities: identifiedEntities,
        sentimentAnalysis: sentimentResults,
        detailedBreakdowns: detailedAnalysis,
        summary: summary
      };
      
      console.log('Enhanced sentiment analysis completed successfully');
      return results;
      
    } catch (error) {
      console.error('Error in enhanced sentiment analysis:', error);
      throw error;
    }
  }

  /**
   * Performs comprehensive sentiment analysis using AI
   * @param {string} articleText - The article text
   * @param {Object} identifiedEntities - Identified parties, countries, and groups
   * @param {Object} articleMetadata - Article metadata
   * @returns {Object} - Sentiment analysis results
   */
  async performComprehensiveAnalysis(articleText, identifiedEntities, articleMetadata) {
    try {
      // Create customized prompt based on identified entities
      const customizedPrompt = this.partyIdentificationService.createCustomizedPrompt(
        identifiedEntities.analysisParameters
      );
      
      // For now, we'll simulate AI analysis - in production, this would call an AI service
      const analysis = await this.simulateAIAnalysis(articleText, customizedPrompt, identifiedEntities);
      
      return analysis;
    } catch (error) {
      console.error('Error in comprehensive analysis:', error);
      throw error;
    }
  }

  /**
   * Simulates AI analysis (replace with actual AI service call)
   * @param {string} articleText - The article text
   * @param {string} prompt - The analysis prompt
   * @param {Object} identifiedEntities - Identified entities
   * @returns {Object} - Analysis results
   */
  async simulateAIAnalysis(articleText, prompt, identifiedEntities) {
    // This is a simulation - in production, this would call OpenAI, Claude, or another AI service
    const analysis = {
      politicalParties: {},
      countries: {},
      populationGroups: {},
      overallSentiment: 'neutral',
      confidence: 0.85,
      keyInsights: []
    };

    // Analyze political parties
    for (const party of identifiedEntities.politicalParties) {
      analysis.politicalParties[party.name] = {
        sentiment: this.analyzePartySentiment(articleText, party),
        impact: this.assessPoliticalImpact(articleText, party),
        confidence: this.calculateSentimentConfidence(party),
        keyIssues: this.extractKeyIssues(articleText, party.keywords)
      };
    }

    // Analyze countries
    for (const country of identifiedEntities.countries) {
      analysis.countries[country.code] = {
        sentiment: this.analyzeCountrySentiment(articleText, country),
        impact: this.assessCountryImpact(articleText, country),
        confidence: this.calculateSentimentConfidence(country),
        keyIssues: this.extractKeyIssues(articleText, country.keywords)
      };
    }

    // Analyze population groups
    for (const group of identifiedEntities.populationGroups) {
      analysis.populationGroups[group.name] = {
        sentiment: this.analyzeGroupSentiment(articleText, group),
        impact: this.assessGroupImpact(articleText, group),
        confidence: this.calculateSentimentConfidence(group),
        keyIssues: this.extractKeyIssues(articleText, group.keywords)
      };
    }

    // Calculate overall sentiment
    analysis.overallSentiment = this.calculateOverallSentiment(analysis);
    analysis.keyInsights = this.generateKeyInsights(analysis, identifiedEntities);

    return analysis;
  }

  /**
   * Analyzes sentiment for a specific political party
   * @param {string} articleText - The article text
   * @param {Object} party - Party information
   * @returns {string} - Sentiment (positive/negative/neutral)
   */
  analyzePartySentiment(articleText, party) {
    const text = articleText.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    // Count positive mentions
    for (const keyword of party.sentimentCriteria.positive) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        positiveScore += matches.length;
      }
    }

    // Count negative mentions
    for (const keyword of party.sentimentCriteria.negative) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        negativeScore += matches.length;
      }
    }

    // Count neutral mentions
    for (const keyword of party.sentimentCriteria.neutral) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        neutralScore += matches.length;
      }
    }

    // Determine sentiment
    if (positiveScore > negativeScore && positiveScore > neutralScore) {
      return 'positive';
    } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * Analyzes sentiment for a specific country
   * @param {string} articleText - The article text
   * @param {Object} country - Country information
   * @returns {string} - Sentiment (positive/negative/neutral)
   */
  analyzeCountrySentiment(articleText, country) {
    return this.analyzePartySentiment(articleText, country);
  }

  /**
   * Analyzes sentiment for a specific population group
   * @param {string} articleText - The article text
   * @param {Object} group - Group information
   * @returns {string} - Sentiment (positive/negative/neutral)
   */
  analyzeGroupSentiment(articleText, group) {
    return this.analyzePartySentiment(articleText, group);
  }

  /**
   * Assesses political impact of the article on a party
   * @param {string} articleText - The article text
   * @param {Object} party - Party information
   * @returns {string} - Impact level (high/medium/low)
   */
  assessPoliticalImpact(articleText, party) {
    const mentionCount = party.mentions.length;
    if (mentionCount > 5) return 'high';
    if (mentionCount > 2) return 'medium';
    return 'low';
  }

  /**
   * Assesses impact on a country
   * @param {string} articleText - The article text
   * @param {Object} country - Country information
   * @returns {string} - Impact level (high/medium/low)
   */
  assessCountryImpact(articleText, country) {
    return this.assessPoliticalImpact(articleText, country);
  }

  /**
   * Assesses impact on a population group
   * @param {string} articleText - The article text
   * @param {Object} group - Group information
   * @returns {string} - Impact level (high/medium/low)
   */
  assessGroupImpact(articleText, group) {
    return this.assessPoliticalImpact(articleText, group);
  }

  /**
   * Calculates confidence score for sentiment analysis
   * @param {Object} entity - Entity information
   * @returns {number} - Confidence score (0-1)
   */
  calculateSentimentConfidence(entity) {
    const mentionCount = entity.mentions.length;
    const contextQuality = entity.context ? entity.context.length : 0;
    
    let confidence = Math.min(mentionCount * 0.1, 0.8);
    confidence += Math.min(contextQuality * 0.05, 0.2);
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Extracts key issues related to an entity
   * @param {string} articleText - The article text
   * @param {Array} keywords - Keywords to search for
   * @returns {Array} - Key issues found
   */
  extractKeyIssues(articleText, keywords) {
    const issues = [];
    const text = articleText.toLowerCase();
    
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        issues.push({
          keyword: keyword,
          frequency: matches.length,
          context: this.extractIssueContext(articleText, keyword)
        });
      }
    }
    
    return issues;
  }

  /**
   * Extracts context around key issues
   * @param {string} articleText - The article text
   * @param {string} keyword - The keyword to find context for
   * @returns {Array} - Context strings
   */
  extractIssueContext(articleText, keyword) {
    const contexts = [];
    const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    let match;
    
    while ((match = regex.exec(articleText)) !== null) {
      const start = Math.max(0, match.index - 100);
      const end = Math.min(articleText.length, match.index + keyword.length + 100);
      contexts.push(articleText.substring(start, end).trim());
    }
    
    return contexts;
  }

  /**
   * Calculates overall sentiment from all analyses
   * @param {Object} analysis - Analysis results
   * @returns {string} - Overall sentiment
   */
  calculateOverallSentiment(analysis) {
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    // Count sentiments from political parties
    for (const partyAnalysis of Object.values(analysis.politicalParties)) {
      if (partyAnalysis.sentiment === 'positive') positiveCount++;
      else if (partyAnalysis.sentiment === 'negative') negativeCount++;
      else neutralCount++;
    }

    // Count sentiments from countries
    for (const countryAnalysis of Object.values(analysis.countries)) {
      if (countryAnalysis.sentiment === 'positive') positiveCount++;
      else if (countryAnalysis.sentiment === 'negative') negativeCount++;
      else neutralCount++;
    }

    // Count sentiments from population groups
    for (const groupAnalysis of Object.values(analysis.populationGroups)) {
      if (groupAnalysis.sentiment === 'positive') positiveCount++;
      else if (groupAnalysis.sentiment === 'negative') negativeCount++;
      else neutralCount++;
    }

    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      return 'positive';
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * Generates key insights from the analysis
   * @param {Object} analysis - Analysis results
   * @param {Object} identifiedEntities - Identified entities
   * @returns {Array} - Key insights
   */
  generateKeyInsights(analysis, identifiedEntities) {
    const insights = [];

    // Political insights
    for (const [partyName, partyAnalysis] of Object.entries(analysis.politicalParties)) {
      if (partyAnalysis.impact === 'high') {
        insights.push({
          type: 'political',
          entity: partyName,
          insight: `${partyName} is significantly affected by this article with ${partyAnalysis.sentiment} sentiment`,
          confidence: partyAnalysis.confidence
        });
      }
    }

    // Country insights
    for (const [countryCode, countryAnalysis] of Object.entries(analysis.countries)) {
      if (countryAnalysis.impact === 'high') {
        insights.push({
          type: 'country',
          entity: countryCode,
          insight: `${countryCode.toUpperCase()} is significantly affected by this article with ${countryAnalysis.sentiment} sentiment`,
          confidence: countryAnalysis.confidence
        });
      }
    }

    // Population group insights
    for (const [groupName, groupAnalysis] of Object.entries(analysis.populationGroups)) {
      if (groupAnalysis.impact === 'high') {
        insights.push({
          type: 'population',
          entity: groupName,
          insight: `${groupName} population is significantly affected by this article with ${groupAnalysis.sentiment} sentiment`,
          confidence: groupAnalysis.confidence
        });
      }
    }

    return insights;
  }

  /**
   * Generates detailed breakdowns of the analysis
   * @param {string} articleText - The article text
   * @param {Object} identifiedEntities - Identified entities
   * @param {Object} sentimentResults - Sentiment analysis results
   * @returns {Object} - Detailed breakdowns
   */
  async generateDetailedBreakdowns(articleText, identifiedEntities, sentimentResults) {
    const breakdowns = {
      politicalBreakdown: this.createPoliticalBreakdown(identifiedEntities.politicalParties, sentimentResults.politicalParties),
      countryBreakdown: this.createCountryBreakdown(identifiedEntities.countries, sentimentResults.countries),
      populationBreakdown: this.createPopulationBreakdown(identifiedEntities.populationGroups, sentimentResults.populationGroups),
      crossAnalysis: this.createCrossAnalysis(identifiedEntities, sentimentResults)
    };

    return breakdowns;
  }

  /**
   * Creates political breakdown
   * @param {Array} parties - Identified parties
   * @param {Object} partyResults - Party analysis results
   * @returns {Object} - Political breakdown
   */
  createPoliticalBreakdown(parties, partyResults) {
    const breakdown = {
      totalParties: parties.length,
      byCountry: {},
      bySentiment: {
        positive: [],
        negative: [],
        neutral: []
      },
      highImpact: [],
      keyIssues: []
    };

    for (const party of parties) {
      const result = partyResults[party.name];
      if (!result) continue;

      // Group by country
      if (!breakdown.byCountry[party.country]) {
        breakdown.byCountry[party.country] = [];
      }
      breakdown.byCountry[party.country].push({
        name: party.name,
        sentiment: result.sentiment,
        impact: result.impact,
        confidence: result.confidence
      });

      // Group by sentiment
      breakdown.bySentiment[result.sentiment].push({
        name: party.name,
        country: party.country,
        impact: result.impact,
        confidence: result.confidence
      });

      // High impact parties
      if (result.impact === 'high') {
        breakdown.highImpact.push({
          name: party.name,
          country: party.country,
          sentiment: result.sentiment,
          confidence: result.confidence
        });
      }

      // Key issues
      if (result.keyIssues && result.keyIssues.length > 0) {
        breakdown.keyIssues.push({
          party: party.name,
          issues: result.keyIssues
        });
      }
    }

    return breakdown;
  }

  /**
   * Creates country breakdown
   * @param {Array} countries - Identified countries
   * @param {Object} countryResults - Country analysis results
   * @returns {Object} - Country breakdown
   */
  createCountryBreakdown(countries, countryResults) {
    const breakdown = {
      totalCountries: countries.length,
      bySentiment: {
        positive: [],
        negative: [],
        neutral: []
      },
      highImpact: [],
      keyIssues: []
    };

    for (const country of countries) {
      const result = countryResults[country.code];
      if (!result) continue;

      // Group by sentiment
      breakdown.bySentiment[result.sentiment].push({
        code: country.code,
        impact: result.impact,
        confidence: result.confidence
      });

      // High impact countries
      if (result.impact === 'high') {
        breakdown.highImpact.push({
          code: country.code,
          sentiment: result.sentiment,
          confidence: result.confidence
        });
      }

      // Key issues
      if (result.keyIssues && result.keyIssues.length > 0) {
        breakdown.keyIssues.push({
          country: country.code,
          issues: result.keyIssues
        });
      }
    }

    return breakdown;
  }

  /**
   * Creates population breakdown
   * @param {Array} groups - Identified population groups
   * @param {Object} groupResults - Group analysis results
   * @returns {Object} - Population breakdown
   */
  createPopulationBreakdown(groups, groupResults) {
    const breakdown = {
      totalGroups: groups.length,
      byCategory: {
        economic: [],
        social: []
      },
      bySentiment: {
        positive: [],
        negative: [],
        neutral: []
      },
      highImpact: [],
      keyIssues: []
    };

    for (const group of groups) {
      const result = groupResults[group.name];
      if (!result) continue;

      // Group by category
      breakdown.byCategory[group.category].push({
        name: group.name,
        sentiment: result.sentiment,
        impact: result.impact,
        confidence: result.confidence
      });

      // Group by sentiment
      breakdown.bySentiment[result.sentiment].push({
        name: group.name,
        category: group.category,
        impact: result.impact,
        confidence: result.confidence
      });

      // High impact groups
      if (result.impact === 'high') {
        breakdown.highImpact.push({
          name: group.name,
          category: group.category,
          sentiment: result.sentiment,
          confidence: result.confidence
        });
      }

      // Key issues
      if (result.keyIssues && result.keyIssues.length > 0) {
        breakdown.keyIssues.push({
          group: group.name,
          issues: result.keyIssues
        });
      }
    }

    return breakdown;
  }

  /**
   * Creates cross-analysis between different entity types
   * @param {Object} identifiedEntities - Identified entities
   * @param {Object} sentimentResults - Sentiment analysis results
   * @returns {Object} - Cross-analysis results
   */
  createCrossAnalysis(identifiedEntities, sentimentResults) {
    const crossAnalysis = {
      politicalCountryOverlap: [],
      politicalPopulationOverlap: [],
      countryPopulationOverlap: [],
      conflictingSentiments: [],
      alignedInterests: []
    };

    // Find overlapping entities and analyze conflicts/alignments
    // This is a simplified version - in production, this would be more sophisticated
    
    return crossAnalysis;
  }

  /**
   * Creates a comprehensive analysis summary
   * @param {Object} identifiedEntities - Identified entities
   * @param {Object} sentimentResults - Sentiment analysis results
   * @param {Object} detailedAnalysis - Detailed breakdowns
   * @param {Object} validation - Validation results
   * @returns {Object} - Analysis summary
   */
  createAnalysisSummary(identifiedEntities, sentimentResults, detailedAnalysis, validation) {
    const summary = {
      overallSentiment: sentimentResults.overallSentiment,
      confidence: sentimentResults.confidence,
      keyFindings: [],
      recommendations: [],
      limitations: [],
      metadata: {
        entitiesAnalyzed: {
          politicalParties: identifiedEntities.politicalParties.length,
          countries: identifiedEntities.countries.length,
          populationGroups: identifiedEntities.populationGroups.length
        },
        validationIssues: validation
      }
    };

    // Generate key findings
    summary.keyFindings = this.generateKeyFindings(sentimentResults, detailedAnalysis);
    
    // Generate recommendations
    summary.recommendations = this.generateRecommendations(sentimentResults, detailedAnalysis);
    
    // Identify limitations
    summary.limitations = this.identifyLimitations(validation, sentimentResults);

    return summary;
  }

  /**
   * Generates key findings from the analysis
   * @param {Object} sentimentResults - Sentiment analysis results
   * @param {Object} detailedAnalysis - Detailed breakdowns
   * @returns {Array} - Key findings
   */
  generateKeyFindings(sentimentResults, detailedAnalysis) {
    const findings = [];

    // Overall sentiment finding
    findings.push({
      type: 'overall',
      finding: `The article has an overall ${sentimentResults.overallSentiment} sentiment`,
      confidence: sentimentResults.confidence
    });

    // High impact findings
    if (detailedAnalysis.politicalBreakdown.highImpact.length > 0) {
      findings.push({
        type: 'political_impact',
        finding: `${detailedAnalysis.politicalBreakdown.highImpact.length} political parties are significantly affected`,
        details: detailedAnalysis.politicalBreakdown.highImpact
      });
    }

    if (detailedAnalysis.countryBreakdown.highImpact.length > 0) {
      findings.push({
        type: 'country_impact',
        finding: `${detailedAnalysis.countryBreakdown.highImpact.length} countries are significantly affected`,
        details: detailedAnalysis.countryBreakdown.highImpact
      });
    }

    if (detailedAnalysis.populationBreakdown.highImpact.length > 0) {
      findings.push({
        type: 'population_impact',
        finding: `${detailedAnalysis.populationBreakdown.highImpact.length} population groups are significantly affected`,
        details: detailedAnalysis.populationBreakdown.highImpact
      });
    }

    return findings;
  }

  /**
   * Generates recommendations based on the analysis
   * @param {Object} sentimentResults - Sentiment analysis results
   * @param {Object} detailedAnalysis - Detailed breakdowns
   * @returns {Array} - Recommendations
   */
  generateRecommendations(sentimentResults, detailedAnalysis) {
    const recommendations = [];

    // Political recommendations
    if (detailedAnalysis.politicalBreakdown.highImpact.length > 0) {
      recommendations.push({
        type: 'political',
        recommendation: 'Monitor political reactions and potential policy implications',
        priority: 'high'
      });
    }

    // Country recommendations
    if (detailedAnalysis.countryBreakdown.highImpact.length > 0) {
      recommendations.push({
        type: 'international',
        recommendation: 'Monitor international relations and diplomatic implications',
        priority: 'high'
      });
    }

    // Population recommendations
    if (detailedAnalysis.populationBreakdown.highImpact.length > 0) {
      recommendations.push({
        type: 'social',
        recommendation: 'Consider social impact and potential policy responses',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Identifies limitations of the analysis
   * @param {Object} validation - Validation results
   * @param {Object} sentimentResults - Sentiment analysis results
   * @returns {Array} - Limitations
   */
  identifyLimitations(validation, sentimentResults) {
    const limitations = [];

    // Validation issues
    for (const [entityType, entityValidation] of Object.entries(validation)) {
      if (entityValidation.issues.length > 0) {
        limitations.push({
          type: entityType,
          issues: entityValidation.issues
        });
      }
    }

    // Confidence limitations
    if (sentimentResults.confidence < 0.7) {
      limitations.push({
        type: 'confidence',
        issue: 'Low confidence in sentiment analysis results'
      });
    }

    return limitations;
  }
}

export default EnhancedSentimentAnalysisService; 