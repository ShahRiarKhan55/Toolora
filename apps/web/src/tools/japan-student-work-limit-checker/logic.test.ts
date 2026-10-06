import { describe, expect, it } from 'vitest';
import { DEFAULT_STUDENT_INPUT, checkStudentWork, summarize } from './logic';
import type { StudentInput, StudentResult, ThresholdSystem } from './logic';

function run(overrides: Partial<StudentInput> = {}): StudentResult {
  const outcome = checkStudentWork({
    ...DEFAULT_STUDENT_INPUT,
    weeklyHours: '20',
    annualIncome: '1000000',
    ...overrides,
  });
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.value;
}

function status(result: StudentResult, system: ThresholdSystem) {
  return result.thresholds.find((t) => t.system === system)?.status;
}

describe('immigration work hours (student visa with permission)', () => {
  it.each([
    ['0', 'within'],
    ['27', 'within'],
    ['27.5', 'within'],
    ['28', 'within'], // exactly at the limit is allowed
    ['28.5', 'over'],
    ['29', 'over'],
    ['40', 'over'],
  ])('%s hours a week is %s', (hours, verdict) => {
    expect(run({ weeklyHours: hours }).immigration.verdict).toBe(verdict);
  });

  it('uses 8 hours a day instead of the weekly limit during a long vacation', () => {
    const base = { longVacation: true, weeklyHours: '40' };
    expect(run({ ...base, longestDayHours: '8' }).immigration.verdict).toBe('within');
    expect(run({ ...base, longestDayHours: '8.5' }).immigration.verdict).toBe('over');
    expect(run({ ...base, longestDayHours: '0' }).immigration.verdict).toBe('within');
  });

  it('ignores the vacation flag for the other statuses', () => {
    const r = run({ status: 'dependant-permitted', longVacation: true, weeklyHours: '30' });
    expect(r.immigration.verdict).toBe('over');
  });
});

describe('immigration rules by status', () => {
  it('applies 28 hours to the dependant visa, with no long-vacation exception', () => {
    expect(run({ status: 'dependant-permitted', weeklyHours: '28' }).immigration.verdict).toBe(
      'within',
    );
    const over = run({ status: 'dependant-permitted', weeklyHours: '28.1' }).immigration;
    expect(over.verdict).toBe('over');
    expect(over.detail).toContain('no long-vacation exception');
  });

  it('says work is not permitted without permission, but not when there is no work', () => {
    expect(run({ status: 'student-no-permission', weeklyHours: '1' }).immigration.verdict).toBe(
      'not-permitted',
    );
    expect(run({ status: 'student-no-permission', weeklyHours: '0' }).immigration.verdict).toBe(
      'within',
    );
  });

  it('has no hour limit for unrestricted statuses, however many hours', () => {
    expect(run({ status: 'unrestricted', weeklyHours: '60' }).immigration.verdict).toBe('no-limit');
  });

  it('declines to judge another or unknown status', () => {
    expect(run({ status: 'other', weeklyHours: '10' }).immigration.verdict).toBe('unknown');
  });
});

describe('tax and insurance lines never collapse into one number', () => {
  it('reports six separate lines, each with its own limit text and source', () => {
    const r = run();
    expect(r.thresholds.map((t) => t.system)).toEqual([
      'resident-tax',
      'income-tax',
      'working-student',
      'dependant',
      'specific-relative',
      'health-dependant',
    ]);
    expect(new Set(r.thresholds.map((t) => t.limitText)).size).toBe(6);
    for (const t of r.thresholds) expect(t.sourceIds.length).toBeGreaterThan(0);
  });

  it('flips resident tax exactly at ¥1,190,000', () => {
    expect(status(run({ annualIncome: '1190000' }), 'resident-tax')).toBe('within');
    expect(status(run({ annualIncome: '1190001' }), 'resident-tax')).toBe('beyond');
  });

  it('flips income tax exactly at ¥1,780,000', () => {
    expect(status(run({ annualIncome: '1780000' }), 'income-tax')).toBe('within');
    expect(status(run({ annualIncome: '1780001' }), 'income-tax')).toBe('beyond');
  });

  it('flips the working student deduction exactly at ¥1,630,000', () => {
    expect(status(run({ annualIncome: '1630000' }), 'working-student')).toBe('within');
    expect(status(run({ annualIncome: '1630001' }), 'working-student')).toBe('beyond');
  });

  it('flips tax dependant status exactly at ¥1,360,000', () => {
    expect(status(run({ annualIncome: '1360000' }), 'dependant')).toBe('within');
    expect(status(run({ annualIncome: '1360001' }), 'dependant')).toBe('beyond');
  });

  it('treats health insurance dependants as strictly under ¥1,300,000', () => {
    expect(status(run({ annualIncome: '1299999' }), 'health-dependant')).toBe('within');
    expect(status(run({ annualIncome: '1300000', age: '25' }), 'health-dependant')).toBe('beyond');
  });

  it('raises the health insurance limit to ¥1,500,000 for ages 19–22', () => {
    expect(status(run({ annualIncome: '1400000', age: '20' }), 'health-dependant')).toBe('within');
    expect(status(run({ annualIncome: '1499999', age: '22' }), 'health-dependant')).toBe('within');
    expect(status(run({ annualIncome: '1500000', age: '20' }), 'health-dependant')).toBe('beyond');
    expect(status(run({ annualIncome: '1400000', age: '23' }), 'health-dependant')).toBe('beyond');
    // age unknown and between the two limits: it depends on the age, so ask
    expect(status(run({ annualIncome: '1400000', age: '' }), 'health-dependant')).toBe('needs-age');
  });

  it('applies the specific relative special deduction only to ages 19–22, up to ¥1,970,000', () => {
    expect(status(run({ annualIncome: '1500000', age: '20' }), 'specific-relative')).toBe('within');
    expect(status(run({ annualIncome: '1970000', age: '19' }), 'specific-relative')).toBe('within');
    expect(status(run({ annualIncome: '1970001', age: '19' }), 'specific-relative')).toBe('beyond');
    expect(status(run({ annualIncome: '1500000', age: '23' }), 'specific-relative')).toBe(
      'not-applicable',
    );
    expect(status(run({ annualIncome: '1500000', age: '18' }), 'specific-relative')).toBe(
      'not-applicable',
    );
    expect(status(run({ annualIncome: '1500000', age: '' }), 'specific-relative')).toBe(
      'needs-age',
    );
  });

  it('combines systems that disagree at the same income', () => {
    // ¥1,500,000: above resident tax and dependant limits, still inside working student, income tax and
    // (for a 20-year-old) the specific relative and health insurance limits.
    const r = run({ annualIncome: '1500000', age: '20' });
    expect(status(r, 'resident-tax')).toBe('beyond');
    expect(status(r, 'dependant')).toBe('beyond');
    expect(status(r, 'working-student')).toBe('within');
    expect(status(r, 'income-tax')).toBe('within');
    expect(status(r, 'specific-relative')).toBe('within');
    expect(status(r, 'health-dependant')).toBe('beyond'); // 1,500,000 is not under 1,500,000
  });

  it('does not apply family lines when no relative supports you', () => {
    const r = run({ supportedByRelative: 'no', annualIncome: '900000', age: '20' });
    for (const system of ['dependant', 'specific-relative', 'health-dependant'] as const) {
      expect(status(r, system)).toBe('not-applicable');
    }
    expect(status(r, 'resident-tax')).toBe('within'); // own-tax lines still apply
  });

  it('marks someone under 16 as not a tax dependant', () => {
    expect(status(run({ age: '15', annualIncome: '500000' }), 'dependant')).toBe('not-applicable');
    expect(status(run({ age: '16', annualIncome: '500000' }), 'dependant')).toBe('within');
  });

  it('handles zero pay and very large pay', () => {
    const none = run({ annualIncome: '0', weeklyHours: '0' });
    expect(status(none, 'resident-tax')).toBe('within');
    expect(status(none, 'health-dependant')).toBe('within');
    const big = run({ annualIncome: '500000000' });
    expect(status(big, 'income-tax')).toBe('beyond');
  });
});

describe('employer social insurance: separate conditions, no wage threshold (2026-10-01)', () => {
  const condition = (r: StudentResult, id: string) => r.socialInsurance.find((c) => c.id === id)!;

  it('lists the weekly-hours, employer-size, student, wage and other-routes conditions separately', () => {
    expect(run().socialInsurance.map((c) => c.id)).toEqual([
      'weekly-hours',
      'employer-size',
      'student',
      'wage-requirement',
      'other-routes',
    ]);
  });

  it('shows the ¥88,000 monthly wage requirement as abolished, never as a current threshold', () => {
    const wage = condition(run(), 'wage-requirement');
    expect(wage.status).toBe('abolished');
    expect(wage.detail).toContain('abolished on 1 October 2026');
    expect(wage.detail).toContain('does not decide eligibility');
    // no other condition mentions a wage amount as a requirement
    for (const c of run().socialInsurance.filter((x) => x.id !== 'wage-requirement')) {
      expect(c.detail, c.id).not.toMatch(/¥88,000/);
      expect(c.title, c.id).not.toMatch(/¥/);
    }
  });

  it('does not depend on pay at all: every condition is identical at ¥0 and at ¥10,000,000', () => {
    const none = run({ annualIncome: '0', weeklyHours: '24', employerSize: 'over50' });
    const lots = run({ annualIncome: '10000000', weeklyHours: '24', employerSize: 'over50' });
    expect(lots.socialInsurance).toEqual(none.socialInsurance);
    // including around the old ¥88,000 × 12 and the ¥1.06M "106万円" level
    for (const income of ['1055999', '1056000', '1059999', '1060000']) {
      expect(run({ annualIncome: income, weeklyHours: '24' }).socialInsurance).toEqual(
        run({ annualIncome: '0', weeklyHours: '24' }).socialInsurance,
      );
    }
  });

  it('flips the 20-hour condition exactly at 20 hours a week', () => {
    expect(condition(run({ weeklyHours: '19' }), 'weekly-hours').status).toBe('not-met');
    expect(condition(run({ weeklyHours: '19.5' }), 'weekly-hours').status).toBe('not-met');
    expect(condition(run({ weeklyHours: '19.99' }), 'weekly-hours').status).toBe('not-met');
    expect(condition(run({ weeklyHours: '20' }), 'weekly-hours').status).toBe('met');
    expect(condition(run({ weeklyHours: '20.5' }), 'weekly-hours').status).toBe('met');
    expect(condition(run({ weeklyHours: '0' }), 'weekly-hours').status).toBe('not-met');
    expect(condition(run({ weeklyHours: '168' }), 'weekly-hours').status).toBe('met');
  });

  it('says the hours condition is about scheduled hours at one employer', () => {
    expect(condition(run({ weeklyHours: '25' }), 'weekly-hours').detail).toContain('one employer');
  });

  it('keeps employer size separate: 51 or more, 50 or fewer, or unknown', () => {
    expect(condition(run({ employerSize: 'over50' }), 'employer-size').status).toBe('met');
    expect(condition(run({ employerSize: 'under51' }), 'employer-size').status).toBe('not-met');
    expect(condition(run({ employerSize: 'unsure' }), 'employer-size').status).toBe('unknown');
  });

  it('keeps the student exclusion in force whatever the hours and employer size are', () => {
    for (const weeklyHours of ['0', '19', '20', '40']) {
      for (const employerSize of ['over50', 'under51', 'unsure'] as const) {
        const r = run({ weeklyHours, employerSize });
        expect(condition(r, 'student').status).toBe('applies');
        expect(condition(r, 'student').detail).toContain('students are not enrolled');
      }
    }
  });

  it('combines every condition independently (20 hours, large employer, student)', () => {
    const r = run({ weeklyHours: '30', employerSize: 'over50' });
    expect(condition(r, 'weekly-hours').status).toBe('met');
    expect(condition(r, 'employer-size').status).toBe('met');
    expect(condition(r, 'student').status).toBe('applies'); // met conditions do not undo the exclusion
    expect(condition(r, 'wage-requirement').status).toBe('abolished');
  });

  it('cites the Japan Pension Service for the 2026-10-01 change', () => {
    for (const c of run().socialInsurance) expect(c.sourceIds.length).toBeGreaterThan(0);
    expect(condition(run(), 'wage-requirement').sourceIds).toContain('jpsWageRequirement');
  });

  it('puts the exclusion and the wage change in the copied summary without calling it an income limit', () => {
    const text = summarize(run());
    expect(text).toContain('students are excluded');
    expect(text).toContain('wage requirement ended on 1 October 2026');
    expect(text).toContain('not an income limit');
  });
});

describe('validation', () => {
  const error = (overrides: Partial<StudentInput>) => {
    const outcome = checkStudentWork({
      ...DEFAULT_STUDENT_INPUT,
      weeklyHours: '20',
      annualIncome: '1000000',
      ...overrides,
    });
    return outcome.ok ? 'ok' : outcome.error;
  };

  it('rejects empty and invalid hours', () => {
    expect(error({ weeklyHours: '' })).toBe('hours-empty');
    expect(error({ weeklyHours: 'abc' })).toBe('hours-invalid');
    expect(error({ weeklyHours: '-3' })).toBe('hours-invalid');
    expect(error({ weeklyHours: '169' })).toBe('hours-invalid');
    expect(error({ weeklyHours: '168' })).toBe('ok');
  });

  it('requires and validates the daily hours only for a long vacation', () => {
    expect(error({ longVacation: true, longestDayHours: '' })).toBe('day-hours-empty');
    expect(error({ longVacation: true, longestDayHours: '25' })).toBe('day-hours-invalid');
    expect(error({ longVacation: true, longestDayHours: '24' })).toBe('ok');
    expect(error({ longVacation: false, longestDayHours: 'junk' })).toBe('ok');
    expect(error({ status: 'dependant-permitted', longVacation: true, longestDayHours: '' })).toBe(
      'ok',
    );
  });

  it('rejects empty, negative, fractional and oversized pay', () => {
    expect(error({ annualIncome: '' })).toBe('income-empty');
    expect(error({ annualIncome: '-1' })).toBe('income-invalid');
    expect(error({ annualIncome: '1.5' })).toBe('income-invalid');
    expect(error({ annualIncome: 'many' })).toBe('income-invalid');
    expect(error({ annualIncome: '1000000001' })).toBe('income-too-large');
  });

  it('allows a blank age and rejects a bad one', () => {
    expect(error({ age: '' })).toBe('ok');
    expect(error({ age: 'x' })).toBe('age-invalid');
    expect(error({ age: '-1' })).toBe('age-invalid');
    expect(error({ age: '19.5' })).toBe('age-invalid');
    expect(error({ age: '121' })).toBe('age-invalid');
  });
});

describe('summary', () => {
  it('lists the rules year, the immigration verdict and each applicable line', () => {
    const text = summarize(run({ annualIncome: '1500000', age: '20' }));
    expect(text).toContain('2026 (令和8年)');
    expect(text).toContain('Immigration: Within 28 hours a week');
    expect(text).toContain('Resident tax');
    expect(text).toContain('not legal or immigration advice');
  });
});
