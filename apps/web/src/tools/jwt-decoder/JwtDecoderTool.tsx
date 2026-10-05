import { useMemo, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { Textarea } from '../../components/ui/Textarea';
import { JWT_ERROR_MESSAGES, decodeJwt } from './logic';

function JsonBlock({ title, json }: { title: string; json: string }) {
  return (
    <section aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
        <CopyButton text={json} label={`Copy ${title.toLowerCase()}`} />
      </div>
      {/* React renders this as text; nothing from the token is ever parsed as HTML. */}
      <pre className="mt-1 max-h-96 overflow-auto rounded-control border border-border bg-surface-muted p-3 font-mono text-sm">
        {json}
      </pre>
    </section>
  );
}

export function JwtDecoderTool() {
  const [input, setInput] = useState('');
  const outcome = useMemo(() => (input.trim() === '' ? null : decodeJwt(input)), [input]);

  return (
    <div className="space-y-6">
      <Alert tone="warning" title="This decodes a token; it does not verify it">
        Decoding does not check the signature, so a decoded token is not proof that it is genuine or
        unmodified. Decoding happens locally in your browser and nothing is sent anywhere. Still, do
        not paste sensitive production tokens into services you do not trust.
      </Alert>

      <Textarea
        label="JWT"
        mono
        rows={6}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
        spellCheck={false}
        autoComplete="off"
        error={outcome && !outcome.ok ? JWT_ERROR_MESSAGES[outcome.error] : undefined}
      />
      <div>
        <Button variant="secondary" onClick={() => setInput('')}>
          Clear
        </Button>
      </div>

      {outcome === null && (
        <p className="text-sm text-muted-foreground">
          Paste a JWT (three parts separated by dots) to see its header, payload and claims.
        </p>
      )}

      {outcome?.ok && (
        <div className="space-y-6" aria-live="polite">
          <JsonBlock title="Header" json={outcome.value.headerJson} />
          <JsonBlock title="Payload" json={outcome.value.payloadJson} />

          <section aria-label="Registered claims">
            <h3 className="text-sm font-semibold text-muted-foreground">Registered claims</h3>
            {outcome.value.claims.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                The payload has none of the standard claims (iss, sub, aud, exp, nbf, iat, jti).
              </p>
            ) : (
              <div className="mt-1 overflow-x-auto rounded-control border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2">
                        Claim
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Meaning
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {outcome.value.claims.map((row) => (
                      <tr key={row.claim} className="border-t border-border align-top">
                        <th scope="row" className="px-3 py-2 font-mono font-semibold">
                          {row.claim}
                        </th>
                        <td className="px-3 py-2">{row.description}</td>
                        <td className="px-3 py-2 break-all">
                          <span className="font-mono">{row.value}</span>
                          {row.date && (
                            <span className="block text-muted-foreground">
                              {row.date}
                              {row.timing && ` — ${row.timing}`}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-label="Signature">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Signature (not verified)
            </h3>
            <p className="mt-1 rounded-control border border-border bg-surface-muted p-3 font-mono text-sm break-all">
              {outcome.value.signature === ''
                ? '(empty: an unsecured token)'
                : outcome.value.signature}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
