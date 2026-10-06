import { describe, expect, it } from 'vitest';
import {
  EMPLOYMENT_INCOME_DEDUCTION,
  HEALTH_GRADES,
  INCOME_TAX_BRACKETS,
  JAPAN_MONEY_RULE_YEAR,
  JAPAN_MONEY_RULE_YEAR_LABEL,
  PENSION_STANDARD_REMUNERATION_RANGE,
  PREFECTURES,
  SOURCES,
} from '.';

describe('japan money rules data', () => {
  it('carries an explicit rule year that its label repeats', () => {
    expect(JAPAN_MONEY_RULE_YEAR).toBe('2026');
    expect(JAPAN_MONEY_RULE_YEAR_LABEL).toContain(JAPAN_MONEY_RULE_YEAR);
  });

  it('has 50 strictly increasing health grades, 32 of which are pension grades', () => {
    expect(HEALTH_GRADES).toHaveLength(50);
    for (let i = 1; i < HEALTH_GRADES.length; i += 1) {
      expect(HEALTH_GRADES[i]!.standard).toBeGreaterThan(HEALTH_GRADES[i - 1]!.standard);
      expect(HEALTH_GRADES[i]!.from).toBeGreaterThan(HEALTH_GRADES[i - 1]!.from);
      // a grade starts below its own standard amount and above the previous grade's
      expect(HEALTH_GRADES[i]!.from).toBeLessThan(HEALTH_GRADES[i]!.standard);
      expect(HEALTH_GRADES[i]!.from).toBeGreaterThan(HEALTH_GRADES[i - 1]!.standard);
    }
    const { min, max } = PENSION_STANDARD_REMUNERATION_RANGE;
    expect(HEALTH_GRADES.filter((g) => g.standard >= min && g.standard <= max)).toHaveLength(32);
  });

  it('has income tax brackets that rise in rate and in bound', () => {
    for (let i = 1; i < INCOME_TAX_BRACKETS.length; i += 1) {
      expect(INCOME_TAX_BRACKETS[i]!.ratePercent).toBeGreaterThan(
        INCOME_TAX_BRACKETS[i - 1]!.ratePercent,
      );
      expect(INCOME_TAX_BRACKETS[i]!.upTo).toBeGreaterThan(INCOME_TAX_BRACKETS[i - 1]!.upTo);
    }
    expect(EMPLOYMENT_INCOME_DEDUCTION.minimumDeduction).toBe(740_000);
  });

  it('ties every rule used for the 2026 calculations to a 2026 (or 令和8/9) source', () => {
    const needs2026 = [
      'ntaEmploymentIncomeDeduction',
      'ntaBasicDeduction',
      'ntaIncomeTaxRates',
      'ntaYearEndProcedure',
      'ntaYearEndTable',
      'jpsWageRequirement',
      'jpsDependantInsurance',
      'kyokaiKenpoRates',
      'mhlwEmploymentInsurance',
      'nagoyaResident2027',
    ] as const;
    for (const id of needs2026)
      expect(SOURCES[id].ruleYear, id).toMatch(/2026|令和[89]年|令和9年度/);
  });

  it('has unique prefecture ids', () => {
    expect(new Set(PREFECTURES.map((p) => p.id)).size).toBe(PREFECTURES.length);
  });

  it('cites an official https source for every rule, with a stated scope', () => {
    for (const [id, source] of Object.entries(SOURCES)) {
      const url = new URL(source.url);
      expect(url.protocol, id).toBe('https:');
      // government (go.jp), public bodies (or.jp), local governments (lg.jp or www.city.<name>.jp)
      expect(url.hostname, id).toMatch(
        /(\.go\.jp|\.or\.jp|\.lg\.jp|^www\.(city|vill)\.[a-z.]+\.jp)$/,
      );
      expect(source.establishes.length, id).toBeGreaterThan(20);
      expect(source.ruleYear.length, id).toBeGreaterThan(3);
      expect(['nationwide', 'insurer', 'municipality']).toContain(source.scope);
    }
  });
});
