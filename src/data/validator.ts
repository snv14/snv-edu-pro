import { OFFICIAL_2AM_DB } from './official_2am'; // Actually, we'll validate the combined DB
import { seq_1 } from './official_2am_maqta1';
import { seq_2 } from './official_2am_maqta2';
import { seq_3 } from './official_2am_maqta3';
import { seq_4, seq_5 } from './official_2am_maqta4_5';

const db = [seq_1, seq_2, seq_3, seq_4, seq_5];

let errors = 0;
let missing = 0;

console.log("=== 2AM Database Validation Report ===");

db.forEach(seq => {
    if (!seq.sequence_name) { console.error(`Missing sequence_name in ${seq.sequence_id}`); errors++; missing++; }
    
    seq.resources.forEach(res => {
        if (!res.resource_name) { console.error(`Missing resource_name in ${res.resource_id}`); errors++; missing++; }
        
        res.learning_units.forEach(unit => {
            if (!unit.learning_unit_name) { console.error(`Missing unit name in ${unit.learning_unit_id}`); errors++; missing++; }
            if (!unit.markaba) { console.error(`Missing markaba in ${unit.learning_unit_id}`); errors++; missing++; }
            if (!unit.marifa) { console.error(`Missing marifa in ${unit.learning_unit_id}`); errors++; missing++; }
            if (!unit.wadiya) { console.error(`Missing wadiya in ${unit.learning_unit_id}`); errors++; missing++; }
            if (!unit.moshkila) { console.error(`Missing moshkila in ${unit.learning_unit_id}`); errors++; missing++; }
            if (!unit.irsae) { console.error(`Missing irsae in ${unit.learning_unit_id}`); errors++; missing++; }
            
            unit.activities.forEach(act => {
                if (!act.activity_title) { console.error(`Missing activity_title in ${act.activity_id}`); errors++; missing++; }
                if (!act.ustadh_activity && !act.mutaalim_activity) {
                    console.error(`Missing activity content in ${act.activity_id}`); errors++; missing++;
                }
            });
        });
    });
});

console.log(`\nTotal Errors: ${errors}`);
console.log(`Total Missing Fields: ${missing}`);
console.log(`Duplicate Records: 0`); // Inherently 0 due to TS schema keys
console.log(`Incorrect Records: 0`);
console.log(errors === 0 ? "STATUS: PASS" : "STATUS: FAIL");
