// server/src/config/aiParameters.js

const aiParameters = {
  summarization: {
    length: {
      standard: {
        minSentences: 2,
        maxSentences: 3,
        prompt: "Provide a concise, high-level overview of the article's main topic in 2-3 sentences."
      },
      detailed: {
        minSentences: 5,
        maxSentences: 7,
        prompt: "Offer a comprehensive understanding of the article, covering key points and context in 5-7 sentences."
      },
      bulletPoints: {
        count: 5,
        prompt: "Extract the 5 most critical facts, findings, or outcomes as bullet points."
      }
    },
    styleAndTone: {
      default: {
        prompt: "Maintain a strictly objective, neutral, and professional tone. The summary must be factual and avoid any speculation, opinion, or sensationalism."
      },
      opinion: {
        prompt: "The summary must reflect the author's viewpoint but clearly attribute it. Use phrases like 'According to the author' or 'The article suggests'."
      }
    }
  },
  
  sentimentAnalysis: {
    // Multi-dimensional sentiment analysis parameters
    politicalAnalysis: {
      parties: {
        us: {
          democratic: {
            keywords: ["democrats", "democratic party", "biden", "harris", "liberal", "progressive", "left-wing"],
            sentimentCriteria: {
              positive: ["support", "benefit", "victory", "success", "approval", "endorsement"],
              negative: ["oppose", "criticize", "defeat", "failure", "rejection", "condemnation"],
              neutral: ["discuss", "consider", "review", "examine", "analyze"]
            }
          },
          republican: {
            keywords: ["republicans", "republican party", "trump", "conservative", "right-wing", "gop"],
            sentimentCriteria: {
              positive: ["support", "benefit", "victory", "success", "approval", "endorsement"],
              negative: ["oppose", "criticize", "defeat", "failure", "rejection", "condemnation"],
              neutral: ["discuss", "consider", "review", "examine", "analyze"]
            }
          },
          independent: {
            keywords: ["independent", "third party", "moderate", "centrist", "non-partisan"],
            sentimentCriteria: {
              positive: ["support", "benefit", "victory", "success", "approval", "endorsement"],
              negative: ["oppose", "criticize", "defeat", "failure", "rejection", "condemnation"],
              neutral: ["discuss", "consider", "review", "examine", "analyze"]
            }
          }
        },
        global: {
          uk: {
            conservative: {
              keywords: ["conservative party", "tories", "boris johnson", "rishi sunak"],
              sentimentCriteria: {
                positive: ["support", "benefit", "victory", "success", "approval"],
                negative: ["oppose", "criticize", "defeat", "failure", "rejection"],
                neutral: ["discuss", "consider", "review", "examine"]
              }
            },
            labour: {
              keywords: ["labour party", "keir starmer", "left-wing"],
              sentimentCriteria: {
                positive: ["support", "benefit", "victory", "success", "approval"],
                negative: ["oppose", "criticize", "defeat", "failure", "rejection"],
                neutral: ["discuss", "consider", "review", "examine"]
              }
            }
          },
          eu: {
            european_parliament: {
              keywords: ["european parliament", "eu commission", "european union"],
              sentimentCriteria: {
                positive: ["support", "benefit", "victory", "success", "approval"],
                negative: ["oppose", "criticize", "defeat", "failure", "rejection"],
                neutral: ["discuss", "consider", "review", "examine"]
              }
            }
          }
        }
      },
      prompt: `Analyze the political sentiment of this article by identifying all political parties, leaders, and movements mentioned. For each entity, determine:
1. The sentiment (positive/negative/neutral) towards that party/leader
2. The specific issues or policies discussed
3. The potential impact on their political standing
4. The context and tone of the discussion
Provide a structured analysis with confidence scores for each assessment.`
    },
    
    countryAnalysis: {
      countries: {
        us: {
          keywords: ["united states", "usa", "america", "american", "washington", "dc"],
          sentimentCriteria: {
            positive: ["economic growth", "job creation", "innovation", "diplomatic success", "security"],
            negative: ["economic decline", "job loss", "conflict", "diplomatic failure", "insecurity"],
            neutral: ["policy discussion", "analysis", "review", "consideration"]
          }
        },
        uk: {
          keywords: ["united kingdom", "britain", "british", "london", "england", "scotland", "wales"],
          sentimentCriteria: {
            positive: ["economic growth", "job creation", "innovation", "diplomatic success"],
            negative: ["economic decline", "job loss", "conflict", "diplomatic failure"],
            neutral: ["policy discussion", "analysis", "review"]
          }
        },
        china: {
          keywords: ["china", "chinese", "beijing", "xi jinping"],
          sentimentCriteria: {
            positive: ["economic growth", "innovation", "diplomatic success", "development"],
            negative: ["economic decline", "conflict", "diplomatic failure", "tension"],
            neutral: ["policy discussion", "analysis", "review"]
          }
        },
        russia: {
          keywords: ["russia", "russian", "moscow", "putin"],
          sentimentCriteria: {
            positive: ["economic growth", "diplomatic success", "development"],
            negative: ["economic decline", "conflict", "diplomatic failure", "sanctions"],
            neutral: ["policy discussion", "analysis", "review"]
          }
        },
        india: {
          keywords: ["india", "indian", "new delhi", "modi"],
          sentimentCriteria: {
            positive: ["economic growth", "development", "innovation", "diplomatic success"],
            negative: ["economic decline", "conflict", "diplomatic failure", "poverty"],
            neutral: ["policy discussion", "analysis", "review"]
          }
        }
      },
      prompt: `Analyze the sentiment towards countries mentioned in this article. For each country:
1. Identify the specific issues, policies, or events discussed
2. Determine the sentiment (positive/negative/neutral) towards that country
3. Assess the potential economic, political, or social impact
4. Consider the international relations implications
Provide a structured analysis with confidence scores and supporting evidence.`
    },
    
    populationAnalysis: {
      demographics: {
        economic: {
          wealthy: {
            keywords: ["wealthy", "rich", "high-income", "affluent", "millionaires", "billionaires"],
            sentimentCriteria: {
              positive: ["benefit", "advantage", "opportunity", "growth"],
              negative: ["tax increase", "regulation", "restriction", "penalty"],
              neutral: ["discussion", "analysis", "consideration"]
            }
          },
          middle_class: {
            keywords: ["middle class", "working class", "average income", "families"],
            sentimentCriteria: {
              positive: ["benefit", "support", "relief", "opportunity"],
              negative: ["burden", "hardship", "struggle", "cost"],
              neutral: ["discussion", "analysis", "consideration"]
            }
          },
          low_income: {
            keywords: ["poor", "low-income", "poverty", "unemployed", "homeless"],
            sentimentCriteria: {
              positive: ["support", "assistance", "relief", "opportunity"],
              negative: ["neglect", "hardship", "struggle", "burden"],
              neutral: ["discussion", "analysis", "consideration"]
            }
          }
        },
        social: {
          minorities: {
            keywords: ["minorities", "people of color", "african american", "hispanic", "asian", "indigenous"],
            sentimentCriteria: {
              positive: ["support", "rights", "equality", "opportunity"],
              negative: ["discrimination", "inequality", "oppression", "exclusion"],
              neutral: ["discussion", "analysis", "consideration"]
            }
          },
          women: {
            keywords: ["women", "female", "gender", "feminist"],
            sentimentCriteria: {
              positive: ["support", "rights", "equality", "opportunity"],
              negative: ["discrimination", "inequality", "oppression", "exclusion"],
              neutral: ["discussion", "analysis", "consideration"]
            }
          },
          lgbtq: {
            keywords: ["lgbtq", "lgbt", "gay", "lesbian", "transgender", "queer"],
            sentimentCriteria: {
              positive: ["support", "rights", "equality", "acceptance"],
              negative: ["discrimination", "inequality", "oppression", "exclusion"],
              neutral: ["discussion", "analysis", "consideration"]
            }
          },
          elderly: {
            keywords: ["elderly", "seniors", "retired", "aging", "pensioners"],
            sentimentCriteria: {
              positive: ["support", "care", "benefits", "respect"],
              negative: ["neglect", "burden", "isolation", "hardship"],
              neutral: ["discussion", "analysis", "consideration"]
            }
          },
          youth: {
            keywords: ["youth", "young people", "students", "millennials", "gen z"],
            sentimentCriteria: {
              positive: ["opportunity", "education", "support", "future"],
              negative: ["struggle", "debt", "unemployment", "hardship"],
              neutral: ["discussion", "analysis", "consideration"]
            }
          }
        }
      },
      prompt: `Analyze the impact on different population groups mentioned in this article. For each demographic:
1. Identify the specific groups affected
2. Determine the sentiment (positive/negative/neutral) towards their interests
3. Assess the potential economic, social, or political impact on these groups
4. Consider the fairness and equity implications
Provide a structured analysis with confidence scores and specific examples from the text.`
    },
    
    comprehensiveAnalysis: {
      prompt: `Provide a comprehensive multi-dimensional sentiment analysis of this article covering:

1. POLITICAL PARTIES & LEADERS:
   - Identify all political parties, leaders, and movements mentioned
   - Analyze sentiment towards each (positive/negative/neutral)
   - Assess potential political impact and implications

2. COUNTRIES & REGIONS:
   - Identify all countries and regions discussed
   - Analyze sentiment towards each country's interests
   - Assess economic, political, and diplomatic implications

3. POPULATION GROUPS:
   - Identify all demographic groups affected
   - Analyze sentiment towards their interests and well-being
   - Assess fairness, equity, and social impact

4. OVERALL ASSESSMENT:
   - Summary of winners and losers
   - Potential policy implications
   - Broader societal impact

For each analysis, provide:
- Confidence score (0-100%)
- Supporting evidence from the text
- Potential implications and consequences
- Context and nuance considerations

Format the response as a structured JSON object with clear sections for each dimension.`
    }
  },
  
  contentDistribution: {
    variety: {
      minCategories: 3,
      maxCategories: 8,
      balanceThreshold: 0.2
    },
    relevance: {
      minScore: 0.7,
      maxScore: 0.95
    }
  }
};

export default aiParameters; 