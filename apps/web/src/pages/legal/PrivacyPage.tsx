import { PRIVACY_META, ACCOUNTS_ENABLED, CONTACT_ROUTE } from '@toolora/shared';
import { Link } from 'react-router-dom';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/layout/PageHeader';
import { useDocumentMeta } from '../../lib/useDocumentMeta';
import { ContactNote } from './ContactNote';

const h2 = 'text-2xl font-semibold tracking-tight';

export function PrivacyPage() {
  useDocumentMeta(PRIVACY_META);
  return (
    <Container className="py-12">
      <PageHeader
        title="Privacy"
        description="What Toolora does and does not do with your data, in plain language."
      />
      <div className="mt-10 max-w-content space-y-10">
        <section aria-labelledby="privacy-tools">
          <h2 id="privacy-tools" className={h2}>
            What you type into the tools
          </h2>
          <p className="mt-3">
            Most tools run entirely in your browser. The text and numbers you enter are processed on
            your device and are not sent to the Toolora server. Toolora does not store them, and the
            tools do not put them in the page address or save them in your browser.
          </p>
          <p className="mt-3">
            The one exception is the Currency Converter (and its JPY ↔ BDT pages). To show a rate,
            your browser asks Toolora&apos;s server for daily exchange-rate data for the base
            currency you picked, and the server in turn asks an exchange-rate provider. The amount
            you type stays in your browser and is not part of that request.
          </p>
        </section>

        <section aria-labelledby="privacy-storage">
          <h2 id="privacy-storage" className={h2}>
            What is saved in your browser
          </h2>
          <p className="mt-3">
            Toolora remembers your recently used tools and favorites in your browser&apos;s local
            storage, so they are there next time. Only the tool names (their page slugs) are saved,
            never anything you entered. They stay on your device, are not sent to Toolora, and you
            can remove them by clearing the site data in your browser.
          </p>
        </section>

        <section aria-labelledby="privacy-server">
          <h2 id="privacy-server" className={h2}>
            What the server receives
          </h2>
          <p className="mt-3">
            When you open a page, your browser asks the server for that page and its files, as with
            any website. For each request the server writes a log line with the time, the request
            method, the page path, the response status, how long it took and a random request ID. It
            does not log query strings, request headers or request bodies. The server does not set
            cookies for visitors, and the site loads no analytics, advertising or other third-party
            scripts or fonts.
          </p>
          <p className="mt-3">
            Toolora does not control the hosting service or network that delivers the site, which
            may keep its own records, such as IP addresses.
          </p>
        </section>

        <section aria-labelledby="privacy-accounts">
          <h2 id="privacy-accounts" className={h2}>
            Accounts
          </h2>
          <p className="mt-3">
            {ACCOUNTS_ENABLED
              ? 'Accounts are optional. If you create one, Toolora stores your email address, a salted hash of your password and a session record, and sets a session cookie so you stay signed in.'
              : 'Public registration is disabled. Toolora does not collect account information from visitors, and there is no sign-in on the public site.'}{' '}
            No account is needed to use any tool.
          </p>
          <p className="mt-3">
            The site includes sign-in code for possible future use. If accounts are opened later,
            signing in would use a cookie that is sent only to Toolora, and passwords would be
            stored only as hashes. This page will be updated before that happens.
          </p>
        </section>

        <section aria-labelledby="privacy-requests">
          <h2 id="privacy-requests" className={h2}>
            Questions and requests
          </h2>
          <p className="mt-3">
            If you have a question about your personal information, or want to ask what is held
            about you or to have it handled in a particular way, get in touch. <ContactNote /> See
            the{' '}
            <Link to={CONTACT_ROUTE} className="font-medium underline underline-offset-2">
              Contact page
            </Link>
            .
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            This page describes how the site currently works. It is not legal advice and makes no
            claim of compliance with any particular law.
          </p>
        </section>
      </div>
    </Container>
  );
}
