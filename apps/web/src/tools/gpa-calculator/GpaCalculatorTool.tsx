import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import { CloseIcon } from '../../components/ui/icons';
import {
  calculateGpa,
  COURSE_ERROR_MESSAGES,
  DEFAULT_GRADE_SCALE,
  GPA_ERROR_MESSAGES,
} from './logic';
import type { CourseError, CourseInput } from './logic';

function newCourse(): CourseInput {
  return { id: crypto.randomUUID(), name: '', credits: '3', grade: DEFAULT_GRADE_SCALE[0]!.grade };
}

export function GpaCalculatorTool() {
  const [courses, setCourses] = useState<CourseInput[]>([newCourse(), newCourse()]);
  const [result, setResult] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Readonly<Record<string, CourseError>>>({});

  function updateCourse(id: string, patch: Partial<CourseInput>) {
    setCourses((previous) => previous.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addCourse() {
    setCourses((previous) => [...previous, newCourse()]);
  }

  function removeCourse(id: string) {
    setCourses((previous) => previous.filter((c) => c.id !== id));
  }

  function handleCalculate() {
    const outcome = calculateGpa(courses);
    if (!outcome.ok) {
      setResult(null);
      setFormError(GPA_ERROR_MESSAGES[outcome.error]);
      setIssues(outcome.issues);
      return;
    }
    setFormError(null);
    setIssues({});
    setResult(outcome.value.gpa.toFixed(2));
  }

  function handleReset() {
    setCourses([newCourse(), newCourse()]);
    setResult(null);
    setFormError(null);
    setIssues({});
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {courses.map((course, index) => {
          const error = issues[course.id];
          const creditsError =
            error === 'invalid-credits' || error === 'negative-credits'
              ? COURSE_ERROR_MESSAGES[error]
              : undefined;
          const gradeError = error === 'unknown-grade' ? COURSE_ERROR_MESSAGES[error] : undefined;
          return (
            <div
              key={course.id}
              className="grid gap-3 rounded-control border border-border p-4 sm:grid-cols-[1fr_140px_140px_auto] sm:items-start"
            >
              <Input
                label={`Course ${index + 1} name`}
                value={course.name}
                onChange={(event) => updateCourse(course.id, { name: event.target.value })}
                placeholder={`Course ${index + 1}`}
              />
              <Input
                label="Credits"
                inputMode="decimal"
                value={course.credits}
                onChange={(event) => updateCourse(course.id, { credits: event.target.value })}
                error={creditsError}
              />
              <Select
                label="Grade"
                value={course.grade}
                onChange={(event) => updateCourse(course.id, { grade: event.target.value })}
                error={gradeError}
              >
                {DEFAULT_GRADE_SCALE.map((entry) => (
                  <option key={entry.grade} value={entry.grade}>
                    {entry.grade} ({entry.points.toFixed(1)})
                  </option>
                ))}
              </Select>
              <div className="flex items-end sm:pb-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCourse(course.id)}
                  disabled={courses.length <= 1}
                  aria-label={`Remove course ${index + 1}`}
                >
                  <CloseIcon className="size-4" />
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={addCourse}>
          Add course
        </Button>
        <Button onClick={handleCalculate}>Calculate GPA</Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {formError && (
        <Alert tone="error" title="Could not calculate GPA">
          {formError}
        </Alert>
      )}

      {result && !formError && <ResultBox label="Weighted GPA" value={result} />}
    </div>
  );
}
