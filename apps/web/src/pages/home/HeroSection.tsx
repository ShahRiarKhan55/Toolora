import { useId } from 'react';
import { Container } from '../../components/layout/Container';
import { ButtonLink } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function HeroSection() {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="border-b border-border bg-primary-soft">
      <Container className="py-14 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <h1 id={headingId} className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple tools for everyday tasks.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            Toolora brings together useful online tools for developers, students and anyone handling
            Japan-related tasks, each one focused on doing a single job well.
          </p>
          {/* Placeholder: real search needs the tool registry (Phase 3), so it stays disabled and says so. */}
          <div role="search" className="mt-8 max-w-xl">
            <Input
              type="search"
              label="Search tools"
              hideLabel
              disabled
              placeholder="Search tools"
              hint="Search will be available once the first tools are added."
            />
          </div>
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
