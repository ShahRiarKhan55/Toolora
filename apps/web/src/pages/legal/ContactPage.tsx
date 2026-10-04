import { CONTACT_META, PRIVACY_ROUTE } from '@toolora/shared';
import { Link } from 'react-router-dom';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/layout/PageHeader';
import { useDocumentMeta } from '../../lib/useDocumentMeta';
import { ContactNote } from './ContactNote';

export function ContactPage() {
  useDocumentMeta(CONTACT_META);
  return (
    <Container className="py-12">
      <PageHeader
        title="Contact"
        description="Questions, bug reports, tool suggestions or privacy requests."
      />
      <div className="mt-10 max-w-content space-y-4">
        <p>
          <ContactNote />
        </p>
        <p>
          Please do not send passwords or other sensitive information. For privacy questions, see
          the{' '}
          <Link to={PRIVACY_ROUTE} className="font-medium underline underline-offset-2">
            Privacy page
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
