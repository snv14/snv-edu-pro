import { LessonMemo, Activity } from '../types';
import { seq_1 } from './official_2am_maqta1';
import { seq_2 } from './official_2am_maqta2';
import { seq_3 } from './official_2am_maqta3';
import { seq_4, seq_5 } from './official_2am_maqta4_5';

const DB_2AM = [seq_1, seq_2, seq_3, seq_4, seq_5];

export const LESSONS_2AM: LessonMemo[] = [];

let memoCounter = 1;

for (const seq of DB_2AM) {
  for (const res of seq.resources) {
    for (const unit of res.learning_units) {
      const anshita: Activity[] = unit.activities.map(act => ({
        sourceActivityId: act.activity_id,
        title: act.activity_title,
        asila: act.ustadh_activity,
        ajwiba: act.mutaalim_activity,
        zaman: act.zaman,
        mola7adha: '',
        diagrams: act.diagrams,
        tables: act.tables
      }));

      const diagrams = unit.activities.flatMap(act => (act.diagrams || []).map(d => ({
        title: d.diagram_title,
        svg: d.diagram_svg,
      }))).filter(d => !!d.svg);

      LESSONS_2AM.push({
        sourceSequenceId: seq.sequence_id,
        sourceResourceId: res.resource_id,
        sourceLearningUnitId: unit.learning_unit_id,
        sourceOfficial: unit.official_source === true,
        level: '2am',
        memoNumber: memoCounter.toString().padStart(2, '0'),
        midan: seq.field_name || '',
        maqta: seq.sequence_name,
        mawrid: res.resource_name,
        ta3alom: unit.learning_unit_name,
        markaba: unit.markaba,
        ma3ayirTaqwim: unit.qayimi,
        marifa: unit.marifa,
        manhaji: unit.manhaji,
        mostalahat: unit.mostalahat,
        wasail: unit.wasail,
        wadiya: unit.wadiya,
        moshkila: unit.moshkila,
        faradiyat: unit.faradiyat,
        irsae: unit.irsae,
        taqwim: unit.taqwim,
        wadiyaTables: unit.wadiya_tables,
        irsaeTables: unit.irsae_tables,
        taqwimTables: unit.taqwim_tables,
        anshita: anshita,
        diagrams
      });
      memoCounter++;
    }
  }
}

