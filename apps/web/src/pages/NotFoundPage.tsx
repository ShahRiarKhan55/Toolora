import { SITE_NAME } from '@toolora/shared';
import { Container } from '../components/layout/Container';
import { PageHeader } from '../components/layout/PageHeader';
import { ButtonLink } from '../components/ui/Button';
import { useDocumentMeta } from '../lib/useDocumentMeta';

export function NotFoundPage() {
  // No `path`: a 404 has no canonical URL of its own, and must not point at a real page.
  useDocumentMeta({
    title: `Page not found — ${SITE_NAME}`,
    description: 'This page does not exist.',
    robots: 'noindex,follow',
  });

  return (
    <Container className="py-16 text-center sm:py-24">
      <PageHeader title="Page not found" description="The page you're looking for doesn't exist." />
      <div className="mt-8">
        <ButtonLink href="/">Back to home</ButtonLink>
      </div>
    </Container>
  );
}
