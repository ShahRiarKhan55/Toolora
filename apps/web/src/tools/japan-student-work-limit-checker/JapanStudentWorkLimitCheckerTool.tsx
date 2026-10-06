import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { CopyButton } from '../../components/ui/CopyButton';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SourcesAndAssumptions } from '../../components/tool/SourcesAndAssumptions';
import { SOURCES } from '../../config/japanMoneyRules';
import {
  DEFAULT_STUDENT_INPUT,
  STATUS_OPTIONS,
  STUDENT_ERROR_MESSAGES,
  checkStudentWork,
  summarize,
} from './logic';
import type {
  EmployerSize,
  ImmigrationVerdict,
  ResidenceStatus,
  StudentInput,
  StudentResult,
  SocialInsuranceConditionStatus,
  Support,
  ThresholdStatus,
} from './logic';

const ASSUMPTIONS = [
  'Pay means gross wages from work in 2026, all jobs added together. Commuting allowances count differently in different systems (see each card).',
  'The immigration card is about permission to work. It is separate from tax and insurance, and breaking it can affect your status of residence.',
  'The tax and insurance cards compare your pay with the 2026 limit for each system. They do not add up to one limit, and being under one limit does not mean you are under another.',
  'Resident tax uses the exemption limit Nagoya City states (a salary of ¥1.19M); this is not a nationwide rule, and some municipalities use a lower one (a Hokkaido village starts at ¥1.12M). Your school must qualify for the working student deduction.',
  'Tax dependant and health insurance dependant cards only apply if a relative supports you.',
  'Employer social insurance is a set of separate conditions (hours at one employer, employer size, not being a student). Since 1 October 2026 there is no monthly wage condition, so pay is not part of it.',
];

const SOURCE_IDS = [
  'isaStudentPermission',
  'isaDependantPermission',
  'isaPermissionOverview',
  'ntaEmploymentIncomeDeduction',
  'ntaBasicDeduction',
  'ntaWorkingStudent',
  'ntaDependants',
  'ntaSpecificRelative',
  'nagoyaResident2027',
  'jpsDependantInsurance',
  'jpsWageRequirement',
  'jpsEnrolmentOverride',
] as const;

const VERDICT_BADGE: Record<
  ImmigrationVerdict,
  { tone: 'success' | 'error' | 'warning' | 'neutral'; text: string }
> = {
  'no-limit': { tone: 'success', text: 'No limit for this status' },
  within: { tone: 'success', text: 'Within the limit' },
  over: { tone: 'error', text: 'Over the limit' },
  'not-permitted': { tone: 'error', text: 'Permission needed' },
  unknown: { tone: 'warning', text: 'Check your status' },
};

const SI_BADGE: Record<
  SocialInsuranceConditionStatus,
  { tone: 'success' | 'warning' | 'neutral'; text: string }
> = {
  met: { tone: 'success', text: 'Condition met' },
  'not-met': { tone: 'warning', text: 'Condition not met' },
  unknown: { tone: 'neutral', text: 'Ask your employer' },
  applies: { tone: 'warning', text: 'Applies to students' },
  abolished: { tone: 'neutral', text: 'No longer a condition' },
  info: { tone: 'neutral', text: 'Other rules' },
};

const STATUS_BADGE: Record<
  ThresholdStatus,
  { tone: 'success' | 'warning' | 'neutral'; text: string }
> = {
  within: { tone: 'success', text: 'At or under the limit' },
  beyond: { tone: 'warning', text: 'Over the limit' },
  'not-applicable': { tone: 'neutral', text: 'Does not apply to you' },
  'needs-age': { tone: 'neutral', text: 'Enter your age to check' },
};

export function JapanStudentWorkLimitCheckerTool() {
  const [input, setInput] = useState<StudentInput>(DEFAULT_STUDENT_INPUT);
  const [result, setResult] = useState<StudentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof StudentInput>(key: K, value: StudentInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function check() {
    const outcome = checkStudentWork(input);
    if (!outcome.ok) {
      setResult(null);
      setError(STUDENT_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(outcome.value);
  }

  function reset() {
    setInput(DEFAULT_STUDENT_INPUT);
    setResult(null);
    setError(null);
  }

  const showVacation = input.status === 'student-permitted';

  return (
    <div className="space-y-6">
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          check();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Your status of residence"
            className="sm:col-span-2"
            value={input.status}
            onChange={(event) => update('status', event.target.value as ResidenceStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input
            label="Hours worked per week"
            inputMode="decimal"
            autoComplete="off"
            value={input.weeklyHours}
            onChange={(event) => update('weeklyHours', event.target.value)}
            placeholder="24"
            hint="All jobs added together; 0 if you do not work."
          />
          <Input
            label="Pay from work in 2026 (JPY)"
            inputMode="numeric"
            autoComplete="off"
            value={input.annualIncome}
            onChange={(event) => update('annualIncome', event.target.value)}
            placeholder="1200000"
            hint="Total gross wages for the calendar year, before deductions."
          />
          {showVacation && (
            <div className="space-y-2 sm:col-span-2">
              <Checkbox
                label="I am asking about a long vacation set by my school"
                hint="the daily rule replaces the weekly one"
                checked={input.longVacation}
                onChange={(event) => update('longVacation', event.target.checked)}
              />
              {input.longVacation && (
                <Input
                  label="Longest working day (hours)"
                  inputMode="decimal"
                  autoComplete="off"
                  value={input.longestDayHours}
                  onChange={(event) => update('longestDayHours', event.target.value)}
                  placeholder="8"
                />
              )}
            </div>
          )}
          <Input
            label="Age on 31 December 2026 (optional)"
            inputMode="numeric"
            autoComplete="off"
            value={input.age}
            onChange={(event) => update('age', event.target.value)}
            hint="Ages 19 to 22 have extra rules."
          />
          <Select
            label="Does a relative support you?"
            value={input.supportedByRelative}
            onChange={(event) => update('supportedByRelative', event.target.value as Support)}
            hint="For example a parent who pays your living or school costs."
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="unsure">Not sure</option>
          </Select>
          <Select
            label="Does your employer have 51 or more employees?"
            className="sm:col-span-2"
            value={input.employerSize}
            onChange={(event) => update('employerSize', event.target.value as EmployerSize)}
            hint="Only used for the employer social insurance conditions in part 3."
          >
            <option value="unsure">Not sure</option>
            <option value="over50">Yes, 51 or more</option>
            <option value="under51">No, 50 or fewer</option>
          </Select>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit">Check</Button>
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
      </form>

      {error && (
        <Alert tone="error" title="Could not check">
          {error}
        </Alert>
      )}

      {result && !error && (
        <div className="space-y-5">
          <p className="text-sm font-semibold">
            Four separate systems · rules year {result.ruleYearLabel}
          </p>

          <section
            aria-live="polite"
            className="rounded-control border border-border bg-surface-muted p-4"
          >
            <h2 className="text-base font-bold">1. Immigration: permission to work</h2>
            <p className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={VERDICT_BADGE[result.immigration.verdict].tone}>
                {VERDICT_BADGE[result.immigration.verdict].text}
              </Badge>
              <span className="font-semibold">{result.immigration.headline}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{result.immigration.detail}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Source:{' '}
              {result.immigration.sourceIds.map((id) => (
                <a
                  key={id}
                  className="text-primary underline"
                  href={SOURCES[id].url}
                  rel="noopener noreferrer"
                >
                  {SOURCES[id].publisher}
                </a>
              ))}
            </p>
          </section>

          <div className="space-y-3">
            <h2 className="text-base font-bold">
              2. Tax and insurance lines for {result.annualIncome.toLocaleString('en-US')} yen a
              year
            </h2>
            <ul className="space-y-3">
              {result.thresholds.map((threshold) => (
                <li
                  key={threshold.system}
                  className="rounded-control border border-border bg-surface p-4"
                >
                  <p className="flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_BADGE[threshold.status].tone}>
                      {STATUS_BADGE[threshold.status].text}
                    </Badge>
                    <span className="font-semibold">{threshold.title}</span>
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">Limit:</span> {threshold.limitText}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{threshold.meaning}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Counts: {threshold.incomeBasis}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-control border border-border bg-surface p-4">
            <h2 className="text-base font-bold">3. Your employer&rsquo;s social insurance</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These are separate conditions, not an income limit. None of them looks at how much you
              earn.
            </p>
            <ul className="mt-3 space-y-3">
              {result.socialInsurance.map((condition) => (
                <li key={condition.id} className="rounded-control border border-border p-3">
                  <p className="flex flex-wrap items-center gap-2">
                    <Badge tone={SI_BADGE[condition.status].tone}>
                      {SI_BADGE[condition.status].text}
                    </Badge>
                    <span className="font-semibold">{condition.title}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{condition.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <CopyButton text={summarize(result)} label="Copy summary" />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        This is an educational checker, not legal, tax or immigration advice. The limits come from
        different systems with different consequences, so no single number tells you whether a
        student may work. Confirm your own situation with the Immigration Services Agency, your
        school, your employer and your tax office.
      </p>

      <SourcesAndAssumptions
        ruleYearLabel="2026 (令和8年)"
        assumptions={ASSUMPTIONS}
        sourceIds={SOURCE_IDS}
      />
    </div>
  );
}
