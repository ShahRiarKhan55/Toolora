import { CONTACT_EMAIL } from '@toolora/shared';

/** The contact address when one is configured, otherwise an honest "not published yet". */
export function ContactNote() {
  if (CONTACT_EMAIL === undefined) {
    return <>Contact details have not been published yet.</>;
  }
  return (
    <>
      Email{' '}
      <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-2">
        {CONTACT_EMAIL}
      </a>
      .
    </>
  );
}
