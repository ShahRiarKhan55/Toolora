/**
 * Japan money & work rules used by the take-home pay, furusato nozei and student work tools.
 *
 * DATA ONLY: no calculation and no React in this folder (calculations: `lib/japanTax.ts`,
 * `lib/japanPayroll.ts`). Every number below is annotated with where it comes from; the full list of
 * sources, with what each one establishes, is in `sources.ts` and is shown to users on each tool page.
 * Rules are bundled, never fetched at runtime. When a new year's rules are published, add a new
 * version of this module and bump the year, do not edit numbers in place without updating the year.
 *
 * Amounts are whole yen. Rates are basis points (1 bp = 0.01%) so no arithmetic needs floating point.
 */

/** The tax year these rules describe: income earned in calendar year 2026 (令和8年分). */
export const JAPAN_MONEY_RULE_YEAR = '2026';
export const JAPAN_MONEY_RULE_YEAR_LABEL = '2026 (令和8年)';
/** Date the sources in `sources.ts` were last read against these numbers. */
export const JAPAN_MONEY_RULES_CHECKED_ON = '2026-10-06';

// --- Employment income deduction (給与所得控除), 令和8年分・令和9年分 -------------------------------
// NTA No.1410. Applies to the 2026 national income tax (in force 2026-12-01) and, from the 令和9年度
// resident tax, to income earned in 2026. Minimum deduction rose from 650,000 to 740,000.
export const EMPLOYMENT_INCOME_DEDUCTION = {
  minimumDeduction: 740_000,
  /** Salary at or above this has a non-zero employment income (NTA No.1410 note 2). */
  zeroIncomeBelow: 741_000,
  /** Salary under this uses NTA note 2's stepped values; at or above it the bracket formulas apply. */
  steppedBelow: 2_200_000,
  /** Note 2: salary in [from, nextFrom) has this employment income (instead of salary − 740,000). */
  steppedIncomes: [
    { from: 2_191_000, income: 1_451_000 },
    { from: 2_193_000, income: 1_453_000 },
    { from: 2_196_000, income: 1_456_000 },
  ],
  /**
   * Below this salary the statutory table applies (NTA No.1410 note 3, 所得税法別表第五): a salary is
   * placed in a ¥4,000 bucket and every salary in the bucket has the income the formula gives for the
   * bucket's lower edge. Verified against the NTA's 令和8年分 table itself (年末調整のしかた, pages 47–54):
   * all 1,080 rows read from it match (see lib/fixtures/nta2026SalaryIncomeTable.ts).
   */
  tableRoundingBelow: 6_600_000,
  tableRoundingStep: 4_000,
  /** Salary above the previous bound, up to `upTo`: income = salary × percent/100 − subtract. */
  formulaBrackets: [
    { upTo: 3_600_000, keepPercent: 70, subtract: 80_000 },
    { upTo: 6_600_000, keepPercent: 80, subtract: 440_000 },
    { upTo: 8_500_000, keepPercent: 90, subtract: 1_100_000 },
  ],
  /** At or above 8,500,001 the deduction is capped. */
  cap: 1_950_000,
} as const;

// --- Basic deduction (基礎控除) for income tax, 令和8年分・令和9年分 -----------------------------------
// NTA No.1199 (read from the page's own table markup). Keyed by total income (合計所得金額).
export const INCOME_TAX_BASIC_DEDUCTION = [
  { upTo: 4_890_000, amount: 1_040_000 },
  { upTo: 6_550_000, amount: 670_000 },
  { upTo: 23_500_000, amount: 620_000 },
  { upTo: 24_000_000, amount: 480_000 },
  { upTo: 24_500_000, amount: 320_000 },
  { upTo: 25_000_000, amount: 160_000 },
] as const;
/** Above the last bracket above. */
export const INCOME_TAX_BASIC_DEDUCTION_ABOVE = 0;
/** The pre-2020 reform base amount, used by the resident-tax "personal deduction difference" rules. */
export const INCOME_TAX_BASIC_DEDUCTION_BASELINE = 480_000;

// --- Income tax (所得税) -----------------------------------------------------------------------------
// NTA No.2260. Taxable income is rounded down to 1,000 yen first.
export const INCOME_TAX_BRACKETS = [
  { upTo: 1_949_999, ratePercent: 5, deduction: 0 },
  { upTo: 3_299_999, ratePercent: 10, deduction: 97_500 },
  { upTo: 6_949_999, ratePercent: 20, deduction: 427_500 },
  { upTo: 8_999_999, ratePercent: 23, deduction: 636_000 },
  { upTo: 17_999_999, ratePercent: 33, deduction: 1_536_000 },
  { upTo: 39_999_999, ratePercent: 40, deduction: 2_796_000 },
] as const;
export const INCOME_TAX_TOP_BRACKET = { ratePercent: 45, deduction: 4_796_000 } as const;
/**
 * 年調年税額 (income tax including reconstruction special income tax) = tax from the table × 102.1%
 * (the 2.1% reconstruction tax applies to 2013–2037 income, NTA No.2260), with a fraction under ¥100
 * rounded down. Source: NTA 令和8年分 年末調整のしかた (手順などの説明). A filed return rounds to ¥100 as well.
 */
export const INCOME_TAX_WITH_RECONSTRUCTION_PERMILLE = 1021;
export const INCOME_TAX_FINAL_ROUNDING = 100;

// --- Resident tax (住民税), 令和9年度 (income earned in 2026) ---------------------------------------------
// Basic deduction for resident tax by total income: ¥430,000 up to ¥24M of total income, as published by
// Sakai City (令和8年度 page). Its being unchanged for 令和9年度 (the 2026-income year) is stated by two
// municipal 令和9年度 pages (Tambasasayama City, Nakasatsunai Village); no 総務省 page was read for it.
// It is a national-law amount, but it was verified only through these municipal pages.
export const RESIDENT_TAX = {
  incomeLevyPercent: 10,
  /**
   * Per-capita levy including the national forest environment tax (¥1,000): ¥3,000 municipal +
   * ¥1,000 prefectural + ¥1,000 forest tax. Many prefectures/cities add to it (e.g. +¥300 Osaka Pref.
   * on Sakai's page, +¥500 Kagoshima Pref. on Kagoshima's page), so this is the national standard only.
   */
  perCapitaStandard: 5_000,
  basicDeduction: [
    { upTo: 24_000_000, amount: 430_000 },
    { upTo: 24_500_000, amount: 290_000 },
    { upTo: 25_000_000, amount: 150_000 },
  ],
  /**
   * No resident tax at all at or below this total income for a single person (Nagoya City, 令和9年度:
   * 前年中の合計所得金額が45万円以下). NOT a nationwide rule: Nakasatsunai Village's 令和9年度 page shows
   * resident tax starting at a salary of ¥1.12M, lower than the ¥1.19M this implies. No source read here
   * gives the rule that sets the limit per municipality, so municipality-specific limits are not modelled.
   */
  nonTaxableTotalIncome: 450_000,
  /**
   * Adjustment credit (調整控除): the basic-deduction difference is fixed at 50,000 for total income up
   * to 25,000,000 (Sakai City, "legacy rules" note); no credit above that.
   */
  adjustment: {
    basicDifference: 50_000,
    maxTotalIncome: 25_000_000,
    creditPercent: 5,
    lowTaxableLimit: 2_000_000,
    minimumCredit: 2_500,
  },
  /** Rounding: resident income levy is rounded down to 100 yen (Sakai City). */
  levyRounding: 100,
} as const;

// --- Social insurance, 令和8年度 --------------------------------------------------------------------------
/**
 * Health insurance grades (標準報酬月額), 50 of them, from the Kyokai Kenpo premium table (2026): monthly pay
 * of `from` yen or more (and below the next grade's `from`) falls in the grade with that standard amount.
 * The bounds are the published ones: up to the ¥1,030,000 grade they sit midway between grades, above it
 * they do not (¥1,055,000 starts the ¥1,090,000 grade), so they are listed rather than derived.
 */
export const HEALTH_GRADES = [
  { standard: 58_000, from: 0 },
  { standard: 68_000, from: 63_000 },
  { standard: 78_000, from: 73_000 },
  { standard: 88_000, from: 83_000 },
  { standard: 98_000, from: 93_000 },
  { standard: 104_000, from: 101_000 },
  { standard: 110_000, from: 107_000 },
  { standard: 118_000, from: 114_000 },
  { standard: 126_000, from: 122_000 },
  { standard: 134_000, from: 130_000 },
  { standard: 142_000, from: 138_000 },
  { standard: 150_000, from: 146_000 },
  { standard: 160_000, from: 155_000 },
  { standard: 170_000, from: 165_000 },
  { standard: 180_000, from: 175_000 },
  { standard: 190_000, from: 185_000 },
  { standard: 200_000, from: 195_000 },
  { standard: 220_000, from: 210_000 },
  { standard: 240_000, from: 230_000 },
  { standard: 260_000, from: 250_000 },
  { standard: 280_000, from: 270_000 },
  { standard: 300_000, from: 290_000 },
  { standard: 320_000, from: 310_000 },
  { standard: 340_000, from: 330_000 },
  { standard: 360_000, from: 350_000 },
  { standard: 380_000, from: 370_000 },
  { standard: 410_000, from: 395_000 },
  { standard: 440_000, from: 425_000 },
  { standard: 470_000, from: 455_000 },
  { standard: 500_000, from: 485_000 },
  { standard: 530_000, from: 515_000 },
  { standard: 560_000, from: 545_000 },
  { standard: 590_000, from: 575_000 },
  { standard: 620_000, from: 605_000 },
  { standard: 650_000, from: 635_000 },
  { standard: 680_000, from: 665_000 },
  { standard: 710_000, from: 695_000 },
  { standard: 750_000, from: 730_000 },
  { standard: 790_000, from: 770_000 },
  { standard: 830_000, from: 810_000 },
  { standard: 880_000, from: 855_000 },
  { standard: 930_000, from: 905_000 },
  { standard: 980_000, from: 955_000 },
  { standard: 1_030_000, from: 1_005_000 },
  { standard: 1_090_000, from: 1_055_000 },
  { standard: 1_150_000, from: 1_115_000 },
  { standard: 1_210_000, from: 1_175_000 },
  { standard: 1_270_000, from: 1_235_000 },
  { standard: 1_330_000, from: 1_295_000 },
  { standard: 1_390_000, from: 1_355_000 },
] as const;
/**
 * Employees' pension uses the same grades from ¥88,000 (grade 1, pay under ¥93,000) to ¥650,000 (grade 32,
 * pay of ¥635,000 or more): the Japan Pension Service table.
 */
export const PENSION_STANDARD_REMUNERATION_RANGE = { min: 88_000, max: 650_000 } as const;

export const SOCIAL_INSURANCE_RATES = {
  /** Employees' pension, total 18.300% (Japan Pension Service); the employee pays half. */
  pensionTotalBp: 1830,
  /** Child and child-rearing support levy (子ども・子育て支援金), total 0.23% from April 2026 (Kyokai Kenpo). */
  childSupportTotalBp: 23,
  /** Long-term care insurance, total 1.62%, for ages 40 to 64 (Kyokai Kenpo). */
  careTotalBp: 162,
  /** Employment insurance (一般の事業), employee share 0.5% (5/1,000), 令和8年度 (MHLW). */
  employmentInsuranceEmployeeBp: 50,
  careFromAge: 40,
  careUntilAge: 64,
} as const;

export interface PrefectureRate {
  id: string;
  name: string;
  /** Kyokai Kenpo health insurance rate (total, employer + employee), 令和8年度, in basis points. */
  healthTotalBp: number;
}

/** 協会けんぽ 令和8年度 prefecture rates (effective March 2026 pay). Other insurers (健保組合 etc.) differ. */
export const PREFECTURES: readonly PrefectureRate[] = [
  { id: 'hokkaido', name: 'Hokkaido', healthTotalBp: 1028 },
  { id: 'aomori', name: 'Aomori', healthTotalBp: 985 },
  { id: 'iwate', name: 'Iwate', healthTotalBp: 951 },
  { id: 'miyagi', name: 'Miyagi', healthTotalBp: 1010 },
  { id: 'akita', name: 'Akita', healthTotalBp: 1001 },
  { id: 'yamagata', name: 'Yamagata', healthTotalBp: 975 },
  { id: 'fukushima', name: 'Fukushima', healthTotalBp: 950 },
  { id: 'ibaraki', name: 'Ibaraki', healthTotalBp: 952 },
  { id: 'tochigi', name: 'Tochigi', healthTotalBp: 982 },
  { id: 'gunma', name: 'Gunma', healthTotalBp: 968 },
  { id: 'saitama', name: 'Saitama', healthTotalBp: 967 },
  { id: 'chiba', name: 'Chiba', healthTotalBp: 973 },
  { id: 'tokyo', name: 'Tokyo', healthTotalBp: 985 },
  { id: 'kanagawa', name: 'Kanagawa', healthTotalBp: 992 },
  { id: 'niigata', name: 'Niigata', healthTotalBp: 921 },
  { id: 'toyama', name: 'Toyama', healthTotalBp: 959 },
  { id: 'ishikawa', name: 'Ishikawa', healthTotalBp: 970 },
  { id: 'fukui', name: 'Fukui', healthTotalBp: 971 },
  { id: 'yamanashi', name: 'Yamanashi', healthTotalBp: 955 },
  { id: 'nagano', name: 'Nagano', healthTotalBp: 963 },
  { id: 'gifu', name: 'Gifu', healthTotalBp: 980 },
  { id: 'shizuoka', name: 'Shizuoka', healthTotalBp: 961 },
  { id: 'aichi', name: 'Aichi', healthTotalBp: 993 },
  { id: 'mie', name: 'Mie', healthTotalBp: 977 },
  { id: 'shiga', name: 'Shiga', healthTotalBp: 988 },
  { id: 'kyoto', name: 'Kyoto', healthTotalBp: 989 },
  { id: 'osaka', name: 'Osaka', healthTotalBp: 1013 },
  { id: 'hyogo', name: 'Hyogo', healthTotalBp: 1012 },
  { id: 'nara', name: 'Nara', healthTotalBp: 991 },
  { id: 'wakayama', name: 'Wakayama', healthTotalBp: 1006 },
  { id: 'tottori', name: 'Tottori', healthTotalBp: 986 },
  { id: 'shimane', name: 'Shimane', healthTotalBp: 994 },
  { id: 'okayama', name: 'Okayama', healthTotalBp: 1005 },
  { id: 'hiroshima', name: 'Hiroshima', healthTotalBp: 978 },
  { id: 'yamaguchi', name: 'Yamaguchi', healthTotalBp: 1015 },
  { id: 'tokushima', name: 'Tokushima', healthTotalBp: 1024 },
  { id: 'kagawa', name: 'Kagawa', healthTotalBp: 1002 },
  { id: 'ehime', name: 'Ehime', healthTotalBp: 998 },
  { id: 'kochi', name: 'Kochi', healthTotalBp: 1005 },
  { id: 'fukuoka', name: 'Fukuoka', healthTotalBp: 1011 },
  { id: 'saga', name: 'Saga', healthTotalBp: 1055 },
  { id: 'nagasaki', name: 'Nagasaki', healthTotalBp: 1006 },
  { id: 'kumamoto', name: 'Kumamoto', healthTotalBp: 1008 },
  { id: 'oita', name: 'Oita', healthTotalBp: 1008 },
  { id: 'miyazaki', name: 'Miyazaki', healthTotalBp: 977 },
  { id: 'kagoshima', name: 'Kagoshima', healthTotalBp: 1013 },
  { id: 'okinawa', name: 'Okinawa', healthTotalBp: 944 },
];
export const DEFAULT_PREFECTURE_ID = 'tokyo';

// --- Furusato nozei (ふるさと納税) ----------------------------------------------------------------------
// 総務省 "税金の控除について" + Sakai City's published rate table.
export const FURUSATO = {
  /** Self-borne amount. */
  selfBurden: 2_000,
  /** The special resident-tax deduction is capped at 20% of the resident income levy. */
  specialDeductionCapPercent: 20,
  /** Resident-tax special deduction rate = 90% − (income tax rate × 1.021). */
  baseRatePercent: 90,
  /** Donations counted for the basic part are capped at 30% of total income (総所得金額等). */
  donationCapPercentOfIncome: 30,
  /**
   * Rate bracket is chosen from (resident taxable income − personal-deduction differences −
   * (income tax basic deduction − 480,000)), inclusive upper bounds as in Sakai City's table.
   */
  rateBrackets: [
    { upTo: 1_950_000, ratePercent: 5 },
    { upTo: 3_300_000, ratePercent: 10 },
    { upTo: 6_950_000, ratePercent: 20 },
    { upTo: 9_000_000, ratePercent: 23 },
    { upTo: 18_000_000, ratePercent: 33 },
    { upTo: 40_000_000, ratePercent: 40 },
  ],
  topRatePercent: 45,
} as const;

// --- Household deductions the furusato estimator supports ------------------------------------------------
// Income tax amounts: NTA No.1180 (扶養控除), No.1191 (配偶者控除). Resident tax amounts and the
// "difference" used by the adjustment credit: Sakai City's table.
export const PERSONAL_DEDUCTIONS = {
  /** Spouse deduction by the taxpayer's own total income (配偶者控除, spouse total income ≤ 620,000). */
  spouse: [
    { upTo: 9_000_000, incomeTax: 380_000, resident: 330_000, difference: 50_000 },
    { upTo: 9_500_000, incomeTax: 260_000, resident: 220_000, difference: 40_000 },
    { upTo: 10_000_000, incomeTax: 130_000, resident: 110_000, difference: 20_000 },
  ],
  /** General dependant aged 16+ (not 19–22, not 70+). */
  dependantGeneral: { incomeTax: 380_000, resident: 330_000, difference: 50_000 },
  /** Specific dependant aged 19–22 (特定扶養親族). */
  dependantSpecific: { incomeTax: 630_000, resident: 450_000, difference: 180_000 },
  /** Dependant/spouse income test (給与のみ: salary ≤ 1,360,000), 令和8年分 / 令和9年度. */
  dependantMaxTotalIncome: 620_000,
  dependantMaxSalary: 1_360_000,
} as const;

// --- Student work limits ----------------------------------------------------------------------------------
// Each is a separate system; none implies another. Salary = gross wages for the calendar year.
export const STUDENT_RULES = {
  immigration: {
    /** 留学 / 家族滞在 with comprehensive permission: 1 week, all jobs combined (ISA). */
    weeklyHoursLimit: 28,
    /** 留学 only: during a long vacation set by the school, per day (ISA). */
    vacationDailyHoursLimit: 8,
  },
  tax: {
    /** Resident tax: none on salary at or below this (Nagoya City, 令和9年度; other municipalities can differ). */
    residentTaxFreeSalary: 1_190_000,
    /** Dependant of a relative (扶養): salary at or below this (NTA No.1180, 令和8年分). */
    dependantSalary: 1_360_000,
    /** 勤労学生控除 (working student deduction): salary at or below this (NTA No.1175, 令和8年分). */
    workingStudentSalary: 1_630_000,
    /** Own income tax starts above this salary: 740,000 + 1,040,000 (NTA No.1410 and No.1199). */
    incomeTaxStartsAbove: 1_780_000,
    /** 特定親族特別控除 for age 19–22: relative's deduction phases out up to this salary (NTA No.1177). */
    specificRelativeMaxSalary: 1_970_000,
  },
  socialInsurance: {
    /** Health insurance as someone's dependant: expected annual income below this (JPS, from 2026-04-01). */
    healthDependantIncomeUnder: 1_300_000,
    /** Same, for ages 19–22 who are not the insured person's spouse. */
    healthDependantIncomeUnderAge19To22: 1_500_000,
  },
} as const;
