import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Info, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useAiSettings } from '../hooks/useAiSettings';
import { useOllamaStatus } from '../hooks/useOllamaStatus';
import { formatModelSize, isModelInstalled, pickModel } from '../lib/ai/ai-settings';
import { describeAiError } from '../lib/ai/errors';
import { DEFAULT_OLLAMA_URL, normalizeBaseUrl } from '../lib/ai/ollama-client';

const inputClass =
  'w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50';

export default function AiSettingsPage() {
  const { settings, update } = useAiSettings();
  const [urlDraft, setUrlDraft] = useState(settings.baseUrl);
  const { status, refresh } = useOllamaStatus(settings.baseUrl);

  const models = status.state === 'connected' ? status.models : [];
  const savedMissing =
    status.state === 'connected' && !!settings.model && !isModelInstalled(models, settings.model);

  // First connection with no model chosen yet: preselect gemma3 (or the first model).
  useEffect(() => {
    if (status.state !== 'connected' || settings.model) return;
    const picked = pickModel(status.models, '');
    if (picked) update({ model: picked });
  }, [status, settings.model, update]);

  const saveUrl = () => {
    const next = normalizeBaseUrl(urlDraft) || DEFAULT_OLLAMA_URL;
    setUrlDraft(next);
    if (next === settings.baseUrl) void refresh();
    else update({ baseUrl: next });
  };

  return (
    <div className="py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-gold-500" />
          <h1 className="text-3xl font-serif font-bold text-cream">AI Assistant</h1>
        </div>
        <p className="text-cream/50 text-sm">
          Chat with an AI mentor that runs on your own Mac with Ollama. Your messages never leave
          your computer.
        </p>
      </div>

      {/* Enable */}
      <section className="card">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-serif font-semibold text-cream">Enable AI assistant</h2>
            <p className="text-cream/50 text-sm">
              Shows the AI search box on the Home page. Turn off to hide all AI features.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            aria-label="Enable AI assistant"
            onClick={() => update({ enabled: !settings.enabled })}
            className={`relative w-12 h-7 rounded-full shrink-0 transition-colors duration-200 ${
              settings.enabled ? 'bg-gold-500' : 'bg-navy-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-cream transition-transform duration-200 ${
                settings.enabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </section>

      {/* Connection */}
      <section className="card space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">Connection</h2>
        <div className="space-y-2">
          <label htmlFor="ollama-url" className="text-cream/70 text-sm">
            Ollama address
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="ollama-url"
              type="url"
              inputMode="url"
              spellCheck={false}
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveUrl()}
              className={`${inputClass} sm:flex-1`}
            />
            <button
              type="button"
              onClick={saveUrl}
              disabled={status.state === 'checking'}
              className="btn-outline text-sm inline-flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${status.state === 'checking' ? 'animate-spin' : ''}`} />
              Test connection
            </button>
          </div>
          <p className="text-cream/40 text-xs">Default: {DEFAULT_OLLAMA_URL}</p>
        </div>

        <div aria-live="polite">
          {status.state === 'checking' && (
            <p className="flex items-center gap-2 text-cream/60 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-gold-500" />
              Checking Ollama…
            </p>
          )}
          {status.state === 'connected' && (
            <p className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Connected to Ollama {status.version}
            </p>
          )}
          {status.state === 'error' && <ConnectionError error={status.error} />}
        </div>
      </section>

      {/* Model */}
      <section className="card space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">Model</h2>
        <p className="text-cream/50 text-sm">
          Choose which installed model answers your questions. Larger models are slower. Recommended:{' '}
          <code className="text-gold-400">gemma3</code>.
        </p>

        {status.state === 'connected' && models.length === 0 && (
          <p className="text-cream/70 text-sm">
            No models are installed yet. In Terminal, run{' '}
            <code className="text-gold-400 select-all">ollama pull gemma3</code>, then test the
            connection again.
          </p>
        )}

        {status.state === 'connected' && models.length > 0 && (
          <>
            <select
              aria-label="Model"
              value={savedMissing ? '' : settings.model}
              onChange={(e) => update({ model: e.target.value })}
              className={`${inputClass} sm:w-auto sm:min-w-[300px]`}
            >
              {(savedMissing || !settings.model) && (
                <option value="" disabled>
                  Choose a model
                </option>
              )}
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                  {m.size ? ` · ${formatModelSize(m.size)}` : ''}
                  {m.parameterSize ? ` · ${m.parameterSize}` : ''}
                </option>
              ))}
            </select>
            {savedMissing && (
              <p className="flex items-start gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  The model you chose before (<code>{settings.model}</code>) is no longer installed.
                  Please choose another.
                </span>
              </p>
            )}
          </>
        )}

        {status.state !== 'connected' && (
          <p className="text-cream/50 text-sm">Connect to Ollama to see your installed models.</p>
        )}
      </section>

      {/* Creativity */}
      <section className="card space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">Creativity</h2>
        <p className="text-cream/50 text-sm">
          Lower values give steadier, more focused answers. Higher values give more varied answers.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={1.2}
            step={0.1}
            value={settings.temperature}
            onChange={(e) => update({ temperature: Number(e.target.value) })}
            aria-label="Creativity"
            className="flex-1"
          />
          <span className="text-gold-400 text-sm font-medium w-8 text-right">
            {settings.temperature.toFixed(1)}
          </span>
        </div>
      </section>

      {/* Help */}
      <section className="card space-y-3">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-gold-500 shrink-0" />
          <h2 className="text-lg font-serif font-semibold text-cream">Setup help</h2>
        </div>
        <p className="text-cream/70 text-sm leading-relaxed">
          Install Ollama from{' '}
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-400 hover:text-gold-300 transition-colors"
          >
            ollama.com
          </a>{' '}
          and download a model. If you use BibleQuest from its website rather than a local copy,
          Ollama must be told to allow the site.{' '}
          <Link to="/about" className="text-gold-400 hover:text-gold-300 transition-colors">
            See the steps on the About page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function ConnectionError({ error }: { error: unknown }) {
  const { title, hints } = describeAiError(error);
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-red-400 text-sm font-medium">
        <AlertTriangle className="w-4 h-4" />
        {title}
      </p>
      <ul className="space-y-1 text-cream/60 text-sm list-disc pl-5 break-words">
        {hints.map((hint) => (
          <li key={hint}>{hint}</li>
        ))}
      </ul>
    </div>
  );
}
