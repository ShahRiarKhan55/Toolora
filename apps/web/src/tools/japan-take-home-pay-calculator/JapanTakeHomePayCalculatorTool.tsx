import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { CopyButton } from '../../components/ui/CopyButton';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import { SourcesAndAssumptions } from '../../components/tool/SourcesAndAssumptions';
import { PREFECTURES } from '../../config/japanMoneyRules';
import type { PayrollResult } from '../../lib/japanPayroll';
import {
  DEFAULT_TAKE_HOME_INPUT,
  TAKE_HOME_ERROR_MESSAGES,
  estimateTakeHome,
  formatYen,
  summarize,
} from './logic';
import type { SalaryBasis, TakeHomeInput } from './logic';

const ASSUMPTIONS = [
  'One employee on 12 equal monthly payments with no bonus. An annual salary is split into 12.',
  'No spouse, dependants or deductions beyond social insurance and the basic deduction (no home loan, iDeCo, medical or life-insurance deductions).',
  'Health insurance uses Kyokai Kenpo (協会けんぽ) rates for the prefecture you choose, plus the 0.23% child support levy. A company health society (健保組合) has its own rate.',
  'Income tax is the full-year amount under the 2026 rules, which take effect on 1 December 2026, worked out as year-end adjustment does: taxable income rounded down to ¥1,000, the tax multiplied by 102.1% (reconstruction tax included), the result rounded down to ¥100. Monthly withholding during the year can differ and is settled at year-end adjustment.',
  'Resident tax is a steady-state estimate: it applies the rules for income earned in 2026 (令和9年度) to the income you enter, as if you earned the same the year before. Resident tax actually billed in a year generally reflects the previous year’s income, so your real bill can differ, and your municipality sets the final amount. It assumes the amounts these city pages publish (Sakai, Nagoya): a 10% income levy, a ¥430,000 basic deduction, no resident tax at ¥450,000 of employment income or less (a salary of about ¥1.19M) and a ¥5,000 per-capita levy. These are not nationwide rules: some municipalities start taxing at a lower income (a Hokkaido village starts at a salary of ¥1.12M) and many prefectures and cities add to the per-capita levy. Municipality-specific rules are not modelled, so this is not an exact municipal assessment.',
  'Insurance lines are estimates of the employee share, rounded the way employers deduct it (50 sen or less down). Employers may round each line or combine them differently, so a payslip can differ by about ¥1 per month per line.',
  'Employment insurance is the general-business employee rate of 0.5%; agriculture, construction and some other industries differ.',
];

const SOURCE_IDS = [
  'ntaEmploymentIncomeDeduction',
  'ntaBasicDeduction',
  'ntaIncomeTaxRates',
  'ntaYearEndProcedure',
  'ntaYearEndTable',
  'kyokaiKenpoRates',
  'jpsPensionTable',
  'jpsRounding',
  'mhlwEmploymentInsurance',
  'nagoyaResident2027',
  'nakasatsunaiResident2027',
  'sakaiResident',
  'kagoshimaResident',
] as const;

type Row = { label: string; monthly: number; annual: number; hint?: string };

function breakdownRows(result: PayrollResult): Row[] {
  const si = result.socialInsurance;
  const taxes = result.taxes;
  return [
    {
      label: 'Health insurance',
      monthly: result.monthly.health,
      annual: si.healthAnnual,
      hint: si.careApplies
        ? 'includes child support levy and long-term care insurance (age 40–64)'
        : 'includes the child support levy',
    },
    { label: 'Employees’ pension', monthly: result.monthly.pension, annual: si.pensionAnnual },
    {
      label: 'Employment insurance',
      monthly: result.monthly.employment,
      annual: si.employmentAnnual,
    },
    {
      label: 'Income tax',
      monthly: result.monthly.incomeTax,
      annual: result.incomeTaxAnnual,
      hint: `incl. 2.1% reconstruction tax, rounded down to ¥100; taxable income ${formatYen(taxes.incomeTax.taxableIncome)}`,
    },
    {
      label: 'Resident tax (steady-state estimate)',
      monthly: result.monthly.residentTax,
      annual: result.residentTaxAnnual,
      hint: taxes.residentTax.exempt
        ? 'none at this income; based on the entered income, not last year’s'
        : `based on the entered income, not last year’s; taxable income ${formatYen(taxes.residentTax.taxableIncome)}`,
    },
  ];
}

export function JapanTakeHomePayCalculatorTool() {
  const [input, setInput] = useState<TakeHomeInput>(DEFAULT_TAKE_HOME_INPUT);
  const [result, setResult] = useState<PayrollResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof TakeHomeInput>(key: K, value: TakeHomeInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function calculate() {
    const outcome = estimateTakeHome(input);
    if (!outcome.ok) {
      setResult(null);
      setError(TAKE_HOME_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(outcome.value);
  }

  function reset() {
    setInput(DEFAULT_TAKE_HOME_INPUT);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          calculate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Salary entered as"
            value={input.basis}
            onChange={(event) => update('basis', event.target.value as SalaryBasis)}
          >
            <option value="monthly">Monthly salary (before deductions)</option>
            <option value="annual">Annual salary (before deductions)</option>
          </Select>
          <Input
            label={input.basis === 'monthly' ? 'Monthly salary (JPY)' : 'Annual salary (JPY)'}
            inputMode="numeric"
            autoComplete="off"
            value={input.salary}
            onChange={(event) => update('salary', event.target.value)}
            placeholder={input.basis === 'monthly' ? '300000' : '3600000'}
            hint="Gross pay including regular allowances, before tax and insurance."
          />
          <Input
            label="Age"
            inputMode="numeric"
            autoComplete="off"
            value={input.age}
            onChange={(event) => update('age', event.target.value)}
            hint="Long-term care insurance is added from age 40."
          />
          <Select
            label="Health insurance prefecture"
            value={input.prefectureId}
            onChange={(event) => update('prefectureId', event.target.value)}
            hint="Kyokai Kenpo rate for your employer's prefecture."
          >
            {PREFECTURES.map((prefecture) => (
              <option key={prefecture.id} value={prefecture.id}>
                {prefecture.name}
              </option>
            ))}
          </Select>
        </div>

        <fieldset className="space-y-1">
          <legend className="text-sm font-semibold">Insurance assumptions</legend>
          <Checkbox
            label="Enrolled in health insurance and employees' pension (社会保険)"
            hint="clear this if your employer does not enrol you"
            checked={input.socialInsurance}
            onChange={(event) => update('socialInsurance', event.target.checked)}
          />
          <Checkbox
            label="Covered by employment insurance (雇用保険)"
            checked={input.employmentInsurance}
            onChange={(event) => update('employmentInsurance', event.target.checked)}
          />
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <Button type="submit">Calculate</Button>
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
      </form>

      {error && (
        <Alert tone="error" title="Could not calculate">
          {error}
        </Alert>
      )}

      {result && !error && (
        <div className="space-y-4">
          <p className="text-sm font-semibold">
            Estimated take-home pay · rules year {result.ruleYearLabel}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <ResultBox
              label="Estimated take-home per month"
              value={formatYen(result.monthly.takeHome)}
              copyLabel="Copy monthly take-home"
            />
            <ResultBox
              label="Estimated take-home per year"
              value={formatYen(result.takeHomeAnnual)}
              copyLabel="Copy annual take-home"
            />
          </div>

          <p className="text-sm font-semibold">Estimated employee deductions</p>
          <div className="overflow-x-auto rounded-control border border-border">
            <table className="w-full text-sm">
              <caption className="sr-only">Estimated employee deductions from salary</caption>
              <thead className="bg-surface-muted text-left">
                <tr>
                  <th scope="col" className="px-2 py-2 sm:px-3 font-semibold">
                    Item
                  </th>
                  <th scope="col" className="px-2 py-2 sm:px-3 text-right font-semibold">
                    Per month
                  </th>
                  <th scope="col" className="px-2 py-2 sm:px-3 text-right font-semibold">
                    Per year
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <th scope="row" className="px-2 py-2 sm:px-3 text-left font-semibold">
                    Salary before deductions
                  </th>
                  <td className="px-2 py-2 sm:px-3 text-right">
                    {formatYen(result.monthly.gross)}
                  </td>
                  <td className="px-2 py-2 sm:px-3 text-right">{formatYen(result.annualSalary)}</td>
                </tr>
                {breakdownRows(result).map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="px-2 py-2 sm:px-3 text-left font-normal">
                      − {row.label}
                      {row.hint && (
                        <span className="block text-xs text-muted-foreground">{row.hint}</span>
                      )}
                    </th>
                    <td className="px-2 py-2 sm:px-3 text-right">{formatYen(row.monthly)}</td>
                    <td className="px-2 py-2 sm:px-3 text-right">{formatYen(row.annual)}</td>
                  </tr>
                ))}
                <tr className="bg-surface-muted font-semibold">
                  <th scope="row" className="px-2 py-2 sm:px-3 text-left">
                    Estimated take-home
                  </th>
                  <td className="px-2 py-2 sm:px-3 text-right">
                    {formatYen(result.monthly.takeHome)}
                  </td>
                  <td className="px-2 py-2 sm:px-3 text-right">
                    {formatYen(result.takeHomeAnnual)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Monthly figures are the yearly amount divided by 12 and rounded to the yen, so lines may
            differ by a few yen. Insurance lines are estimates of the employee share; payroll
            rounding can make a payslip differ by about ¥1 per month per line.
          </p>
          <Alert tone="info" title="Resident tax is a steady-state estimate">
            It applies the 2026-income rules to the income you entered, as if you earned the same
            the year before. Resident tax actually billed in a year generally reflects the previous
            year&rsquo;s income, so the real amount can differ, and your municipality sets the final
            figure.
          </Alert>
          <CopyButton text={summarize(result)} label="Copy summary" />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        This is an estimate, not an official tax calculation. Real payroll deductions vary with your
        municipality, insurer, employer, age, employment status, dependants, bonuses and other
        circumstances. Check your payslip or ask your employer for the exact figures.
      </p>

      <SourcesAndAssumptions
        ruleYearLabel="2026 (令和8年)"
        assumptions={ASSUMPTIONS}
        sourceIds={SOURCE_IDS}
      />
    </div>
  );
}
