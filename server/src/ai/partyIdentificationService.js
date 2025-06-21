import aiParameters from '../config/aiParameters.js';

class PartyIdentificationService {
  constructor() {
    this.aiParams = aiParameters;
  }

  /**
   * Identifies all parties, countries, and population groups mentioned in an article
   * @param {string} articleText - The full text content of the article
   * @returns {Object} - Structured data of identified entities and their analysis parameters
   */
  async identifyParties(articleText) {
    try {
      console.log('Starting party identification analysis');
      
      const identifiedEntities = {
        politicalParties: [],
        countries: [],
        populationGroups: [],
        analysisParameters: {}
      };

      // Identify political parties
      identifiedEntities.politicalParties = this.identifyPoliticalParties(articleText);
      
      // Identify countries
      identifiedEntities.countries = this.identifyCountries(articleText);
      
      // Identify population groups
      identifiedEntities.populationGroups = this.identifyPopulationGroups(articleText);
      
      // Generate analysis parameters based on identified entities
      identifiedEntities.analysisParameters = this.generateAnalysisParameters(identifiedEntities);
      
      console.log(`Identified ${identifiedEntities.politicalParties.length} political parties, ${identifiedEntities.countries.length} countries, ${identifiedEntities.populationGroups.length} population groups`);
      
      return identifiedEntities;
    } catch (error) {
      console.error('Error in party identification:', error);
      throw error;
    }
  }

  /**
   * Identifies political parties mentioned in the article
   * @param {string} articleText - The article text to analyze
   * @returns {Array} - Array of identified political parties with metadata
   */
  identifyPoliticalParties(articleText) {
    const parties = [];
    const text = articleText.toLowerCase();
    
    // US Political Parties
    const usParties = this.aiParams.sentimentAnalysis.politicalAnalysis.parties.us;
    for (const [partyName, partyData] of Object.entries(usParties)) {
      const mentions = this.findMentions(text, partyData.keywords);
      if (mentions.length > 0) {
        parties.push({
          name: partyName,
          country: 'US',
          type: 'political_party',
          keywords: partyData.keywords,
          mentions: mentions,
          sentimentCriteria: partyData.sentimentCriteria,
          context: this.extractContext(articleText, mentions)
        });
      }
    }
    
    // Global Political Parties
    const globalParties = this.aiParams.sentimentAnalysis.politicalAnalysis.parties.global;
    for (const [country, countryParties] of Object.entries(globalParties)) {
      for (const [partyName, partyData] of Object.entries(countryParties)) {
        const mentions = this.findMentions(text, partyData.keywords);
        if (mentions.length > 0) {
          parties.push({
            name: partyName,
            country: country.toUpperCase(),
            type: 'political_party',
            keywords: partyData.keywords,
            mentions: mentions,
            sentimentCriteria: partyData.sentimentCriteria,
            context: this.extractContext(articleText, mentions)
          });
        }
      }
    }
    
    return parties;
  }

  /**
   * Identifies countries mentioned in the article
   * @param {string} articleText - The article text to analyze
   * @returns {Array} - Array of identified countries with metadata
   */
  identifyCountries(articleText) {
    const countries = [];
    const text = articleText.toLowerCase();
    
    const countryData = this.aiParams.sentimentAnalysis.countryAnalysis.countries;
    for (const [countryCode, countryInfo] of Object.entries(countryData)) {
      const mentions = this.findMentions(text, countryInfo.keywords);
      if (mentions.length > 0) {
        countries.push({
          code: countryCode,
          keywords: countryInfo.keywords,
          mentions: mentions,
          sentimentCriteria: countryInfo.sentimentCriteria,
          context: this.extractContext(articleText, mentions)
        });
      }
    }
    
    return countries;
  }

  /**
   * Identifies population groups mentioned in the article
   * @param {string} articleText - The article text to analyze
   * @returns {Array} - Array of identified population groups with metadata
   */
  identifyPopulationGroups(articleText) {
    const groups = [];
    const text = articleText.toLowerCase();
    
    const demographics = this.aiParams.sentimentAnalysis.populationAnalysis.demographics;
    
    // Economic groups
    for (const [groupName, groupData] of Object.entries(demographics.economic)) {
      const mentions = this.findMentions(text, groupData.keywords);
      if (mentions.length > 0) {
        groups.push({
          name: groupName,
          category: 'economic',
          keywords: groupData.keywords,
          mentions: mentions,
          sentimentCriteria: groupData.sentimentCriteria,
          context: this.extractContext(articleText, mentions)
        });
      }
    }
    
    // Social groups
    for (const [groupName, groupData] of Object.entries(demographics.social)) {
      const mentions = this.findMentions(text, groupData.keywords);
      if (mentions.length > 0) {
        groups.push({
          name: groupName,
          category: 'social',
          keywords: groupData.keywords,
          mentions: mentions,
          sentimentCriteria: groupData.sentimentCriteria,
          context: this.extractContext(articleText, mentions)
        });
      }
    }
    
    return groups;
  }

  /**
   * Finds mentions of keywords in the text
   * @param {string} text - The text to search in
   * @param {Array} keywords - Array of keywords to search for
   * @returns {Array} - Array of found mentions with positions
   */
  findMentions(text, keywords) {
    const mentions = [];
    
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        mentions.push({
          keyword: keyword,
          position: match.index,
          context: text.substring(Math.max(0, match.index - 50), match.index + keyword.length + 50)
        });
      }
    }
    
    return mentions;
  }

  /**
   * Extracts context around mentions
   * @param {string} articleText - The full article text
   * @param {Array} mentions - Array of mention objects
   * @returns {Array} - Array of context strings
   */
  extractContext(articleText, mentions) {
    return mentions.map(mention => {
      const start = Math.max(0, mention.position - 100);
      const end = Math.min(articleText.length, mention.position + mention.keyword.length + 100);
      return articleText.substring(start, end).trim();
    });
  }

  /**
   * Generates analysis parameters based on identified entities
   * @param {Object} identifiedEntities - Object containing identified parties, countries, and groups
   * @returns {Object} - Analysis parameters for sentiment analysis
   */
  generateAnalysisParameters(identifiedEntities) {
    const params = {
      politicalAnalysis: {
        enabled: identifiedEntities.politicalParties.length > 0,
        parties: identifiedEntities.politicalParties,
        prompt: this.aiParams.sentimentAnalysis.politicalAnalysis.prompt
      },
      countryAnalysis: {
        enabled: identifiedEntities.countries.length > 0,
        countries: identifiedEntities.countries,
        prompt: this.aiParams.sentimentAnalysis.countryAnalysis.prompt
      },
      populationAnalysis: {
        enabled: identifiedEntities.populationGroups.length > 0,
        groups: identifiedEntities.populationGroups,
        prompt: this.aiParams.sentimentAnalysis.populationAnalysis.prompt
      },
      comprehensiveAnalysis: {
        enabled: true,
        prompt: this.aiParams.sentimentAnalysis.comprehensiveAnalysis.prompt,
        entities: {
          politicalParties: identifiedEntities.politicalParties.map(p => p.name),
          countries: identifiedEntities.countries.map(c => c.code),
          populationGroups: identifiedEntities.populationGroups.map(g => g.name)
        }
      }
    };

    return params;
  }

  /**
   * Creates a customized prompt for sentiment analysis based on identified entities
   * @param {Object} analysisParams - Analysis parameters from generateAnalysisParameters
   * @returns {string} - Customized prompt for the AI model
   */
  createCustomizedPrompt(analysisParams) {
    let prompt = "Analyze the sentiment of this article with focus on the following entities:\n\n";
    
    if (analysisParams.politicalAnalysis.enabled) {
      prompt += "POLITICAL PARTIES:\n";
      analysisParams.politicalAnalysis.parties.forEach(party => {
        prompt += `- ${party.name} (${party.country})\n`;
      });
      prompt += "\n";
    }
    
    if (analysisParams.countryAnalysis.enabled) {
      prompt += "COUNTRIES:\n";
      analysisParams.countryAnalysis.countries.forEach(country => {
        prompt += `- ${country.code.toUpperCase()}\n`;
      });
      prompt += "\n";
    }
    
    if (analysisParams.populationAnalysis.enabled) {
      prompt += "POPULATION GROUPS:\n";
      analysisParams.populationAnalysis.groups.forEach(group => {
        prompt += `- ${group.name} (${group.category})\n`;
      });
      prompt += "\n";
    }
    
    prompt += analysisParams.comprehensiveAnalysis.prompt;
    
    return prompt;
  }

  /**
   * Validates the identified entities and provides confidence scores
   * @param {Object} identifiedEntities - The identified entities
   * @returns {Object} - Validation results with confidence scores
   */
  validateEntities(identifiedEntities) {
    const validation = {
      politicalParties: {
        count: identifiedEntities.politicalParties.length,
        confidence: this.calculateConfidence(identifiedEntities.politicalParties),
        issues: []
      },
      countries: {
        count: identifiedEntities.countries.length,
        confidence: this.calculateConfidence(identifiedEntities.countries),
        issues: []
      },
      populationGroups: {
        count: identifiedEntities.populationGroups.length,
        confidence: this.calculateConfidence(identifiedEntities.populationGroups),
        issues: []
      }
    };

    // Check for potential false positives
    if (identifiedEntities.politicalParties.length > 10) {
      validation.politicalParties.issues.push("High number of parties detected - potential false positives");
    }
    
    if (identifiedEntities.countries.length > 15) {
      validation.countries.issues.push("High number of countries detected - potential false positives");
    }

    return validation;
  }

  /**
   * Calculates confidence score based on mention frequency and context
   * @param {Array} entities - Array of entity objects
   * @returns {number} - Confidence score (0-100)
   */
  calculateConfidence(entities) {
    if (entities.length === 0) return 0;
    
    let totalConfidence = 0;
    for (const entity of entities) {
      // Base confidence on number of mentions
      let confidence = Math.min(entity.mentions.length * 20, 80);
      
      // Boost confidence if context is substantial
      if (entity.context && entity.context.length > 0) {
        const avgContextLength = entity.context.reduce((sum, ctx) => sum + ctx.length, 0) / entity.context.length;
        if (avgContextLength > 100) {
          confidence += 10;
        }
      }
      
      totalConfidence += confidence;
    }
    
    return Math.min(totalConfidence / entities.length, 100);
  }
}

export default PartyIdentificationService; 