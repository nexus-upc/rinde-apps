import { isApiUrl } from './api-config';

describe('API request boundary', () => {
  it('accepts only the configured origin and path segment', () => {
    expect(
      isApiUrl('https://api.rinde.test/gateway/api/v1/users', 'https://api.rinde.test/gateway'),
    ).toBe(true);
    expect(
      isApiUrl('https://api.rinde.test/gateway-other/users', 'https://api.rinde.test/gateway'),
    ).toBe(false);
    expect(isApiUrl('https://api.rinde.test.evil.test/users', 'https://api.rinde.test')).toBe(
      false,
    );
    expect(isApiUrl('https://api.rinde.test@evil.test/users', 'https://api.rinde.test')).toBe(
      false,
    );
  });
  it('does not treat frontend assets or another port as API calls', () => {
    expect(isApiUrl('/assets/logo.svg', 'http://localhost:8000')).toBe(false);
    expect(isApiUrl('http://localhost:4200/api/v1/users', 'http://localhost:8000')).toBe(false);
  });
});
