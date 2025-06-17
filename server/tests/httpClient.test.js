const axios = require('axios');
jest.mock('axios');
const HttpClient = require('../src/utils/httpClient');
const config = require('../src/config/config');

config.newsApis.newsapi.apiKey = 'test';
config.cache.ttl = 100000;

const mockAxios = { get: jest.fn().mockResolvedValue({ data: { ok: true } }) };
axios.create.mockReturnValue(mockAxios);

describe('HttpClient', () => {
  beforeEach(() => {
    mockAxios.get.mockClear();
    const c = new HttpClient('newsapi');
    c.clearCache();
  });

  test('getCacheKey creates consistent key', () => {
    const client = new HttpClient('newsapi');
    const key = client.getCacheKey('/path', { a: 1 });
    expect(key).toBe('newsapi:/path:{"a":1}');
  });

  test('getApiKeyParamName returns correct param', () => {
    expect(new HttpClient('gnews').getApiKeyParamName()).toBe('token');
    expect(new HttpClient('mediastack').getApiKeyParamName()).toBe('access_key');
    expect(new HttpClient('newsapi').getApiKeyParamName()).toBe('apiKey');
  });

  test('caches GET responses', async () => {
    const client = new HttpClient('newsapi');
    const res1 = await client.get('/top', { q: 'a' });
    const res2 = await client.get('/top', { q: 'a' });
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(res1).toEqual({ ok: true });
    expect(res2).toEqual({ ok: true });
  });

  test('clearCache removes cached data', async () => {
    const client = new HttpClient('newsapi');
    await client.get('/top', { q: 'a' });
    client.clearCache();
    await client.get('/top', { q: 'a' });
    expect(mockAxios.get).toHaveBeenCalledTimes(2);
  });

  test('throws for unknown api', () => {
    expect(() => new HttpClient('unknown')).toThrow('API configuration not found');
  });

  test('handleError logs response error', () => {
    const client = new HttpClient('newsapi');
    const error = { response: { status: 500, statusText: 'ERR', data: {} } };
    console.error = jest.fn();
    client.handleError(error, '/x');
    expect(console.error).toHaveBeenCalled();
  });

  test("get handles request errors", async () => {
    const client = new HttpClient("newsapi");
    mockAxios.get.mockRejectedValue({ request: "err" });
    console.error = jest.fn();
    await expect(client.get("/err")).rejects.toBeDefined();
    expect(console.error).toHaveBeenCalled();
  });
});
