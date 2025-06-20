const articleAnalyzerService = require('./articleAnalyzerService');
const summarizationService = require('./summarizationService');
const log = require('../utils/logger')('ScraperSummarizerTest');

async function testScrapeAndSummarize(url) {
  if (!url) {
    log('ERROR: Please provide a URL to test. Usage: npm run test:scrape -- <URL>');
    process.exit(1);
  }

  log('--- Initializing services for end-to-end test ---');
  // Wait for the summarization model to be fully loaded and ready
  await summarizationService.initializing;
  log('--- Summarization service ready ---');


  log(`--- Starting scrape & summarize test for: ${url} ---`);

  try {
    const result = await articleAnalyzerService.summarizeArticle({ url });
    log('--- Test Complete ---');
    console.log('\n--- Summarization Result ---\n');
    console.log(result.summary);
    console.log('\n--- End of Result ---\n');
  } catch (error) {
    log('ERROR: Test failed:', error);
  } finally {
    log('--- Test finished ---');
    // Force exit if any lingering processes from puppeteer prevent clean exit
    process.exit(0);
  }
}

// Get URL from command line arguments
const urlToTest = process.argv[2];
testScrapeAndSummarize(urlToTest); 