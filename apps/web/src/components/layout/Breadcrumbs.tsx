import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '../ui/icons';

export interface BreadcrumbItem {
  label: string;
  /** Omit on the last item: it represents the current page and is not a link. */
  href?: string;
}

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={item.label}>
              <li>
                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={isLast ? 'font-medium text-foreground' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="flex">
                  <ChevronRightIcon className="size-4" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
