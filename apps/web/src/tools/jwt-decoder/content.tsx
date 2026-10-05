import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Paste a JSON Web Token (a "Bearer " prefix is fine).</li>
      <li>Read the decoded header, payload and registered claims below it.</li>
      <li>Copy the header or payload as formatted JSON if you need it.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        A JWT has three parts separated by dots: a header (the algorithm and token type), a payload
        (the claims) and a signature. The first two are just JSON encoded as Base64URL, which is why
        anyone holding a token can read it. This tool decodes them and lists the standard claims:{' '}
        <code>iss</code> (issuer), <code>sub</code> (subject), <code>aud</code> (audience),{' '}
        <code>exp</code> (expiry), <code>nbf</code> (not before), <code>iat</code> (issued at) and{' '}
        <code>jti</code> (token ID). Time claims are Unix seconds and are shown as UTC dates.
      </p>
      <p>
        <strong>This is a decoder, not a verifier.</strong> Decoding does not check the signature,
        so nothing here proves a token is genuine, unmodified or still accepted by a server. The
        "expired" and "not yet active" notes only compare the claim to your device clock. Signature
        verification needs the secret or public key and belongs in your server code.
      </p>
      <p>
        Decoding runs entirely in your browser: the token is never sent to a server. Even so, treat
        live access tokens like passwords and avoid pasting sensitive production tokens into any
        website you do not fully trust.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why does my token say it is invalid?',
      answer: (
        <p>
          A signed JWT is exactly three Base64URL parts separated by dots, and the first two must
          decode to JSON objects. Encrypted tokens (JWE, five parts) cannot be read without the key,
          and an opaque access token that is not a JWT has nothing to decode.
        </p>
      ),
    },
    {
      question: 'Is the payload secret?',
      answer: (
        <p>
          No. A signature protects a token from being changed, not from being read. Do not put
          secrets in JWT claims unless the token is encrypted.
        </p>
      ),
    },
    {
      question: 'Is my token sent anywhere?',
      answer: <p>No. It is decoded in your browser and is not stored.</p>,
    },
  ],
};
