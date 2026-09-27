import { SITE_NAME } from '@toolora/shared';
import { Container } from '../components/layout/Container';
import { PageHeader } from '../components/layout/PageHeader';
import { ButtonLink } from '../components/ui/Button';
import { useDocumentMeta } from '../lib/useDocumentMeta';

export function NotFoundPage() {
  useDocumentMeta(`Page not found — ${SITE_NAME}`, 'This page does not exist.');

  return (
    <Container className="py-16 text-center sm:py-24">
      <PageHeader title="Page not found" description="The page you're looking for doesn't exist." />
      <div className="mt-8">
        <ButtonLink href="/">Back to home</ButtonLink>
      </div>
    </Container>
  );
}
