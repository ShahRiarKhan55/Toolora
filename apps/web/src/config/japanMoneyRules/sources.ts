/**
 * Where each rule in `rules.ts` comes from, and what the source actually establishes. Shown to users
 * ("Sources and assumptions") so the numbers can be checked, not just trusted.
 */

export type RuleScope =
  | 'nationwide'
  | 'insurer' // depends on the health insurer (this tool assumes Kyokai Kenpo)
  | 'municipality'; // depends on the city/prefecture

export interface RuleSource {
  publisher: string;
  /** The rule year the source states (or the date its guidance applies from). */
  ruleYear: string;
  title: string;
  url: string;
  /** What this source establishes, in one line. */
  establishes: string;
  scope: RuleScope;
}

export const SOURCES = {
  ntaEmploymentIncomeDeduction: {
    ruleYear: '2026 (令和8年分・9年分)',
    publisher: 'National Tax Agency',
    title: 'No.1410 Employment income deduction (給与所得控除)',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1410.htm',
    establishes:
      'The 2026–2027 deduction table: minimum ¥740,000, brackets at ¥2.2M, ¥3.6M, ¥6.6M and ¥8.5M, cap ¥1.95M.',
    scope: 'nationwide',
  },
  ntaBasicDeduction: {
    ruleYear: '2026 (令和8年分, in force 2026-12-01)',
    publisher: 'National Tax Agency',
    title: 'No.1199 Basic deduction (基礎控除)',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1199.htm',
    establishes:
      'The 2026 income-tax basic deduction by total income (¥1.04M up to ¥4.89M; effective 1 December 2026).',
    scope: 'nationwide',
  },
  ntaIncomeTaxRates: {
    ruleYear: '2026 (as of 2026-04-01)',
    publisher: 'National Tax Agency',
    title: 'No.2260 Income tax rates (所得税の税率)',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm',
    establishes: 'The seven brackets (5%–45%) and the 2.1% reconstruction special income tax.',
    scope: 'nationwide',
  },
  ntaYearEndProcedure: {
    ruleYear: '2026 (令和8年分)',
    publisher: 'National Tax Agency',
    title: '令和８年分 年末調整のしかた（手順などの説明）',
    url: 'https://www.nta.go.jp/users/gensen/nencho/index/shikata.htm',
    establishes:
      'The year-end adjustment procedure: taxable income is rounded down below ¥1,000, the tax is computed, then multiplied by 102.1% (reconstruction tax included), and the final amount is rounded down below ¥100.',
    scope: 'nationwide',
  },
  ntaYearEndTable: {
    ruleYear: '2026 (令和8年分)',
    publisher: 'National Tax Agency',
    title: '令和8年分 年末調整のしかた (pages 47–54): 給与所得控除後の給与等の金額の表',
    url: 'https://www.nta.go.jp/publication/pamph/gensen/nencho2026/pdf/nencho_all.pdf',
    establishes:
      'The 令和8年分 table of employment income by salary in ¥4,000 steps below ¥6.6M (the table this tool\u2019s salary calculation is checked against).',
    scope: 'nationwide',
  },
  ntaDependants: {
    ruleYear: '2026 (令和8年分)',
    publisher: 'National Tax Agency',
    title: 'No.1180 Dependant deduction (扶養控除)',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1180.htm',
    establishes:
      'Deduction amounts (¥380,000 general, ¥630,000 for ages 19–22) and the 2026 income test: total income ¥620,000 (salary ¥1.36M).',
    scope: 'nationwide',
  },
  ntaSpouse: {
    ruleYear: '2026 (令和8年分)',
    publisher: 'National Tax Agency',
    title: 'No.1191 Spouse deduction (配偶者控除)',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1191.htm',
    establishes: 'Spouse deduction ¥380,000 / ¥260,000 / ¥130,000 by the taxpayer’s own income.',
    scope: 'nationwide',
  },
  ntaWorkingStudent: {
    ruleYear: '2026 (令和8年分)',
    publisher: 'National Tax Agency',
    title: 'No.1175 Working student deduction (勤労学生控除)',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1175.htm',
    establishes:
      '¥270,000 deduction for a student with total income up to ¥890,000 from 2026 (salary ¥1.63M) and other income up to ¥100,000.',
    scope: 'nationwide',
  },
  ntaSpecificRelative: {
    ruleYear: '2026 (令和8年分)',
    publisher: 'National Tax Agency',
    title: 'No.1177 Specific relative special deduction (特定親族特別控除)',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1177.htm',
    establishes:
      'For a relative aged 19–22 earning more than the dependant limit, the supporter’s deduction steps down from ¥630,000 until salary reaches ¥1.97M.',
    scope: 'nationwide',
  },
  kyokaiKenpoRates: {
    ruleYear: '2026 (令和8年度)',
    publisher: 'Japan Health Insurance Association (協会けんぽ)',
    title: '令和8年度 health insurance rates by prefecture',
    url: 'https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/rate_prefectures/r08/index.html',
    establishes:
      'Prefecture health insurance rates for 2026, the 0.23% child support levy and the 1.62% care insurance rate. Other insurers use their own rates.',
    scope: 'insurer',
  },
  jpsPensionTable: {
    ruleYear: '2026 (令和8年度)',
    publisher: 'Japan Pension Service',
    title: '保険料額表（令和8年度）',
    url: 'https://www.nenkin.go.jp/service/kounen/hokenryo/ryogaku/ryogakuhyo/20200825.files/R08ryougaku.pdf',
    establishes:
      'Employees’ pension rate 18.300% (employee half 9.150%) and the 32 grades up to ¥650,000.',
    scope: 'nationwide',
  },
  jpsRounding: {
    ruleYear: 'current guidance',
    publisher: 'Japan Pension Service',
    title: '保険料の計算方法',
    url: 'https://www.nenkin.go.jp/service/kounen/hokenryo/nofu/20121026.html',
    establishes:
      'When the employer deducts the employee share from pay, 50 sen or less is rounded down and more than 50 sen is rounded up (unless agreed otherwise).',
    scope: 'nationwide',
  },
  mhlwEmploymentInsurance: {
    ruleYear: '2026 (令和8年度)',
    publisher: 'Ministry of Health, Labour and Welfare',
    title: '令和8年度の雇用保険料率について',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000108634.html',
    establishes:
      'General-business employment insurance rate: employee 5/1,000 (0.5%), employer 8.5/1,000 plus 3.5/1,000.',
    scope: 'nationwide',
  },
  kagoshimaResident: {
    ruleYear: '令和8年度',
    publisher: 'Kagoshima City',
    title: '令和8年度個人住民税（市民税・県民税）・森林環境税の概要',
    url: 'https://www.city.kagoshima.lg.jp/soumu/zeimu/shiminzei/kurashi/zekin/shiminze/gaiyo.html',
    establishes:
      'Resident tax is based on the previous year\u2019s income, is split into a per-capita levy and an income levy, and prefectures can add to the per-capita amount (¥500 in Kagoshima).',
    scope: 'municipality',
  },
  nakasatsunaiResident2027: {
    ruleYear: '令和9年度 (income earned in 2026)',
    publisher: 'Nakasatsunai Village',
    title: '令和9年度から適用される個人住民税（村道民税）の主な税制改正',
    url: 'https://www.vill.nakasatsunai.hokkaido.jp/kurashi/zeikin/zyuuminzei/r9_jyuminzei_kaisei/',
    establishes:
      'From 令和9年度 the resident-tax basic deduction is unchanged; in this municipality resident tax starts at a salary of ¥1.12M, lower than the ¥1.19M of a standard municipality.',
    scope: 'municipality',
  },
  nagoyaResident2027: {
    ruleYear: '令和9年度 (income earned in 2026)',
    publisher: 'Nagoya City',
    title: '令和9年度以降適用される市民税・県民税に関する主な税制改正',
    url: 'https://www.city.nagoya.jp/kurashi/zeikin/1037356/1011880/1011899/1045304.html',
    establishes:
      'From 令和9年度 resident tax (2026 income): minimum employment income deduction ¥740,000, no resident tax at salary ¥1.19M or less, dependant income test ¥1.36M, working student ¥1.63M.',
    scope: 'municipality',
  },
  sakaiResident: {
    ruleYear: '令和8年度 page; the mechanics are unchanged for 令和9年度',
    publisher: 'Sakai City',
    title: '令和8年度の税額の計算方法',
    url: 'https://www.city.sakai.lg.jp/kurashi/zei/shizei/kojin/keisan/r3keisan.html',
    establishes:
      'Resident tax mechanics: the tax is computed on the previous year\u2019s income (前年の所得金額); 10% income levy, ¥430,000 basic deduction, adjustment credit, ¥100 rounding, and the furusato nozei special-deduction rate table. Per-capita amounts vary by prefecture.',
    scope: 'municipality',
  },
  soumuFurusato: {
    ruleYear: 'current guidance (2026)',
    publisher: 'Ministry of Internal Affairs and Communications',
    title: 'ふるさと納税のしくみ：税金の控除について',
    url: 'https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/mechanism/deduction.html',
    establishes:
      'The deduction formulas: ¥2,000 self-borne, 10% basic part, special part 100% − 10% − income tax rate, capped at 20% of the resident income levy.',
    scope: 'nationwide',
  },
  isaStudentPermission: {
    ruleYear: 'current guidance (2026)',
    publisher: 'Immigration Services Agency of Japan',
    title: '「留学」の在留資格に係る資格外活動許可について',
    url: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00003.html',
    establishes:
      'With comprehensive permission, up to 28 hours per week (up to 8 hours per day during a school’s long vacation); work outside that needs individual permission.',
    scope: 'nationwide',
  },
  isaDependantPermission: {
    ruleYear: 'current guidance (2026)',
    publisher: 'Immigration Services Agency of Japan',
    title: '「家族滞在」の在留資格に係る資格外活動許可について',
    url: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00004.html',
    establishes:
      'Comprehensive permission for 家族滞在 is limited to 28 hours per week and to workplaces that are not 風俗営業.',
    scope: 'nationwide',
  },
  isaPermissionOverview: {
    ruleYear: 'current guidance (2026)',
    publisher: 'Immigration Services Agency of Japan',
    title: '資格外活動の許可（入管法第19条）',
    url: 'https://www.moj.go.jp/isa/applications/procedures/shikakugai_00001.html',
    establishes:
      'Holders of permanent resident, spouse of a Japanese national, and similar (Annex 2) statuses have no work restrictions and need no such permission.',
    scope: 'nationwide',
  },
  jpsWageRequirement: {
    ruleYear: '2026 (from 2026-10-01)',
    publisher: 'Japan Pension Service',
    title: '2026（令和8）年10月に社会保険の短時間労働者に係る賃金要件が撤廃されました',
    url: 'https://www.nenkin.go.jp/oshirase/taisetu/jigyosho/2026/202610/100104.html',
    establishes:
      'The ¥88,000 monthly wage requirement ended on 1 October 2026; the 20-hour, 51-employee and "not a student" conditions remain.',
    scope: 'nationwide',
  },
  jpsEnrolmentOverride: {
    ruleYear: 'current guidance (2026)',
    publisher: 'Japan Pension Service',
    title: '健康保険の被扶養者の年収要件に変更はありますか（よくある質問）',
    url: 'https://www.nenkin.go.jp/section/faq/kounen/tekiyoukakudai/tanjikan/fuyounintei.html',
    establishes:
      'Income under ¥1.3M does not by itself keep someone a dependant: a person who meets the three-quarters standard or the four conditions becomes an insured employee instead.',
    scope: 'nationwide',
  },
  jpsDependantInsurance: {
    ruleYear: '2026 (from 2026-04-01)',
    publisher: 'Japan Pension Service',
    title: '労働契約内容による年間収入での被扶養者の認定の取り扱いについて',
    url: 'https://www.nenkin.go.jp/oshirase/taisetu/jigyosho/2026/202605/0501.html',
    establishes:
      'From 1 April 2026, expected annual income under ¥1.3M (¥1.5M for ages 19–22 who are not the insured person’s spouse) is the income test for health-insurance dependants.',
    scope: 'nationwide',
  },
} as const satisfies Record<string, RuleSource>;

export type SourceId = keyof typeof SOURCES;
