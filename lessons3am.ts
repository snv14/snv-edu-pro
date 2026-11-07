import { DB_Sequence } from './schema';
import { seq_3am_1 } from './official_3am_maqta1';
import { seq_3am_2 } from './official_3am_maqta2';
import { seq_3am_3 } from './official_3am_maqta3';
import { seq_3am_4 } from './official_3am_maqta4';

export const MAQATI_3AM: DB_Sequence[] = [
  seq_3am_1,
  seq_3am_2,
  seq_3am_3,
  seq_3am_4
];

export function buildLessons3AM(): any[] {
  const allLessons: any[] = [];
  let memoCounter = 1;

  for (const seq of MAQATI_3AM) {
    for (const res of seq.resources) {
      for (const lu of res.learning_units) {
        let diagramSvg: string | undefined = undefined;
        let diagramTitle: string | undefined = undefined;
        const firstAct = lu.activities[0];
        const diagrams = lu.activities.flatMap(a => (a.diagrams || []).map(d => ({
          title: d.diagram_title,
          svg: d.diagram_svg
        }))).filter(d => !!d.svg);
        const firstDiagram = diagrams[0];
        diagramSvg = firstDiagram?.svg;
        diagramTitle = firstDiagram?.title;

        allLessons.push({
          sourceSequenceId: seq.sequence_id,
          sourceResourceId: res.resource_id,
          sourceLearningUnitId: lu.learning_unit_id,
          sourceOfficial: lu.official_source === true,
          level: '3am',
          memoNumber: memoCounter.toString().padStart(2, '0'),
          midan: seq.field_name || '',
          maqta: seq.sequence_name,
          mawrid: res.resource_name,
          ta3alom: lu.learning_unit_name,
          markaba: lu.markaba,
          marifa: lu.marifa,
          manhaji: lu.manhaji,
          ma3ayirTaqwim: lu.qayimi,
          mostalahat: lu.mostalahat,
          wasail: lu.wasail,
          zamanKoli: firstAct?.zaman || '',
          diagrams,
          diagramTitle,
          diagramSvg,
          wadiya: lu.wadiya,
          moshkila: lu.moshkila,
          faradiyat: lu.faradiyat,
          irsae: lu.irsae,
          taqwim: lu.taqwim,
          wadiyaTables: lu.wadiya_tables,
          irsaeTables: lu.irsae_tables,
          taqwimTables: lu.taqwim_tables,
          anshita: lu.activities.map(a => ({
            sourceActivityId: a.activity_id,
            title: a.activity_title,
            asila: a.ustadh_activity,
            ajwiba: a.mutaalim_activity,
            zaman: a.zaman,
            mola7adha: '',
            diagrams: a.diagrams,
            tables: a.tables
          }))
        });
        memoCounter++;
      }
    }
  }
  return allLessons;
}

export const LESSONS_3AM = buildLessons3AM();
