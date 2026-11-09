import type { OfficialAnnualDistributionRow } from '../data/officialAnnualDistributionData';
import { ANNUAL_SCHEDULE_DATA_VERSION } from './annualDistributionDateUtils';

export const SECOND_YEAR_REFERENCE_VERSION = '2026-2027-2am-supplied-reference-v1';
export const SECOND_YEAR_BACKUP_KEY = 'backup2amBefore2026Reference';

export function annualDistributionVersion(level: string): string {
  return level === '2am' ? SECOND_YEAR_REFERENCE_VERSION : ANNUAL_SCHEDULE_DATA_VERSION;
}

/** Replace only the old second-year schedule, retaining a recoverable copy. */
export function migrateSecondYearDistribution(stored: Record<string, any>, reference: OfficialAnnualDistributionRow[]): boolean {
  const old = stored['2am'];
  if (!old || old.curriculumDataVersion === SECOND_YEAR_REFERENCE_VERSION) return false;
  if (Array.isArray(old.items) && old.items.length && !stored[SECOND_YEAR_BACKUP_KEY]) {
    stored[SECOND_YEAR_BACKUP_KEY] = old;
  }
  stored['2am'] = { ...old, items: reference.map(row => ({ ...row })), curriculumDataVersion: SECOND_YEAR_REFERENCE_VERSION };
  return true;
}

/** Retain locally stored second-year work when a cloud snapshot is applied. */
export function mergeSecondYearOnCloudRestore(local: Record<string, any>, remote: Record<string, any>): Record<string, any> {
  const result = { ...remote };
  const localRow = local['2am'];
  const remoteRow = remote['2am'];
  const backups = [local[SECOND_YEAR_BACKUP_KEY], remote[SECOND_YEAR_BACKUP_KEY]].filter(Boolean);
  const additional = [...(local.secondYearAdditionalBackups || []), ...(remote.secondYearAdditionalBackups || [])];
  if (localRow && remoteRow && JSON.stringify(localRow) !== JSON.stringify(remoteRow)) {
    if (localRow.curriculumDataVersion === SECOND_YEAR_REFERENCE_VERSION) {
      result['2am'] = localRow;
      additional.push(remoteRow);
    } else {
      additional.push(localRow);
    }
  } else if (localRow && !remoteRow) {
    result['2am'] = localRow;
  }
  if (backups.length) {
    result[SECOND_YEAR_BACKUP_KEY] = backups[0];
    additional.push(...backups.slice(1));
  }
  if (additional.length) result.secondYearAdditionalBackups = additional;
  return result;
}
