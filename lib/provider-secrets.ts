/** The secret name each LLM provider's API key is stored under. The secrets UI
 * offers these as the pickable names, and the runner looks a key up by the same
 * name (see runLlmNode). */
export type ProviderSecret = {
  provider: string;
  /** The secret's name (also the env-style key the runner resolves). */
  name: string;
  label: string;
};

export const PROVIDER_SECRETS: ProviderSecret[] = [
  { provider: 'anthropic', name: 'ANTHROPIC_API_KEY', label: 'Anthropic' },
  { provider: 'openai', name: 'OPENAI_API_KEY', label: 'OpenAI' },
  { provider: 'deepseek', name: 'DEEPSEEK_API_KEY', label: 'DeepSeek' },
];

/** "OpenAI — OPENAI_API_KEY" for a stored secret name, or the raw name if it's
 * not a known provider key. */
export function providerSecretLabel(name: string): string {
  const match = PROVIDER_SECRETS.find((secret) => secret.name === name);
  return match ? `${match.label} — ${match.name}` : name;
}
