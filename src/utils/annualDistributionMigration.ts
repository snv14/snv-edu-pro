import type { OfficialAnnualDistributionRow } from '../data/curriculum/officialAnnualDistributionData';
import { ANNUAL_SCHEDULE_DATA_VERSION } from './annualDistributionDateUtils';

export const FIRST_YEAR_REFERENCE_VERSION = '2026-2027-1am-supplied-reference-v1';
export const FIRST_YEAR_BACKUP_KEY = 'backup1amBefore2026Reference';

export const SECOND_YEAR_REFERENCE_VERSION = '2026-2027-2am-supplied-reference-v1';
export const SECOND_YEAR_BACKUP_KEY = 'backup2amBefore2026Reference';

export function annualDistributionVersion(level: string): string {
  if (level === '1am') return FIRST_YEAR_REFERENCE_VERSION;
  if (level === '2am') return SECOND_YEAR_REFERENCE_VERSION;
  return ANNUAL_SCHEDULE_DATA_VERSION;
}

function migrateLevelDistribution(
  stored: Record<string, any>,
  levelKey: '1am' | '2am',
  version: string,
  backupKey: string,
  reference: OfficialAnnualDistributionRow[],
): boolean {
  const old = stored[levelKey];
  if (!old || old.curriculumDataVersion === version) return false;
  if (Array.isArray(old.items) && old.items.length && !stored[backupKey]) {
    stored[backupKey] = old;
  }
  stored[levelKey] = {
    ...old,
    items: reference.map(row => ({ ...row })),
    curriculumDataVersion: version,
  };
  return true;
}

/** Replace only the old first-year schedule, retaining a recoverable copy. */
export function migrateFirstYearDistribution(
  stored: Record<string, any>,
  reference: OfficialAnnualDistributionRow[],
): boolean {
  return migrateLevelDistribution(
    stored,
    '1am',
    FIRST_YEAR_REFERENCE_VERSION,
    FIRST_YEAR_BACKUP_KEY,
    reference,
  );
}

/** Replace only the old second-year schedule, retaining a recoverable copy. */
export function migrateSecondYearDistribution(
  stored: Record<string, any>,
  reference: OfficialAnnualDistributionRow[],
): boolean {
  return migrateLevelDistribution(
    stored,
    '2am',
    SECOND_YEAR_REFERENCE_VERSION,
    SECOND_YEAR_BACKUP_KEY,
    reference,
  );
}

function mergeLevelOnCloudRestore(
  local: Record<string, any>,
  remote: Record<string, any>,
  levelKey: '1am' | '2am',
  version: string,
  backupKey: string,
  additionalBackupsKey: string,
): Record<string, any> {
  const result = { ...remote };
  const localRow = local[levelKey];
  const remoteRow = remote[levelKey];
  const backups = [local[backupKey], remote[backupKey]].filter(Boolean);
  const additional = [
    ...(local[additionalBackupsKey] || []),
    ...(remote[additionalBackupsKey] || []),
  ];
  if (localRow && remoteRow && JSON.stringify(localRow) !== JSON.stringify(remoteRow)) {
    if (localRow.curriculumDataVersion === version) {
      result[levelKey] = localRow;
      additional.push(remoteRow);
    } else {
      additional.push(localRow);
    }
  } else if (localRow && !remoteRow) {
    result[levelKey] = localRow;
  }
  if (backups.length) {
    result[backupKey] = backups[0];
    additional.push(...backups.slice(1));
  }
  if (additional.length) result[additionalBackupsKey] = additional;
  return result;
}

/** Retain locally stored first-year work when a cloud snapshot is applied. */
export function mergeFirstYearOnCloudRestore(
  local: Record<string, any>,
  remote: Record<string, any>,
): Record<string, any> {
  return mergeLevelOnCloudRestore(
    local,
    remote,
    '1am',
    FIRST_YEAR_REFERENCE_VERSION,
    FIRST_YEAR_BACKUP_KEY,
    'firstYearAdditionalBackups',
  );
}

/** Retain locally stored second-year work when a cloud snapshot is applied. */
export function mergeSecondYearOnCloudRestore(
  local: Record<string, any>,
  remote: Record<string, any>,
): Record<string, any> {
  return mergeLevelOnCloudRestore(
    local,
    remote,
    '2am',
    SECOND_YEAR_REFERENCE_VERSION,
    SECOND_YEAR_BACKUP_KEY,
    'secondYearAdditionalBackups',
  );
}

/** Retain locally stored 1AM & 2AM reference work when a cloud snapshot is applied. */
export function mergeReferenceYearsOnCloudRestore(
  local: Record<string, any>,
  remote: Record<string, any>,
): Record<string, any> {
  const withSecond = mergeSecondYearOnCloudRestore(local, remote);
  return mergeFirstYearOnCloudRestore(local, withSecond);
}
