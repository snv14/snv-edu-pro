// Tracks explicit date edits so an in-flight cloud read cannot restore an older date.
let revision = 0;

export function markLogbookDateChanged(): void {
  revision += 1;
}

export function getLogbookDateRevision(): number {
  return revision;
}
