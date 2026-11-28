import { loadRuntimeConfig, parseApiBaseUrl } from './runtime-config';

function response(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 404, json: () => Promise.resolve(body) } as Response;
}

describe('runtime config', () => {
  it('returns the configured API URL without trailing slashes', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ apiBaseUrl: 'https://gateway.example.test/' }));
    await expect(loadRuntimeConfig(fetcher)).resolves.toBe('https://gateway.example.test');
    expect(fetcher).toHaveBeenCalledWith('config.json', { cache: 'no-store' });
  });
  it('returns null when config.json is missing', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({}, false));
    await expect(loadRuntimeConfig(fetcher)).resolves.toBeNull();
  });
  it('returns null when the request fails or the body is not JSON', async () => {
    const network = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('red caída'));
    const notJson = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new SyntaxError('no JSON')),
    } as Response);
    await expect(loadRuntimeConfig(network)).resolves.toBeNull();
    await expect(loadRuntimeConfig(notJson)).resolves.toBeNull();
  });
  it('rejects configurations without a valid http or https apiBaseUrl', () => {
    expect(parseApiBaseUrl({})).toBeNull();
    expect(parseApiBaseUrl({ apiBaseUrl: 42 })).toBeNull();
    expect(parseApiBaseUrl({ apiBaseUrl: 'no es una URL' })).toBeNull();
    expect(parseApiBaseUrl({ apiBaseUrl: 'ftp://gateway.example.test' })).toBeNull();
    expect(parseApiBaseUrl(null)).toBeNull();
  });
});
