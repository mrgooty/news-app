# Comprehensive Sentiment Analysis Guide

## Overview

The Comprehensive Sentiment Analysis System is a sophisticated AI-powered tool that analyzes news articles from multiple dimensions to provide detailed insights about political parties, countries, and population groups affected by the content. This system goes beyond simple positive/negative sentiment to provide nuanced analysis of how different entities are impacted by news coverage.

## Key Features

### 1. Multi-Dimensional Analysis
- **Political Parties**: Analyzes sentiment towards Democratic, Republican, and other political parties
- **Countries**: Assesses impact on US, UK, China, Russia, India, and other nations
- **Population Groups**: Evaluates effects on economic groups (wealthy, middle class, low-income) and social groups (minorities, women, LGBTQ+, elderly, youth)

### 2. Intelligent Entity Identification
- Automatically identifies all relevant parties, countries, and population groups mentioned in articles
- Uses keyword matching and context analysis to ensure accurate identification
- Provides confidence scores for entity identification

### 3. Comprehensive Sentiment Assessment
- Analyzes sentiment from multiple angles (positive, negative, neutral)
- Provides impact assessment (high, medium, low)
- Generates confidence scores for each analysis
- Extracts key issues and supporting evidence

### 4. Actionable Insights
- Generates recommendations for readers, policymakers, and media
- Identifies winners and losers from news coverage
- Provides policy implications and social impact assessments
- Creates cross-analysis between different entity types

## API Endpoints

### 1. Single Article Analysis
**Endpoint**: `POST /api/analyze-sentiment`

**Request Body**:
```json
{
  "url": "https://example.com/article-url",
  "options": {
    "includeRawText": true,
    "detailedBreakdown": true
  }
}
```

**Alternative Request Body** (for text analysis):
```json
{
  "articleText": "Full article text content...",
  "articleMetadata": {
    "title": "Article Title",
    "author": "Author Name",
    "source": "News Source",
    "publishedDate": "2024-01-01"
  },
  "options": {
    "detailedBreakdown": true
  }
}
```

**Response Structure**:
```json
{
  "metadata": {
    "url": "https://example.com/article-url",
    "analysisTimestamp": "2024-01-01T12:00:00Z",
    "analysisVersion": "1.0"
  },
  "articleData": {
    "title": "Article Title",
    "author": "Author Name",
    "source": "News Source",
    "contentLength": 5000,
    "wordCount": 800,
    "readingTime": 4
  },
  "sentimentAnalysis": {
    "identifiedEntities": {
      "politicalParties": [...],
      "countries": [...],
      "populationGroups": [...]
    },
    "sentimentAnalysis": {
      "politicalParties": {
        "democratic": {
          "sentiment": "positive",
          "impact": "high",
          "confidence": 0.85,
          "keyIssues": [...]
        }
      },
      "countries": {...},
      "populationGroups": {...},
      "overallSentiment": "positive",
      "confidence": 0.82
    },
    "detailedBreakdowns": {...},
    "summary": {...}
  },
  "summary": {
    "overview": {
      "sentiment": "positive",
      "confidence": 0.82,
      "keyTakeaways": [...]
    },
    "politicalImpact": {...},
    "internationalImpact": {...},
    "socialImpact": {...},
    "recommendations": {...}
  }
}
```

### 2. Batch Analysis
**Endpoint**: `POST /api/analyze-sentiment-batch`

**Request Body**:
```json
{
  "urls": [
    "https://example.com/article1",
    "https://example.com/article2",
    "https://example.com/article3"
  ],
  "options": {
    "detailedBreakdown": true
  }
}
```

**Response Structure**:
```json
{
  "successful": [...],
  "failed": [...],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  },
  "statistics": {
    "totalArticles": 2,
    "sentimentDistribution": {
      "positive": 1,
      "negative": 0,
      "neutral": 1
    },
    "entityDistribution": {
      "politicalParties": 4,
      "countries": 2,
      "populationGroups": 3
    },
    "averageConfidence": 0.78,
    "highImpactArticles": 1
  }
}
```

### 3. Party Identification (Debug)
**Endpoint**: `POST /api/identify-parties`

**Request Body**:
```json
{
  "articleText": "Article text content..."
}
```

## Configuration

### AI Parameters
The system uses configurable AI parameters located in `server/src/config/aiParameters.js`:

```javascript
sentimentAnalysis: {
  politicalAnalysis: {
    parties: {
      us: {
        democratic: {
          keywords: ["democrats", "democratic party", "biden", "harris"],
          sentimentCriteria: {
            positive: ["support", "benefit", "victory"],
            negative: ["oppose", "criticize", "defeat"],
            neutral: ["discuss", "consider", "review"]
          }
        }
      }
    }
  }
}
```

### Adding New Entities
To add new political parties, countries, or population groups:

1. **Political Parties**: Add to `aiParameters.sentimentAnalysis.politicalAnalysis.parties`
2. **Countries**: Add to `aiParameters.sentimentAnalysis.countryAnalysis.countries`
3. **Population Groups**: Add to `aiParameters.sentimentAnalysis.populationAnalysis.demographics`

## Usage Examples

### Example 1: Analyzing a Political Article
```javascript
const response = await fetch('/api/analyze-sentiment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://news.example.com/political-article',
    options: { detailedBreakdown: true }
  })
});

const analysis = await response.json();
console.log('Political parties affected:', analysis.sentimentAnalysis.identifiedEntities.politicalParties);
console.log('Overall sentiment:', analysis.summary.overview.sentiment);
```

### Example 2: Batch Analysis for Research
```javascript
const response = await fetch('/api/analyze-sentiment-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    urls: [
      'https://news.example.com/article1',
      'https://news.example.com/article2',
      'https://news.example.com/article3'
    ]
  })
});

const batchResults = await response.json();
console.log('Successfully analyzed:', batchResults.summary.successful);
console.log('Statistics:', batchResults.statistics);
```

### Example 3: Text Analysis
```javascript
const response = await fetch('/api/analyze-sentiment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    articleText: 'Your article text here...',
    articleMetadata: {
      title: 'Article Title',
      source: 'News Source'
    }
  })
});
```

## Analysis Output Interpretation

### Sentiment Scores
- **Positive**: Article portrays entity favorably
- **Negative**: Article portrays entity unfavorably
- **Neutral**: Article discusses entity without clear bias

### Impact Levels
- **High**: Entity is significantly affected or prominently featured
- **Medium**: Entity is moderately affected
- **Low**: Entity is minimally affected

### Confidence Scores
- **0.8-1.0**: High confidence in analysis
- **0.6-0.79**: Medium confidence
- **0.0-0.59**: Low confidence

### Key Insights
The system provides:
- **Political Impact**: How political parties are affected
- **International Impact**: How countries are affected
- **Social Impact**: How population groups are affected
- **Recommendations**: Actionable insights for different stakeholders

## Best Practices

### 1. URL Analysis
- Ensure URLs are accessible and contain full article content
- Use reputable news sources for better analysis quality
- Consider article length (minimum 100 words recommended)

### 2. Text Analysis
- Provide complete article text for best results
- Include metadata when available (title, author, source)
- Clean text of formatting artifacts when possible

### 3. Batch Processing
- Limit batch requests to 10 URLs maximum
- Monitor for failed analyses and retry if needed
- Use statistics to understand overall trends

### 4. Error Handling
- Check for specific error messages in responses
- Handle rate limiting and timeout scenarios
- Validate input data before sending requests

## Limitations and Considerations

### 1. Content Quality
- Analysis quality depends on article content quality
- Very short articles may provide limited insights
- Articles with minimal entity mentions may have low confidence scores

### 2. Language Support
- Currently optimized for English content
- Non-English articles may have reduced accuracy
- Consider language detection for future enhancements

### 3. Bias Considerations
- System aims for objective analysis but may reflect training data biases
- Always review results critically
- Use multiple sources for comprehensive understanding

### 4. Performance
- Analysis time varies with article length and complexity
- Batch processing may take several minutes for large requests
- Consider implementing caching for repeated analyses

## Future Enhancements

### Planned Features
1. **Real-time Analysis**: WebSocket support for live analysis
2. **Historical Tracking**: Trend analysis over time
3. **Custom Entity Training**: User-defined entity recognition
4. **Multi-language Support**: Analysis in multiple languages
5. **Advanced Visualizations**: Interactive charts and graphs

### Integration Opportunities
1. **News Aggregation**: Integrate with existing news services
2. **User Preferences**: Personalized analysis based on user interests
3. **Alert System**: Notifications for high-impact articles
4. **API Rate Limiting**: Implement usage-based limits
5. **Caching Layer**: Improve performance with result caching

## Support and Troubleshooting

### Common Issues
1. **"Failed to extract article content"**: URL may be inaccessible or contain no readable content
2. **"Invalid URL"**: Ensure URL is properly formatted and accessible
3. **Low confidence scores**: Article may be too short or lack relevant entities
4. **Timeout errors**: Large articles or batch requests may exceed time limits

### Debugging
- Use the `/api/identify-parties` endpoint to test entity identification
- Check article content quality and length
- Verify URL accessibility and content extraction
- Review error logs for detailed information

### Getting Help
- Check server logs for detailed error information
- Validate input data format and content
- Test with known good articles first
- Contact development team for persistent issues

---

This comprehensive sentiment analysis system provides powerful insights into news coverage from multiple perspectives, helping users understand the broader implications of news articles beyond simple positive/negative sentiment. 