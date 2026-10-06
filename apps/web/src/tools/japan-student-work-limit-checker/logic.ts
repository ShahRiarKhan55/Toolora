import { JAPAN_MONEY_RULE_YEAR_LABEL, STUDENT_RULES } from '../../config/japanMoneyRules';
import type { SourceId } from '../../config/japanMoneyRules';
import { parseWholeYen } from '../../lib/japanPayroll';

/**
 * The checker keeps four different systems apart on purpose: immigration work permission, income
 * tax and resident tax, health insurance as a dependant, and the employer's own social insurance.
 * Each has its own rule, year, definition of "income" and consequence, so nothing here adds them
 * into a single "student limit".
 */

export const STATUS_OPTIONS = [
  {
    id: 'student-permitted',
    label: 'Student visa (留学) with permission to work (資格外活動許可)',
  },
  {
    id: 'student-no-permission',
    label: 'Student visa (留学) without that permission yet',
  },
  {
    id: 'dependant-permitted',
    label: 'Dependant visa (家族滞在) with permission to work',
  },
  {
    id: 'unrestricted',
    label:
      'Japanese national, permanent resident, spouse of a Japanese national or long-term resident (定住者)',
  },
  { id: 'other', label: 'Another status, or not sure' },
] as const;
export type ResidenceStatus = (typeof STATUS_OPTIONS)[number]['id'];

export type Support = 'yes' | 'no' | 'unsure';

/** One of the short-time-worker social insurance conditions: the employer has 51 or more employees. */
export type EmployerSize = 'over50' | 'under51' | 'unsure';

export interface StudentInput {
  status: ResidenceStatus;
  weeklyHours: string;
  longVacation: boolean;
  longestDayHours: string;
  annualIncome: string;
  /** Age on 31 December of the year, optional. */
  age: string;
  supportedByRelative: Support;
  employerSize: EmployerSize;
}

export const DEFAULT_STUDENT_INPUT: StudentInput = {
  status: 'student-permitted',
  weeklyHours: '',
  longVacation: false,
  longestDayHours: '',
  annualIncome: '',
  age: '',
  supportedByRelative: 'yes',
  employerSize: 'unsure',
};

export type StudentError =
  | 'hours-empty'
  | 'hours-invalid'
  | 'day-hours-empty'
  | 'day-hours-invalid'
  | 'income-empty'
  | 'income-invalid'
  | 'income-too-large'
  | 'age-invalid';

export const STUDENT_ERROR_MESSAGES: Record<StudentError, string> = {
  'hours-empty': 'Enter your working hours per week (0 if you do not work).',
  'hours-invalid': 'Enter hours per week as a number from 0 to 168, such as 24 or 27.5.',
  'day-hours-empty': 'Enter your longest working day in hours.',
  'day-hours-invalid': 'Enter hours per day as a number from 0 to 24.',
  'income-empty': 'Enter your total pay from work this year, in yen (0 if none).',
  'income-invalid': 'Enter your yearly pay in yen as a whole number, such as 1200000.',
  'income-too-large': 'That amount is too large to check.',
  'age-invalid': 'Leave age blank or enter whole years, such as 20.',
};

export type ImmigrationVerdict = 'no-limit' | 'within' | 'over' | 'not-permitted' | 'unknown';

export interface ImmigrationFinding {
  verdict: ImmigrationVerdict;
  headline: string;
  detail: string;
  sourceIds: readonly SourceId[];
}

export type ThresholdSystem =
  | 'resident-tax'
  | 'income-tax'
  | 'working-student'
  | 'dependant'
  | 'specific-relative'
  | 'health-dependant';

/** `within` / `beyond` compare your yearly pay with the limit; the others say why that is not asked. */
export type ThresholdStatus = 'within' | 'beyond' | 'not-applicable' | 'needs-age';

export interface ThresholdFinding {
  system: ThresholdSystem;
  title: string;
  /** e.g. "up to ¥1,190,000" or "under ¥1,300,000". */
  limitText: string;
  status: ThresholdStatus;
  /** What being within / beyond the limit means for this system only. */
  meaning: string;
  /** What this system counts as income. */
  incomeBasis: string;
  sourceIds: readonly SourceId[];
}

/**
 * Your own employer's health insurance and employees' pension for short-time workers. These are separate
 * conditions, listed one by one: none of them is an income limit. Since 2026-10-01 the ¥88,000 monthly wage
 * requirement no longer exists (Japan Pension Service), so pay is not among them.
 */
export type SocialInsuranceConditionId =
  'weekly-hours' | 'employer-size' | 'student' | 'wage-requirement' | 'other-routes';

export type SocialInsuranceConditionStatus =
  | 'met'
  | 'not-met'
  | 'unknown'
  /** The condition applies to you as stated (the student exclusion). */
  | 'applies'
  /** The condition no longer exists. */
  | 'abolished'
  | 'info';

export interface SocialInsuranceCondition {
  id: SocialInsuranceConditionId;
  title: string;
  status: SocialInsuranceConditionStatus;
  detail: string;
  sourceIds: readonly SourceId[];
}

export interface StudentResult {
  ruleYearLabel: string;
  weeklyHours: number;
  annualIncome: number;
  immigration: ImmigrationFinding;
  thresholds: ThresholdFinding[];
  /** Your own employer's social insurance, as separate conditions (never one income figure). */
  socialInsurance: SocialInsuranceCondition[];
}

export type StudentOutcome =
  { ok: true; value: StudentResult } | { ok: false; error: StudentError };

function parseHours(text: string, max: number): number | undefined {
  const cleaned = text.trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return undefined;
  const value = Number(cleaned);
  return value <= max ? value : undefined;
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('en-US')}`;
}

function immigrationFinding(
  input: StudentInput,
  weeklyHours: number,
  longestDayHours: number | undefined,
): ImmigrationFinding {
  const { weeklyHoursLimit, vacationDailyHoursLimit } = STUDENT_RULES.immigration;
  switch (input.status) {
    case 'unrestricted':
      return {
        verdict: 'no-limit',
        headline: 'No immigration work-hour limit for this status',
        detail:
          'Permanent residents, spouses of Japanese nationals and long-term residents have no restriction on the work they may do, so the 28-hour rule does not apply. Employers, schools and the tax and insurance rules below still apply.',
        sourceIds: ['isaPermissionOverview'],
      };
    case 'student-no-permission':
      return weeklyHours > 0
        ? {
            verdict: 'not-permitted',
            headline: 'Work is not permitted until you hold the permission',
            detail:
              'A student visa does not by itself allow paid work. You need permission to engage in activity other than that permitted by your status (資格外活動許可) before you start, even for a few hours. Apply to the Immigration Services Agency.',
            sourceIds: ['isaStudentPermission'],
          }
        : {
            verdict: 'within',
            headline: 'You are not working, so there is nothing to exceed',
            detail:
              'You will need permission (資格外活動許可) before you take any paid work on a student visa.',
            sourceIds: ['isaStudentPermission'],
          };
    case 'student-permitted': {
      if (input.longVacation) {
        const day = longestDayHours ?? 0;
        return day <= vacationDailyHoursLimit
          ? {
              verdict: 'within',
              headline: `Within ${vacationDailyHoursLimit} hours a day for a long vacation`,
              detail: `During a long vacation set by your school, comprehensive permission allows up to ${vacationDailyHoursLimit} hours a day instead of ${weeklyHoursLimit} a week. Your longest day is ${day} hours.`,
              sourceIds: ['isaStudentPermission'],
            }
          : {
              verdict: 'over',
              headline: `Over ${vacationDailyHoursLimit} hours on your longest day`,
              detail: `Comprehensive permission allows up to ${vacationDailyHoursLimit} hours a day during a long vacation. ${day} hours in a day is outside it. Working outside your permission can affect your status of residence.`,
              sourceIds: ['isaStudentPermission'],
            };
      }
      return weeklyHours <= weeklyHoursLimit
        ? {
            verdict: 'within',
            headline: `Within ${weeklyHoursLimit} hours a week`,
            detail: `Comprehensive permission allows up to ${weeklyHoursLimit} hours a week, with every job added together. ${weeklyHours} hours a week is inside it.`,
            sourceIds: ['isaStudentPermission'],
          }
        : {
            verdict: 'over',
            headline: `Over ${weeklyHoursLimit} hours a week`,
            detail: `Comprehensive permission allows up to ${weeklyHoursLimit} hours a week across all jobs. ${weeklyHours} hours is outside it. Working outside your permission can affect your status of residence; individual permission exists for some cases such as required training.`,
            sourceIds: ['isaStudentPermission'],
          };
    }
    case 'dependant-permitted':
      return weeklyHours <= weeklyHoursLimit
        ? {
            verdict: 'within',
            headline: `Within ${weeklyHoursLimit} hours a week`,
            detail: `Comprehensive permission for the dependant visa allows up to ${weeklyHoursLimit} hours a week, and not at a workplace that is a 風俗営業 business. There is no long-vacation exception for this status. ${weeklyHours} hours a week is inside the limit.`,
            sourceIds: ['isaDependantPermission'],
          }
        : {
            verdict: 'over',
            headline: `Over ${weeklyHoursLimit} hours a week`,
            detail: `Comprehensive permission for the dependant visa allows up to ${weeklyHoursLimit} hours a week. ${weeklyHours} hours is outside it, and this status has no long-vacation exception.`,
            sourceIds: ['isaDependantPermission'],
          };
    default:
      return {
        verdict: 'unknown',
        headline: 'Cannot say for this status',
        detail:
          'The work you may do depends on your exact status of residence and any permission stamped on your card. Check your residence card and ask the Immigration Services Agency.',
        sourceIds: ['isaPermissionOverview'],
      };
  }
}

const IS_AGE_19_TO_22 = (age: number | undefined) => age !== undefined && age >= 19 && age <= 22;

function thresholdFindings(
  income: number,
  age: number | undefined,
  supported: Support,
): ThresholdFinding[] {
  const tax = STUDENT_RULES.tax;
  const insurance = STUDENT_RULES.socialInsurance;
  const atOrBelow = (limit: number): ThresholdStatus => (income <= limit ? 'within' : 'beyond');
  const supportRelevant = supported !== 'no';
  const supportNote = supported === 'unsure' ? ' (only if a relative does support you)' : '';

  const dependantStatus: ThresholdStatus =
    !supportRelevant || (age !== undefined && age < 16)
      ? 'not-applicable'
      : atOrBelow(tax.dependantSalary);

  const specificStatus: ThresholdStatus = !supportRelevant
    ? 'not-applicable'
    : age === undefined
      ? 'needs-age'
      : IS_AGE_19_TO_22(age)
        ? atOrBelow(tax.specificRelativeMaxSalary)
        : 'not-applicable';

  const healthLimit = IS_AGE_19_TO_22(age)
    ? insurance.healthDependantIncomeUnderAge19To22
    : insurance.healthDependantIncomeUnder;
  const healthStatus: ThresholdStatus = !supportRelevant
    ? 'not-applicable'
    : age === undefined &&
        income >= insurance.healthDependantIncomeUnder &&
        income < insurance.healthDependantIncomeUnderAge19To22
      ? 'needs-age'
      : income < healthLimit
        ? 'within'
        : 'beyond';

  return [
    {
      system: 'resident-tax',
      title: 'Resident tax (住民税)',
      limitText: `up to ${formatYen(tax.residentTaxFreeSalary)}`,
      status: atOrBelow(tax.residentTaxFreeSalary),
      meaning:
        'Within: no resident tax is expected where the exemption limit is the one Nagoya City states. Beyond: you are likely to be charged resident tax, at least the per-capita levy. This is not a nationwide rule: some municipalities use a lower limit, so check your own city.',
      incomeBasis: 'Wages for the calendar year, billed the following year.',
      sourceIds: ['nagoyaResident2027'],
    },
    {
      system: 'income-tax',
      title: 'Income tax (所得税), your own',
      limitText: `up to ${formatYen(tax.incomeTaxStartsAbove)}`,
      status: atOrBelow(tax.incomeTaxStartsAbove),
      meaning:
        'Within: no national income tax is due on wages alone (social-insurance premiums you pay only widen this). Beyond: income tax starts on the part above.',
      incomeBasis: 'Wages for the calendar year, before any deductions.',
      sourceIds: ['ntaEmploymentIncomeDeduction', 'ntaBasicDeduction'],
    },
    {
      system: 'working-student',
      title: 'Working student deduction (勤労学生控除)',
      limitText: `up to ${formatYen(tax.workingStudentSalary)}`,
      status: atOrBelow(tax.workingStudentSalary),
      meaning:
        'Within: you may qualify for the ¥270,000 deduction, if your school counts and other income is ¥100,000 or less. Beyond: you cannot claim it.',
      incomeBasis: 'Wages for the calendar year; total income of ¥890,000 or less.',
      sourceIds: ['ntaWorkingStudent', 'nagoyaResident2027'],
    },
    {
      system: 'dependant',
      title: `Counted as a tax dependant (扶養控除)${supportNote}`,
      limitText: `up to ${formatYen(tax.dependantSalary)}`,
      status: dependantStatus,
      meaning:
        'Within: a relative who supports you can claim a dependant deduction for you (¥380,000, or ¥630,000 if you are 19–22), which lowers their tax. Beyond: they cannot claim the dependant deduction. This is about their tax, not yours. Dependants must be 16 or older.',
      incomeBasis: 'Wages for the calendar year (total income of ¥620,000 or less).',
      sourceIds: ['ntaDependants'],
    },
    {
      system: 'specific-relative',
      title: `Specific relative special deduction (特定親族特別控除, ages 19–22)${supportNote}`,
      limitText: `up to ${formatYen(tax.specificRelativeMaxSalary)}`,
      status: specificStatus,
      meaning: `Within: a relative who supports you can still claim a reduced deduction (from ¥630,000 down to ¥30,000) even above the ${formatYen(tax.dependantSalary)} dependant limit. Beyond: no deduction. Only for ages 19 to 22 on 31 December.`,
      incomeBasis: 'Wages for the calendar year (total income of ¥1,230,000 or less).',
      sourceIds: ['ntaSpecificRelative'],
    },
    {
      system: 'health-dependant',
      title: `Health insurance as someone's dependant (被扶養者)${supportNote}`,
      limitText: `under ${formatYen(healthLimit)}${IS_AGE_19_TO_22(age) ? ' (ages 19–22)' : ` (${formatYen(insurance.healthDependantIncomeUnderAge19To22)} if aged 19–22)`}`,
      status: healthStatus,
      meaning:
        'Within: you may stay on a relative’s employer health insurance, if you also meet the insurer’s other tests, such as earning less than half of the insured person’s income if you live together. Beyond: you would normally need your own coverage. This is separate from the tax dependant rules and the income is counted differently.',
      incomeBasis:
        'Expected yearly income judged by the insurer, which can include commuting allowances that tax does not count.',
      sourceIds: ['jpsDependantInsurance'],
    },
  ];
}

export const WEEKLY_HOURS_FOR_SOCIAL_INSURANCE = 20;

function socialInsuranceConditions(
  weeklyHours: number,
  employerSize: EmployerSize,
): SocialInsuranceCondition[] {
  return [
    {
      id: 'weekly-hours',
      title: `Scheduled work of ${WEEKLY_HOURS_FOR_SOCIAL_INSURANCE} hours or more a week`,
      status: weeklyHours >= WEEKLY_HOURS_FOR_SOCIAL_INSURANCE ? 'met' : 'not-met',
      detail: `The condition is about the hours scheduled with one employer, not hours actually worked in a week or across several jobs. You entered ${weeklyHours} hours, so it looks ${weeklyHours >= WEEKLY_HOURS_FOR_SOCIAL_INSURANCE ? 'met' : 'not met'} on those numbers.`,
      sourceIds: ['jpsWageRequirement'],
    },
    {
      id: 'employer-size',
      title: 'Employer with 51 or more employees',
      status:
        employerSize === 'over50' ? 'met' : employerSize === 'under51' ? 'not-met' : 'unknown',
      detail:
        employerSize === 'unsure'
          ? 'Your employer\u2019s size decides this. Ask your employer or check your workplace\u2019s enrolment notice.'
          : 'This is the employer-size condition for short-time workers as it stands in 2026.',
      sourceIds: ['jpsWageRequirement'],
    },
    {
      id: 'student',
      title: 'Not a student',
      status: 'applies',
      detail:
        'Being a student is an exclusion: under this short-time-worker route, students are not enrolled whatever the other conditions say. This checker assumes you count as a student; which students count is for your employer and the Japan Pension Service to confirm.',
      sourceIds: ['jpsWageRequirement'],
    },
    {
      id: 'wage-requirement',
      title: 'Monthly wage of ¥88,000 or more',
      status: 'abolished',
      detail:
        'No longer a condition. The ¥88,000 monthly wage requirement was abolished on 1 October 2026, so your pay does not decide eligibility under this rule and is not compared with any wage figure here.',
      sourceIds: ['jpsWageRequirement'],
    },
    {
      id: 'other-routes',
      title: 'Other enrolment rules',
      status: 'info',
      detail:
        'Separate rules decide enrolment for people who work close to full-time hours (the three-quarters standard) and for workers with a minimum-wage reduction permit (these are in principle outside enrolment but may ask to join). Ask your employer how they apply to you.',
      sourceIds: ['jpsEnrolmentOverride', 'jpsWageRequirement'],
    },
  ];
}

export function checkStudentWork(input: StudentInput): StudentOutcome {
  if (input.weeklyHours.trim() === '') return { ok: false, error: 'hours-empty' };
  const weeklyHours = parseHours(input.weeklyHours, 168);
  if (weeklyHours === undefined) return { ok: false, error: 'hours-invalid' };

  let longestDayHours: number | undefined;
  if (input.status === 'student-permitted' && input.longVacation) {
    if (input.longestDayHours.trim() === '') return { ok: false, error: 'day-hours-empty' };
    longestDayHours = parseHours(input.longestDayHours, 24);
    if (longestDayHours === undefined) return { ok: false, error: 'day-hours-invalid' };
  }

  if (input.annualIncome.trim() === '') return { ok: false, error: 'income-empty' };
  const annualIncome = parseWholeYen(input.annualIncome);
  if (annualIncome === undefined) return { ok: false, error: 'income-invalid' };
  if (annualIncome > 1_000_000_000) return { ok: false, error: 'income-too-large' };

  let age: number | undefined;
  if (input.age.trim() !== '') {
    if (!/^\d+$/.test(input.age.trim()) || Number(input.age.trim()) > 120) {
      return { ok: false, error: 'age-invalid' };
    }
    age = Number(input.age.trim());
  }

  return {
    ok: true,
    value: {
      ruleYearLabel: JAPAN_MONEY_RULE_YEAR_LABEL,
      weeklyHours,
      annualIncome,
      immigration: immigrationFinding(input, weeklyHours, longestDayHours),
      thresholds: thresholdFindings(annualIncome, age, input.supportedByRelative),
      socialInsurance: socialInsuranceConditions(weeklyHours, input.employerSize),
    },
  };
}

export function summarize(result: StudentResult): string {
  const lines = [
    `Student work check (${result.ruleYearLabel} rules), ${result.weeklyHours} hours a week, ${formatYen(result.annualIncome)} a year:`,
    `Immigration: ${result.immigration.headline}.`,
    ...result.thresholds
      .filter((t) => t.status === 'within' || t.status === 'beyond')
      .map(
        (t) =>
          `${t.title}: ${t.status === 'within' ? 'within' : 'above'} the limit (${t.limitText}).`,
      ),
    'Employer social insurance: students are excluded; the ¥88,000 wage requirement ended on 1 October 2026 and is not an income limit.',
    'An educational check, not legal or immigration advice.',
  ];
  return lines.join('\n');
}
