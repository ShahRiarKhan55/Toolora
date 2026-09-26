// Shared by Input, Textarea and Select so every form control looks and behaves the same.
export const controlStyles =
  'block w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-base ' +
  'text-foreground shadow-card placeholder:text-muted-foreground ' +
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 ' +
  'aria-[invalid=true]:border-error aria-[invalid=true]:border-2';
