import React from 'react';
import { MemoConfig, LessonMemo } from '../types';
import { OfficialAnnualDistribution } from './OfficialAnnualDistribution';

interface AnnualDistributionProps {
  selectedLevel: '1am' | '2am' | '3am' | '4am';
  setSelectedLevel: (lvl: '1am' | '2am' | '3am' | '4am') => void;
  config: MemoConfig;
  setConfig?: React.Dispatch<React.SetStateAction<MemoConfig>>;
  showToast: (msg: string) => void;
  curriculumLessons?: LessonMemo[];
  curriculumBackground?: string;
}

export const AnnualDistribution: React.FC<AnnualDistributionProps> = ({
  selectedLevel,
  config,
  setConfig,
  showToast,
  curriculumLessons,
  curriculumBackground,
}) => {
  return (
    <OfficialAnnualDistribution
      level={selectedLevel}
      config={config}
      setConfig={setConfig}
      showToast={showToast}
      curriculumLessons={curriculumLessons}
      curriculumBackground={curriculumBackground}
    />
  );
};
