import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../../components/layout/Container';
import { ButtonLink } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function HeroSection() {
  const headingId = useId();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void navigate(query.trim() === '' ? '/tools' : `/tools?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <section aria-labelledby={headingId} className="border-b border-border bg-primary-soft">
      <Container className="py-14 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <h1 id={headingId} className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple tools for everyday tasks.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            Toolora brings together fast, practical tools for work, study, development, finance and
            everyday tasks, each one focused on doing a single job well.
          </p>
          <form role="search" onSubmit={handleSubmit} className="mt-8 max-w-xl">
            <Input
              type="search"
              label="Search tools"
              hideLabel
              placeholder="Search tools by name, category or keyword…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              hint="Try “json”, “gpa” or “yen”."
            />
          </form>
          <div className="mt-6">
            <ButtonLink href="#categories" size="lg">
              Browse categories
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
