import type { ReactNode } from 'react';
import { Section } from '../../components/layout/Section';
import { Card } from '../../components/ui/Card';
import { LockIcon, ShieldIcon, ZapIcon } from '../../components/ui/icons';

const PRINCIPLES: readonly { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <ShieldIcon className="size-6" />,
    title: 'Private by design',
    text: 'Tools are built to run in your browser, so what you type stays on your device.',
  },
  {
    icon: <LockIcon className="size-6" />,
    title: 'No account needed',
    text: 'Open a tool and use it. There is nothing to sign up for.',
  },
  {
    icon: <ZapIcon className="size-6" />,
    title: 'Made to be simple',
    text: 'Clear inputs, clear results, and plain-language notes on how each tool works.',
  },
];

export function PrinciplesSection() {
  return (
    <Section title="How Toolora works">
      <ul className="grid gap-4 md:grid-cols-3">
        {PRINCIPLES.map((principle) => (
          <li key={principle.title}>
            <Card className="h-full">
              <div className="flex size-11 items-center justify-center rounded-control bg-primary-soft text-primary">
                {principle.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{principle.title}</h3>
              <p className="mt-1 text-muted-foreground">{principle.text}</p>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
