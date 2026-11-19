import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const API = 'https://api.test';

/** Loads the client with the hosted AI configured for this build. */
async function loadClient() {
  vi.stubEnv('VITE_AI_API_URL', `${API}/`);
  vi.resetModules();
  return import('./hosted-client');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const session = (token = 'tok-1') => ({
  token,
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  remainingToday: 25,
  dailyLimit: 25,
});

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllEnvs());

describe('hosted AI client', () => {
  it('gets a session, then sends only the conversation', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(session()))
      .mockResolvedValueOnce(json({ reply: 'Psalm 23 is for you.', remainingToday: 24, dailyLimit: 25 }));
    vi.stubGlobal('fetch', fetchMock);
    const { hostedMentorReply, getLastQuota } = await loadClient();

    const reply = await hostedMentorReply([
      { role: 'system', content: 'client prompt' },
      { role: 'user', content: 'I am anxious' },
    ]);

    expect(reply).toBe('Psalm 23 is for you.');
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/api/v1/ai/session`);
    const sessionBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sessionBody.deviceId).toMatch(/^[0-9a-f-]{36}$/);

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(`${API}/api/v1/ai/mentor`);
    expect(init.headers.Authorization).toBe('Bearer tok-1');
    expect(JSON.parse(init.body)).toEqual({ messages: [{ role: 'user', content: 'I am anxious' }] });
    expect(getLastQuota()).toEqual({ remainingToday: 24, dailyLimit: 25 });
  });

  it('reuses the session and keeps the same device id', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(session()))
      .mockImplementation(async () => json({ reply: 'ok', remainingToday: 1, dailyLimit: 25 }));
    vi.stubGlobal('fetch', fetchMock);
    const { hostedMentorReply, getDeviceId } = await loadClient();

    await hostedMentorReply([{ role: 'user', content: 'a' }]);
    await hostedMentorReply([{ role: 'user', content: 'b' }]);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getDeviceId()).toBe(getDeviceId());
  });

  it('starts a new session once when the old one is rejected', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(session('old')))
      .mockResolvedValueOnce(json({ error: { code: 'session_invalid', message: 'expired' } }, 401))
      .mockResolvedValueOnce(json(session('new')))
      .mockResolvedValueOnce(json({ reply: 'ok', remainingToday: 3, dailyLimit: 25 }));
    vi.stubGlobal('fetch', fetchMock);
    const { hostedMentorReply } = await loadClient();

    await expect(hostedMentorReply([{ role: 'user', content: 'hi' }])).resolves.toBe('ok');
    expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe('Bearer new');
  });

  it.each([
    ['daily_limit', 429, 'daily_limit'],
    ['rate_limited', 429, 'rate_limited'],
    ['resting', 503, 'unavailable'],
    ['busy', 503, 'unavailable'],
    ['refused', 422, 'refused'],
  ])('maps the server error %s to %s', async (serverCode, status, appCode) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(json(session()))
        .mockResolvedValueOnce(json({ error: { code: serverCode, message: 'Server says no.' } }, status)),
    );
    const { hostedMentorReply } = await loadClient();

    // Modules are reloaded per test, so compare fields rather than the class.
    await expect(hostedMentorReply([{ role: 'user', content: 'hi' }])).rejects.toMatchObject({
      name: 'AiError',
      code: appCode,
      message: 'Server says no.',
    });
  });

  it('reports a network failure as unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { hostedMentorReply } = await loadClient();

    await expect(hostedMentorReply([{ role: 'user', content: 'hi' }])).rejects.toMatchObject({
      code: 'unreachable',
    });
  });

  it('is off when the build has no API address', async () => {
    vi.stubEnv('VITE_AI_API_URL', '');
    vi.resetModules();
    const { isHostedAiConfigured } = await import('./hosted-client');
    expect(isHostedAiConfigured()).toBe(false);
  });
});

describe('AI settings with the hosted service', () => {
  it('turns AI on by default with the hosted provider', async () => {
    await loadClient();
    const { getAiSettings } = await import('./ai-settings');
    expect(getAiSettings()).toMatchObject({ enabled: true, provider: 'hosted' });
  });

  it('keeps people who already used Ollama on Ollama', async () => {
    localStorage.setItem('biblequest-ai-settings-v1', JSON.stringify({ enabled: true, model: 'gemma3' }));
    await loadClient();
    const { getAiSettings } = await import('./ai-settings');
    expect(getAiSettings()).toMatchObject({ enabled: true, provider: 'ollama', model: 'gemma3' });
  });

  it('moves people who never set up Ollama to the hosted service', async () => {
    localStorage.setItem('biblequest-ai-settings-v1', JSON.stringify({ enabled: false }));
    await loadClient();
    const { getAiSettings } = await import('./ai-settings');
    expect(getAiSettings()).toMatchObject({ enabled: true, provider: 'hosted' });
  });

  it('falls back to Ollama when the build has no hosted service', async () => {
    vi.stubEnv('VITE_AI_API_URL', '');
    vi.resetModules();
    localStorage.setItem('biblequest-ai-settings-v1', JSON.stringify({ enabled: true, provider: 'hosted' }));
    const { getAiSettings } = await import('./ai-settings');
    expect(getAiSettings().provider).toBe('ollama');
  });
});
