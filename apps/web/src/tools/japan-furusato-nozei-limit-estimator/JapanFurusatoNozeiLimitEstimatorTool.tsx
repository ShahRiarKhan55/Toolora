import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import { SourcesAndAssumptions } from '../../components/tool/SourcesAndAssumptions';
import { PREFECTURES } from '../../config/japanMoneyRules';
import {
  DEFAULT_FURUSATO_INPUT,
  FURUSATO_ERROR_MESSAGES,
  estimateFurusatoLimit,
  formatYen,
  summarize,
} from './logic';
import type { FurusatoInput, FurusatoResult, SpouseOption } from './logic';

const ASSUMPTIONS = [
  'You are an employee with salary as your only income, paid in 12 equal monthly amounts with no bonus, enrolled in social insurance (Kyokai Kenpo rates for the prefecture you choose).',
  'Household: an optional spouse (with total income of ¥620,000 or less) and dependants aged 16 or over. Other situations, such as elderly or disabled dependants, a single-parent deduction, a working student deduction, self-employment income or a home loan deduction, are not covered.',
  'Other deductions you enter reduce both income tax and resident tax by the same amount. Real deductions, such as life insurance, can differ between the two taxes.',
  'It assumes you file a tax return (確定申告). The One-Stop Special Exception system shifts the income-tax part onto resident tax, so ask your municipality if you use it.',
  'Resident tax is the 令和9年度 tax on your 2026 income, which is what a 2026 donation reduces. It uses the 10% rate and the exemption limit Nagoya City states (total income of ¥450,000), not any municipality-specific rule or local add-on, so your own city can differ.',
];

const SOURCE_IDS = [
  'soumuFurusato',
  'sakaiResident',
  'ntaIncomeTaxRates',
  'ntaBasicDeduction',
  'ntaEmploymentIncomeDeduction',
  'ntaDependants',
  'ntaSpouse',
  'kyokaiKenpoRates',
  'jpsPensionTable',
  'mhlwEmploymentInsurance',
] as const;

function Breakdown({ result }: { result: FurusatoResult }) {
  const items: [string, string][] = [
    ['Salary before deductions', formatYen(result.annualSalary)],
    [
      'Employment income (after the employment income deduction)',
      formatYen(result.employmentIncome),
    ],
    ['Social insurance premiums paid in the year', formatYen(result.socialInsuranceAnnual)],
    ['Taxable income for income tax', formatYen(result.incomeTaxableIncome)],
    ['Taxable income for resident tax', formatYen(result.residentTaxableIncome)],
    ['Resident income tax before donations', formatYen(result.residentIncomeLevy)],
    [
      'Special deduction rate',
      `${result.specialDeductionRatePercent.toFixed(3)}% (90% − ${result.referenceRatePercent}% × 1.021)`,
    ],
  ];
  return (
    <details className="rounded-control border border-border bg-surface-muted px-4 py-1">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">
        How this estimate was reached
      </summary>
      <dl className="grid gap-x-4 gap-y-2 pb-3 text-sm sm:grid-cols-[1fr_auto]">
        {items.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="font-semibold sm:text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export function JapanFurusatoNozeiLimitEstimatorTool() {
  const [input, setInput] = useState<FurusatoInput>(DEFAULT_FURUSATO_INPUT);
  const [result, setResult] = useState<FurusatoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FurusatoInput>(key: K, value: FurusatoInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function estimate() {
    const outcome = estimateFurusatoLimit(input);
    if (!outcome.ok) {
      setResult(null);
      setError(FURUSATO_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(outcome.value);
  }

  function reset() {
    setInput(DEFAULT_FURUSATO_INPUT);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          estimate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Yearly salary before deductions (JPY)"
            inputMode="numeric"
            autoComplete="off"
            value={input.salary}
            onChange={(event) => update('salary', event.target.value)}
            placeholder="5000000"
            hint="Total pay for 2026 including bonuses, before tax and insurance."
          />
          <Input
            label="Age"
            inputMode="numeric"
            autoComplete="off"
            value={input.age}
            onChange={(event) => update('age', event.target.value)}
            hint="Used for long-term care insurance from age 40."
          />
          <Select
            label="Health insurance prefecture"
            value={input.prefectureId}
            onChange={(event) => update('prefectureId', event.target.value)}
          >
            {PREFECTURES.map((prefecture) => (
              <option key={prefecture.id} value={prefecture.id}>
                {prefecture.name}
              </option>
            ))}
          </Select>
          <Select
            label="Spouse"
            value={input.spouse}
            onChange={(event) => update('spouse', event.target.value as SpouseOption)}
          >
            <option value="none">No spouse deduction</option>
            <option value="deduction">Spouse with total income of ¥620,000 or less</option>
          </Select>
          <Input
            label="Dependants aged 16+ (not 19–22)"
            inputMode="numeric"
            autoComplete="off"
            value={input.generalDependants}
            onChange={(event) => update('generalDependants', event.target.value)}
          />
          <Input
            label="Dependants aged 19–22"
            inputMode="numeric"
            autoComplete="off"
            value={input.specificDependants}
            onChange={(event) => update('specificDependants', event.target.value)}
          />
          <Input
            label="Other yearly deductions (JPY)"
            inputMode="numeric"
            autoComplete="off"
            className="sm:col-span-2"
            value={input.otherDeductions}
            onChange={(event) => update('otherDeductions', event.target.value)}
            hint="For example iDeCo contributions or medical expenses, if you know them. 0 if none."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit">Estimate limit</Button>
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
      </form>

      {error && (
        <Alert tone="error" title="Could not estimate">
          {error}
        </Alert>
      )}

      {result && !error && (
        <div className="space-y-4">
          <p className="text-sm font-semibold">
            Estimated furusato nozei limit · rules year {result.ruleYearLabel}
          </p>
          {result.limit > 0 ? (
            <ResultBox
              label="Estimated upper limit for the year (approximate)"
              value={formatYen(result.limit)}
              copyLabel="Copy estimated limit"
            />
          ) : (
            <Alert tone="info" title="No deduction benefit at this income">
              With these inputs there is no resident income tax for a donation to reduce, so
              furusato nozei would not lower your tax. You would just pay for the gift.
            </Alert>
          )}
          {result.notes.map((note) => (
            <Alert key={note} tone="warning">
              {note}
            </Alert>
          ))}
          <p className="text-sm text-muted-foreground">
            Up to this amount, everything above {formatYen(result.selfBurden)} comes back as a tax
            deduction. Donating more does not give the same benefit: the extra is a plain donation
            with no deduction. Leave a margin, because your real limit depends on your final
            deductions.
          </p>
          <Breakdown result={result} />
          <CopyButton text={summarize(result)} label="Copy summary" />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        This is an educational estimate, not an official calculation or tax advice, and not a
        guaranteed exact limit. Your actual limit depends on your final tax situation and
        deductions. Your municipality or tax office can confirm it.
      </p>

      <SourcesAndAssumptions
        ruleYearLabel="2026 (令和8年)"
        assumptions={ASSUMPTIONS}
        sourceIds={SOURCE_IDS}
      />
    </div>
  );
}
