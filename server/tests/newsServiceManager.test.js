const NewsServiceManager = require('../src/services/newsServiceManager');

const manager = new NewsServiceManager();
manager.availableServices = { newsapi: true, gnews: false, guardian: true };

function article(url, title='t') { return { url, title } }

describe('NewsServiceManager utility methods', () => {
  test('deduplicateArticles removes duplicate URLs', () => {
    const articles = [article('a'), article('b'), article('a')];
    const deduped = manager.deduplicateArticles(articles);
    expect(deduped).toHaveLength(2);
    expect(deduped.map(a => a.url)).toEqual(['a','b']);
  });

  test('getAvailableServices respects preference', () => {
    const services = manager.getAvailableServices(['guardian','newsapi']);
    expect(services).toEqual(['guardian','newsapi']);
  });

  test('getSources filters unavailable', () => {
    const sources = manager.getSources();
    expect(sources.map(s => s.id)).toEqual(['newsapi','guardian']);
  });

  test('getArticlesByCategory uses available services', async () => {
    const svc = {
      getArticlesByCategory: jest.fn().mockResolvedValue([article('u1')])
    };
    manager.services = { newsapi: svc };
    const res = await manager.getArticlesByCategory('tech', 'us', 5);
    expect(res.articles).toHaveLength(1);
    expect(svc.getArticlesByCategory).toHaveBeenCalled();
  });

  test('searchArticles aggregates errors', async () => {
    const svc = { searchArticles: jest.fn().mockRejectedValue(new Error('fail')) };
    manager.services = { newsapi: svc };
    manager.availableServices = { newsapi: true };
    const res = await manager.searchArticles('q');
    expect(res.errors).toHaveLength(1);
  });

  test('getTopHeadlines merges results', async () => {
    const svc1 = { getTopHeadlines: jest.fn().mockResolvedValue([article('u1')]) };
    const svc2 = { getTopHeadlines: jest.fn().mockResolvedValue([article('u2')]) };
    manager.services = { newsapi: svc1, guardian: svc2 };
    manager.availableServices = { newsapi: true, guardian: true };
    const res = await manager.getTopHeadlines('tech', 'us', 2);
    expect(res.articles).toHaveLength(2);
  });

  test('fallbacks to sample data', async () => {
    const svc = { getArticlesByCategory: jest.fn().mockResolvedValue([]) };
    manager.services = { newsapi: svc };
    manager.availableServices = { newsapi: true };
    const res = await manager.getArticlesByCategory('tech', 'us', 1);
    expect(res.articles.length).toBeGreaterThan(0);
  });

  test('searchArticles merges articles', async () => {
    const svc = { searchArticles: jest.fn().mockResolvedValue([article('u1'), article('u2')]) };
    manager.services = { newsapi: svc };
    manager.availableServices = { newsapi: true };
    const res = await manager.searchArticles('q', null, null, 2);
    expect(res.articles).toHaveLength(2);
  });

  test('getTopHeadlines falls back to sample', async () => {
    const svc = { getTopHeadlines: jest.fn().mockResolvedValue([]) };
    manager.services = { newsapi: svc };
    manager.availableServices = { newsapi: true };
    const res = await manager.getTopHeadlines('tech', 'us', 1);
    expect(res.articles.length).toBeGreaterThan(0);
  });

  test('checkServicesAvailability updates flags', async () => {
    const svc1 = { isAvailable: jest.fn().mockResolvedValue(true) };
    const svc2 = { isAvailable: jest.fn().mockResolvedValue(false) };
    manager.services = { a: svc1, b: svc2 };
    const cfg = require('../src/config/config');
    cfg.newsApis.a = { apiKey: 'k' };
    cfg.newsApis.b = { apiKey: 'k' };
    await manager.checkServicesAvailability();
    expect(manager.availableServices.a).toBe(true);
    expect(manager.availableServices.b).toBe(false);
  });
});
