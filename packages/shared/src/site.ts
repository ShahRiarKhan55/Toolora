export const SITE_NAME = 'Toolora';

export const SITE_TAGLINE = 'Simple online tools that solve everyday problems.';

/** The home page's route. Never store this elsewhere — it is the one non-tool, non-category route. */
export const HOME_ROUTE = '/';

/** The account page (sign in / create account). Not a tool or category route; never indexed. */
export const ACCOUNT_ROUTE = '/account';

/**
 * Whether accounts are open to the public. Off for the initial launch: the sign-in link is hidden,
 * `/account` shows a notice instead of a form, and the server does not mount `/api/auth`. The
 * authentication code stays in place; flipping this to true re-enables all of it (but read the
 * rate-limiting warning in docs/deployment.md first).
 */
export const ACCOUNTS_ENABLED = false;

export const PRIVACY_ROUTE = '/privacy';
export const CONTACT_ROUTE = '/contact';

/**
 * The public contact address. Deliberately unset: no real address exists in this repository and one
 * must not be invented. The owner sets it before launch; the Contact and Privacy pages show it as
 * soon as it is a string, and say contact details are not published yet until then.
 */
export const CONTACT_EMAIL: string | undefined = undefined;
