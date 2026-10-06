import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Choose your status of residence and enter your weekly hours and this year's pay.</li>
      <li>
        Add your age and whether a relative supports you if you want the family-related checks.
      </li>
      <li>Select Check to see each system's limit and where your numbers sit against it.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        There is no single "student work limit" in Japan. This checker shows four different systems
        side by side, because each has its own rule, its own definition of income and its own
        consequence: immigration permission to work (hours per week), income tax and resident tax
        (yearly pay), tax and health-insurance dependant status (what a supporting relative can
        claim or keep), and your employer's own social insurance (which treats students separately).
      </p>
      <p>
        For international students on a student visa with permission to work, the Immigration
        Services Agency allows up to 28 hours a week across all jobs, or up to 8 hours a day during
        a school's long vacation. That is a rule about your status and has nothing to do with how
        much you earn. The tax and insurance limits, such as ¥1.19 million for resident tax, ¥1.36
        million for dependant status and ¥1.78 million for your own income tax, concern money, and
        crossing one does not cross another.
      </p>
      <p>
        The numbers describe 2026 (令和8年) rules, including this year's tax reform. The checker is
        educational and is not legal, tax or immigration advice. Individual situations, such as
        individual permission, a school that does not qualify for the working student deduction, or
        a municipality with a lower resident-tax limit, can differ.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Is there one income limit for students working in Japan?',
      answer: (
        <p>
          No. Resident tax, income tax, dependant status for a supporting relative and health
          insurance dependant status each use a different limit, and the immigration rule is about
          hours, not income. Going over one limit has a different consequence from going over
          another.
        </p>
      ),
    },
    {
      question: 'Does the 28-hour rule apply to all foreign students?',
      answer: (
        <p>
          It applies to students on the student visa (留学) and to dependants (家族滞在) who hold
          comprehensive permission. Permanent residents, spouses of Japanese nationals and long-term
          residents have no such restriction, and other statuses have their own rules.
        </p>
      ),
    },
    {
      question: 'Is anything I enter sent or saved?',
      answer: <p>No. The check runs in your browser and nothing you type is sent or stored.</p>,
    },
  ],
};
