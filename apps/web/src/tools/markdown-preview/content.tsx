import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Type or paste Markdown in the editor.</li>
      <li>The preview updates as you type. On a narrow screen it appears below the editor.</li>
      <li>Use "Copy Markdown" to copy the source, or Clear to start again.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        Markdown is a plain-text format for headings, emphasis, lists, links and code. This preview
        supports headings, paragraphs, <em>emphasis</em>, <strong>strong text</strong>, links,
        ordered and unordered lists, inline code, fenced code blocks, block quotes and horizontal
        rules.
      </p>
      <p>
        The preview is built for safety. Raw HTML in your text is not turned into page elements, so
        scripts and event handlers cannot run, <code>javascript:</code> links are dropped, and
        images are not loaded (so no outside server is contacted). Tables, task lists and other
        extensions are not supported, and the preview may look slightly different from GitHub or
        your own site.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why does my HTML show up as text?',
      answer: (
        <p>
          Rendering pasted HTML would let a malicious snippet run in your browser, so it is never
          interpreted here.
        </p>
      ),
    },
    {
      question: 'Is my Markdown uploaded?',
      answer: <p>No. It is rendered in your browser and never sent to a server.</p>,
    },
  ],
};
