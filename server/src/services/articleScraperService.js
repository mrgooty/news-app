const puppeteer = require('puppeteer');
const log = require('../utils/logger')('ArticleScraperService');

// Common selectors for cookie consent banners
const COOKIE_SELECTORS = [
  '[id*="consent"]',
  '[class*="consent"]',
  '[id*="cookie"]',
  '[class*="cookie"]',
  'button[aria-label*="accept" i]',
  'button:has-text("Accept")',
  'button:has-text("Agree")',
  'button:has-text("I understand")',
];

class ArticleScraperService {
  async scrape(url) {
    let browser;
    log(`Initializing scraper for URL: ${url}`);
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // Set a realistic User-Agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
      );

      // Optimize by blocking non-essential resources
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Handle cookie consent banners
      for (const selector of COOKIE_SELECTORS) {
        try {
            await page.click(selector, { timeout: 1000 });
            log(`Clicked a cookie consent element matching: ${selector}`);
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
            break; // Exit loop once a button is clicked
        } catch (error) {
            // Selector not found, continue to the next
        }
      }

      const articleContent = await page.evaluate(() => {
        // 1. Remove common noise elements
        document.querySelectorAll('script, style, nav, footer, header, aside, form, [class*="ad"], [id*="ad"], [class*="sidebar"], [id*="sidebar"]').forEach(el => el.remove());

        // 2. Find the element with the most paragraph text
        let bestElement = null;
        let maxTextLength = 0;

        document.querySelectorAll('body, main, article, section, div').forEach(el => {
            const pTags = el.querySelectorAll('p');
            if (pTags.length > 0) {
                const textLength = Array.from(pTags).reduce((sum, p) => sum + (p.textContent || '').trim().length, 0);

                // Check if this element is a better candidate
                if (textLength > maxTextLength) {
                    // Avoid selecting an element that contains a better element
                    const containsBetter = bestElement && el.contains(bestElement);
                    if (!containsBetter) {
                        maxTextLength = textLength;
                        bestElement = el;
                    }
                }
            }
        });
        
        const textSource = bestElement || document.body;

        // 3. Extract title and content from the best candidate
        const title = (textSource.querySelector('h1')?.textContent || document.title).trim();
        const paragraphs = Array.from(textSource.querySelectorAll('p'));
        const content = paragraphs.map(p => p.textContent.trim()).filter(Boolean).join('\n\n');

        return { title, content };
      });

      if (!articleContent.content || articleContent.content.length < 200) {
        log(`WARN: Scraped text for ${url} seems insufficient. It might be a paywall or requires JavaScript rendering wait.`);
        return 'Could not extract a meaningful article. The page may be behind a paywall, require a login, or have a complex structure that prevented analysis.';
      }

      log(`Successfully scraped and extracted content from ${url}`);
      // Return the main content, prepended by its title for better summarization context
      return `${articleContent.title}\n\n${articleContent.content}`;

    } catch (error) {
      log(`ERROR: Error scraping article from ${url}:`, error.message);
      if (error.name === 'TimeoutError') {
          return 'Failed to scrape article: The page took too long to load and timed out.';
      }
      return `Failed to scrape article. The site may be blocking automated access or is unavailable.`;
    } finally {
      if (browser) {
        log('Closing browser instance.');
        await browser.close();
      }
    }
  }
}

module.exports = new ArticleScraperService(); 