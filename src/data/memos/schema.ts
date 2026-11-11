export interface DB_Level {
  level_id: string;
  level_name: string;
  fields: DB_Field[];
}

export interface DB_Field {
  field_id: string;
  field_name: string;
  sequences: DB_Sequence[];
}

export interface DB_Sequence {
  sequence_id: string;
  sequence_name: string;
  /** Official curriculum field/midan; populated only from source sequence metadata. */
  field_name?: string;
  resources: DB_Resource[];
}

export interface DB_Resource {
  resource_id: string;
  resource_name: string;
  learning_units: DB_LearningUnit[];
}

export interface DB_LearningUnit {
  learning_unit_id: string;
  learning_unit_name: string;
  markaba: string;
  marifa: string;
  manhaji: string;
  qayimi?: string;
  mostalahat: string;
  wasail: string;
  wadiya: string;
  moshkila: string;
  faradiyat: string;
  irsae: string;
  taqwim: string;
  official_source: boolean;
  sourceType?: string;
  sourceLabel?: string;
  activities: DB_Activity[];
  wadiya_tables?: DB_Table[];
  irsae_tables?: DB_Table[];
  taqwim_tables?: DB_Table[];
}

export interface DB_Activity {
  activity_id: string;
  activity_title: string;
  ustadh_activity: string;
  mutaalim_activity: string;
  zaman: string;
  diagrams: DB_Diagram[];
  tables?: DB_Table[];
}

export interface DB_Diagram {
  diagram_id: string;
  diagram_title: string;
  diagram_svg?: string;
  diagram_image_url?: string;
}

export interface DB_Table {
  table_id: string;
  table_title?: string;
  headers: string[];
  rows: string[][];
}
