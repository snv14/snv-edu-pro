// Algerian Curriculum 2AM Pedagogical Diagrams (SVG Visual Schematics)
// Based on official Middle School Natural Sciences - Inspector/Teacher Hamza Moussa

export const DIAGRAMS_2AM = {
  // 1. Biocenose & Biotope Ecosystem Organization (المذكرات 01، 02، 11)
  ecosystemStructure: `
    <svg viewBox="0 0 540 280" class="w-full max-w-lg mx-auto rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-teal-50/20 p-2" dir="rtl">
      <!-- Main Container Node: النظام البيئي -->
      <rect x="170" y="12" width="200" height="42" rx="10" fill="#047857" stroke="#065f46" stroke-width="2"/>
      <text x="270" y="38" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">الوسط الحي / النظام البيئي (Écosystème)</text>
      
      <!-- Connectors -->
      <path d="M 220 54 L 220 80 L 130 80 L 130 96" fill="none" stroke="#047857" stroke-width="2.5"/>
      <path d="M 320 54 L 320 80 L 410 80 L 410 96" fill="none" stroke="#047857" stroke-width="2.5"/>

      <!-- Branch 1: الوحدة الحياتية -->
      <g transform="translate(20, 96)">
        <rect x="0" y="0" width="220" height="40" rx="8" fill="#10b981" stroke="#059669" stroke-width="2"/>
        <text x="110" y="25" font-size="12.5" font-weight="bold" fill="#ffffff" text-anchor="middle">الوحدة الحياتية (Biocénose)</text>
        
        <!-- Elements of Biocenose -->
        <rect x="5" y="50" width="65" height="46" rx="6" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
        <text x="37" y="70" font-size="10.5" font-weight="bold" fill="#065f46" text-anchor="middle">حيوانات</text>
        <text x="37" y="86" font-size="9" fill="#047857" text-anchor="middle">Faune</text>

        <rect x="77" y="50" width="65" height="46" rx="6" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
        <text x="110" y="70" font-size="10.5" font-weight="bold" fill="#065f46" text-anchor="middle">نباتات</text>
        <text x="110" y="86" font-size="9" fill="#047857" text-anchor="middle">Flore</text>

        <rect x="150" y="50" width="65" height="46" rx="6" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
        <text x="182" y="70" font-size="10" font-weight="bold" fill="#065f46" text-anchor="middle">كائنات دقيقة</text>
        <text x="182" y="86" font-size="9" fill="#047857" text-anchor="middle">Micro-org</text>

        <rect x="35" y="104" width="150" height="24" rx="4" fill="#d1fae5" stroke="#10b981" stroke-width="1"/>
        <text x="110" y="120" font-size="10" font-weight="bold" fill="#065f46" text-anchor="middle">+ الإنسان وتفاعلاته</text>
      </g>

      <!-- Interaction Arrows in between -->
      <g transform="translate(245, 140)">
        <text x="25" y="0" font-size="10" font-weight="900" fill="#0f766e" text-anchor="middle">تأثير متبادل</text>
        <line x1="5" y1="12" x2="45" y2="12" stroke="#0f766e" stroke-width="2"/>
        <polygon points="5,12 12,8 12,16" fill="#0f766e"/>
        <polygon points="45,12 38,8 38,16" fill="#0f766e"/>
        <text x="25" y="28" font-size="9" font-weight="bold" fill="#047857" text-anchor="middle">علاقات وظيفية</text>
      </g>

      <!-- Branch 2: المدى الحيوي الجغرافي -->
      <g transform="translate(300, 96)">
        <rect x="0" y="0" width="220" height="40" rx="8" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
        <text x="110" y="25" font-size="12.5" font-weight="bold" fill="#ffffff" text-anchor="middle">المدى الحيوي الجغرافي (Biotope)</text>
        
        <!-- Elements of Biotope -->
        <rect x="5" y="50" width="65" height="46" rx="6" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.5"/>
        <text x="37" y="70" font-size="10.5" font-weight="bold" fill="#0c4a6e" text-anchor="middle">المناخ</text>
        <text x="37" y="86" font-size="9" fill="#0284c7" text-anchor="middle">حرارة/ضوء</text>

        <rect x="77" y="50" width="65" height="46" rx="6" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.5"/>
        <text x="110" y="70" font-size="10.5" font-weight="bold" fill="#0c4a6e" text-anchor="middle">التربة</text>
        <text x="110" y="86" font-size="9" fill="#0284c7" text-anchor="middle">Sol & Eau</text>

        <rect x="150" y="50" width="65" height="46" rx="6" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.5"/>
        <text x="182" y="70" font-size="10" font-weight="bold" fill="#0c4a6e" text-anchor="middle">الماء والهواء</text>
        <text x="182" y="86" font-size="9" fill="#0284c7" text-anchor="middle">Éléments</text>

        <rect x="35" y="104" width="150" height="24" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="1"/>
        <text x="110" y="120" font-size="10" font-weight="bold" fill="#0369a1" text-anchor="middle">العوامل الفيزيوكيميائية</text>
      </g>
    </svg>
  `,

  // 2. Food Chain & Biomass Loss Pyramid (المذكرات 04، 05)
  foodChainAndPyramid: `
    <svg viewBox="0 0 520 270" class="w-full max-w-lg mx-auto rounded-xl border border-amber-200 bg-white p-2" dir="rtl">
      <!-- Title -->
      <text x="260" y="20" font-size="13" font-weight="900" fill="#92400e" text-anchor="middle">هرم انتقال الكتلة الحية (Biomasse) وضياع المادة والطاقة (قاعدة 10%)</text>
      
      <!-- Biomass Pyramid -->
      <g transform="translate(30, 40)">
        <!-- Producer (Base) -->
        <polygon points="40,190 200,190 180,140 60,140" fill="#16a34a" stroke="#14532d" stroke-width="1.5"/>
        <text x="120" y="170" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">منتج أولي (P): 1000 كغ</text>
        <text x="120" y="184" font-size="9.5" fill="#dcfce7" text-anchor="middle">نبات أخضر (ذاتي التغذية)</text>

        <!-- Primary Consumer (C1) -->
        <polygon points="60,140 180,140 160,95 80,95" fill="#eab308" stroke="#713f12" stroke-width="1.5"/>
        <text x="120" y="120" font-size="10.5" font-weight="bold" fill="#713f12" text-anchor="middle">مستهلك 1 (C1): 100 كغ</text>
        <text x="120" y="133" font-size="9" fill="#713f12" text-anchor="middle">يرقة / جراد (عاشب)</text>

        <!-- Secondary Consumer (C2) -->
        <polygon points="80,95 160,95 145,55 95,55" fill="#f97316" stroke="#9a3412" stroke-width="1.5"/>
        <text x="120" y="77" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">مستهلك 2 (C2): 10 كغ</text>
        <text x="120" y="89" font-size="8.5" fill="#fff7ed" text-anchor="middle">قرقف / ضفدع</text>

        <!-- Tertiary Consumer (C3 - Top) -->
        <polygon points="95,55 145,55 130,20 110,20" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
        <text x="120" y="40" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">م3: 1 كغ</text>
      </g>

      <!-- Loss & Energy Explanations (Right side) -->
      <g transform="translate(260, 50)">
        <rect x="0" y="0" width="230" height="180" rx="8" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="115" y="24" font-size="11.5" font-weight="900" fill="#b45309" text-anchor="middle">أسباب ضياع الكتلة الحية (90%):</text>
        
        <text x="15" y="55" font-size="10.5" font-weight="bold" fill="#374151">• فضلات غير مهضومة وجثث مطروحة</text>
        <text x="15" y="80" font-size="10.5" font-weight="bold" fill="#374151">• نواتج التنفس (طاقة محررة + CO2 + حرارة)</text>
        <text x="15" y="105" font-size="10.5" font-weight="bold" fill="#374151">• نشاط وحركة الكائن الحي</text>

        <!-- Decomposers box -->
        <rect x="12" y="125" width="206" height="42" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1"/>
        <text x="115" y="142" font-size="10" font-weight="bold" fill="#92400e" text-anchor="middle">دور الكائنات المحللة (بكتيريا وفطريات):</text>
        <text x="115" y="157" font-size="9" fill="#78350f" text-anchor="middle">تحويل المادة العضوية إلى أملاح معدنية للنبات</text>
      </g>
    </svg>
  `,

  // 3. Bee Society Hierarchy & Communication (المذكرة 06)
  beeSociety: `
    <svg viewBox="0 0 520 280" class="w-full max-w-lg mx-auto rounded-xl border border-amber-300 bg-amber-50/40 p-2" dir="rtl">
      <!-- Title -->
      <text x="260" y="22" font-size="13" font-weight="900" fill="#78350f" text-anchor="middle">الهيكل التنظيمي لمجتمع النحل (Société d'abeilles) وأدواره</text>
      
      <!-- Hive Colony Members -->
      <g transform="translate(15, 40)">
        <!-- Queen (الملكة) -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="155" height="135" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
          <circle cx="77" cy="28" r="18" fill="#f59e0b"/>
          <text x="77" y="33" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">👑</text>
          <text x="77" y="62" font-size="12" font-weight="900" fill="#92400e" text-anchor="middle">الملكة (Reine)</text>
          <text x="77" y="79" font-size="9.5" fill="#78350f" text-anchor="middle">• أنثى وحيدة خصبة</text>
          <text x="77" y="96" font-size="9.5" fill="#78350f" text-anchor="middle">• تضع البيض (2000/يوم)</text>
          <text x="77" y="113" font-size="9.5" fill="#78350f" text-anchor="middle">• إفراز فرمونات التماسك</text>
        </g>

        <!-- Males/Drones (الذكور) -->
        <g transform="translate(165, 0)">
          <rect x="0" y="0" width="155" height="135" rx="8" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>
          <circle cx="77" cy="28" r="18" fill="#f97316"/>
          <text x="77" y="33" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">🐝</text>
          <text x="77" y="62" font-size="12" font-weight="900" fill="#9a3412" text-anchor="middle">الذكور (Faux-bourdons)</text>
          <text x="77" y="79" font-size="9.5" fill="#7c2d12" text-anchor="middle">• مئات الأفراد</text>
          <text x="77" y="96" font-size="9.5" fill="#7c2d12" text-anchor="middle">• تلقيح الملكة العذراء</text>
          <text x="77" y="113" font-size="9.5" fill="#7c2d12" text-anchor="middle">• لا تملك حمة ولا تجمع عسلاً</text>
        </g>

        <!-- Workers (العاملات) -->
        <g transform="translate(330, 0)">
          <rect x="0" y="0" width="160" height="135" rx="8" fill="#ecfdf5" stroke="#059669" stroke-width="2"/>
          <circle cx="80" cy="28" r="18" fill="#10b981"/>
          <text x="80" y="33" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">🌸</text>
          <text x="80" y="62" font-size="12" font-weight="900" fill="#065f46" text-anchor="middle">العاملات (Ouvrières)</text>
          <text x="80" y="79" font-size="9.5" fill="#047857" text-anchor="middle">• إناث عقيمة بالآلاف</text>
          <text x="80" y="96" font-size="9.5" fill="#047857" text-anchor="middle">• جني الرحيق وغذاء الملكات</text>
          <text x="80" y="113" font-size="9.5" fill="#047857" text-anchor="middle">• حراسة، تنظيف، وتهوية</text>
        </g>
      </g>

      <!-- Communication Modes -->
      <g transform="translate(15, 185)">
        <rect x="0" y="0" width="490" height="80" rx="8" fill="#ffffff" stroke="#d97706" stroke-width="1.5"/>
        <text x="245" y="20" font-size="11.5" font-weight="900" fill="#92400e" text-anchor="middle">طرق التواصل داخل مجتمع النحل (Communication):</text>
        
        <g transform="translate(15, 28)">
          <rect x="0" y="0" width="145" height="42" rx="5" fill="#fef3c7"/>
          <text x="72" y="18" font-size="10.5" font-weight="bold" fill="#78350f" text-anchor="middle">1- رقصة دائرية</text>
          <text x="72" y="33" font-size="9" fill="#92400e" text-anchor="middle">غذاء قريب (&lt; 100م)</text>
        </g>

        <g transform="translate(170, 28)">
          <rect x="0" y="0" width="145" height="42" rx="5" fill="#fef3c7"/>
          <text x="72" y="18" font-size="10.5" font-weight="bold" fill="#78350f" text-anchor="middle">2- رقصة اهتزازية (8)</text>
          <text x="72" y="33" font-size="9" fill="#92400e" text-anchor="middle">غذاء بعيد + زاوية الشمس</text>
        </g>

        <g transform="translate(325, 28)">
          <rect x="0" y="0" width="145" height="42" rx="5" fill="#fef3c7"/>
          <text x="72" y="18" font-size="10.5" font-weight="bold" fill="#78350f" text-anchor="middle">3- إشارات كيميائية</text>
          <text x="72" y="33" font-size="9" fill="#92400e" text-anchor="middle">فرمونات + تنبيهات لمسية</text>
        </g>
      </g>
    </svg>
  `,

  // 4. Plant Adaptations to Drought (المذكرة 14)
  plantAdaptations: `
    <svg viewBox="0 0 520 280" class="w-full max-w-lg mx-auto rounded-xl border border-emerald-300 bg-white p-2" dir="rtl">
      <!-- Title -->
      <text x="260" y="20" font-size="13" font-weight="900" fill="#047857" text-anchor="middle">تحورات الجهاز الإعاشي عند النباتات لمقاومة الجفاف</text>
      
      <!-- 2 Columns: Root system vs Aerial system -->
      <g transform="translate(15, 36)">
        <!-- 1. المجموع الجذري -->
        <rect x="0" y="0" width="240" height="230" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
        <text x="120" y="24" font-size="12" font-weight="900" fill="#15803d" text-anchor="middle">1- تحورات المجموع الجذري</text>
        
        <g transform="translate(10, 36)">
          <rect x="0" y="0" width="220" height="52" rx="5" fill="#ffffff" stroke="#86efac"/>
          <text x="110" y="20" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">امتداد عمودي عميق</text>
          <text x="110" y="38" font-size="9.5" fill="#15803d" text-anchor="middle">للوصول للمياه الجوفية (نبات الباقل)</text>
        </g>

        <g transform="translate(10, 96)">
          <rect x="0" y="0" width="220" height="52" rx="5" fill="#ffffff" stroke="#86efac"/>
          <text x="110" y="20" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">تفرع أفقي سطحي واسع</text>
          <text x="110" y="38" font-size="9.5" fill="#15803d" text-anchor="middle">لالتقاط مياه الأمطار النادرة (الشيح)</text>
        </g>

        <g transform="translate(10, 156)">
          <rect x="0" y="0" width="220" height="58" rx="5" fill="#ffffff" stroke="#86efac"/>
          <text x="110" y="20" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">جذور وسيقان ترابية درنية</text>
          <text x="110" y="38" font-size="9" fill="#15803d" text-anchor="middle">ادخار الماء والمغذيات</text>
          <text x="110" y="50" font-size="8.5" fill="#166534" text-anchor="middle">(أبصال، درنات، جذامير البرواق)</text>
        </g>

        <!-- 2. المجموع الخضري -->
        <rect x="250" y="0" width="240" height="230" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
        <text x="370" y="24" font-size="12" font-weight="900" fill="#1d4ed8" text-anchor="middle">2- تحورات المجموع الخضري</text>

        <g transform="translate(260, 36)">
          <rect x="0" y="0" width="220" height="52" rx="5" fill="#ffffff" stroke="#93c5fd"/>
          <text x="110" y="20" font-size="10.5" font-weight="bold" fill="#1e40af" text-anchor="middle">تقليص المساحة الورقية</text>
          <text x="110" y="38" font-size="9.5" fill="#2563eb" text-anchor="middle">أوراق شائكة (تين شوكي)، صغر الورقة (سدرة)</text>
        </g>

        <g transform="translate(260, 96)">
          <rect x="0" y="0" width="220" height="52" rx="5" fill="#ffffff" stroke="#93c5fd"/>
          <text x="110" y="20" font-size="10.5" font-weight="bold" fill="#1e40af" text-anchor="middle">ساق لحمية مائية</text>
          <text x="110" y="38" font-size="9.5" fill="#2563eb" text-anchor="middle">تخزين الماء والتركيب الضوئي (الصبار)</text>
        </g>

        <g transform="translate(260, 156)">
          <rect x="0" y="0" width="220" height="58" rx="5" fill="#ffffff" stroke="#93c5fd"/>
          <text x="110" y="20" font-size="10.5" font-weight="bold" fill="#1e40af" text-anchor="middle">طبقة شمعية وأوبار عازلة</text>
          <text x="110" y="38" font-size="9" fill="#2563eb" text-anchor="middle">حماية من الشمس والتقاط الرطوبة</text>
          <text x="110" y="50" font-size="8.5" fill="#1e40af" text-anchor="middle">(نبات اللاذن، التواء أوراق الحلفاء)</text>
        </g>
      </g>
    </svg>
  `,

  // 5. Animal Respiration Modes (المذكرة 15)
  animalRespiration: `
    <svg viewBox="0 0 520 280" class="w-full max-w-lg mx-auto rounded-xl border border-sky-300 bg-sky-50/30 p-2" dir="rtl">
      <!-- Title -->
      <text x="260" y="22" font-size="13" font-weight="900" fill="#0369a1" text-anchor="middle">أنماط التنفس عند الحيوانات (Respiration) وبنياتها التشريحية</text>
      
      <!-- 4 Modes Grid -->
      <g transform="translate(15, 38)">
        <!-- 1. تنفس غلصمي -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="235" height="105" rx="8" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
          <rect x="0" y="0" width="235" height="28" rx="8" fill="#0284c7"/>
          <text x="117" y="19" font-size="11.5" font-weight="bold" fill="#ffffff" text-anchor="middle">1- تنفس غلصمي (Branchiale)</text>
          <text x="15" y="48" font-size="10" font-weight="bold" fill="#0369a1">• الوسط: مائي (أسماك، قشريات)</text>
          <text x="15" y="68" font-size="10" font-weight="bold" fill="#374151">• العضو: غلاصم غنية بالأوعية الدموية</text>
          <text x="15" y="88" font-size="9.5" fill="#0284c7">• الآلية: امتصاص O2 المذاب وخروج الماء عبر الغطاء</text>
        </g>

        <!-- 2. تنفس قصبي -->
        <g transform="translate(255, 0)">
          <rect x="0" y="0" width="235" height="105" rx="8" fill="#ffffff" stroke="#e11d48" stroke-width="1.5"/>
          <rect x="0" y="0" width="235" height="28" rx="8" fill="#e11d48"/>
          <text x="117" y="19" font-size="11.5" font-weight="bold" fill="#ffffff" text-anchor="middle">2- تنفس قصبي (Trachéenne)</text>
          <text x="15" y="48" font-size="10" font-weight="bold" fill="#9f1239">• الوسط: هوائي (حشرات: جراد، نحل)</text>
          <text x="15" y="68" font-size="10" font-weight="bold" fill="#374151">• العضو: قصبات وقصيبات هوائية متفرعة</text>
          <text x="15" y="88" font-size="9.5" fill="#e11d48">• الآلية: وصول O2 مباشرة للخلايا بدون تدخل الدم</text>
        </g>

        <!-- 3. تنفس رئوي -->
        <g transform="translate(0, 118)">
          <rect x="0" y="0" width="235" height="105" rx="8" fill="#ffffff" stroke="#16a34a" stroke-width="1.5"/>
          <rect x="0" y="0" width="235" height="28" rx="8" fill="#16a34a"/>
          <text x="117" y="19" font-size="11.5" font-weight="bold" fill="#ffffff" text-anchor="middle">3- تنفس رئوي (Pulmonaire)</text>
          <text x="15" y="48" font-size="10" font-weight="bold" fill="#14532d">• الوسط: هوائي ومائي (ثدييات، طيور، دلافين)</text>
          <text x="15" y="68" font-size="10" font-weight="bold" fill="#374151">• العضو: رئتان متصلتان بأكياس هوائية</text>
          <text x="15" y="88" font-size="9.5" fill="#16a34a">• الآلية: شهيق وزفير عبر الأسناخ الرئوية</text>
        </g>

        <!-- 4. تنفس جلدي -->
        <g transform="translate(255, 118)">
          <rect x="0" y="0" width="235" height="105" rx="8" fill="#ffffff" stroke="#9333ea" stroke-width="1.5"/>
          <rect x="0" y="0" width="235" height="28" rx="8" fill="#9333ea"/>
          <text x="117" y="19" font-size="11.5" font-weight="bold" fill="#ffffff" text-anchor="middle">4- تنفس جلدي (Cutanée)</text>
          <text x="15" y="48" font-size="10" font-weight="bold" fill="#581c87">• الوسط: رطب/برمائي (ديدان الأرض، ضفادع)</text>
          <text x="15" y="68" font-size="10" font-weight="bold" fill="#374151">• العضو: جلد رفيع رطب وغني بالشعيرات</text>
          <text x="15" y="88" font-size="9.5" fill="#9333ea">• الآلية: نفاذ الغازات مباشرة عبر مخاط الجلد</text>
        </g>
      </g>
    </svg>
  `,

  // 6. Locomotion & Joint Movement Mechanics (المذكرات 17، 18)
  locomotionMechanics: `
    <svg viewBox="0 0 520 270" class="w-full max-w-lg mx-auto rounded-xl border border-orange-200 bg-white p-2" dir="rtl">
      <!-- Title -->
      <text x="260" y="20" font-size="13" font-weight="900" fill="#c2410c" text-anchor="middle">آلية الحركة: الطرف الخلفي بشكل حرف Z وتناسق العضلات المتضادة</text>
      
      <g transform="translate(15, 35)">
        <!-- Left: Z-shaped Jumping limb -->
        <rect x="0" y="0" width="240" height="215" rx="8" fill="#fff7ed" stroke="#ea580c" stroke-width="1.5"/>
        <text x="120" y="24" font-size="11.5" font-weight="bold" fill="#9a3412" text-anchor="middle">مراحل القفز والطرف Z (الأرنب/الضفدع)</text>
        
        <!-- Z leg schematic -->
        <path d="M 60 55 L 140 100 L 70 160 L 170 190" fill="none" stroke="#ea580c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="60" cy="55" r="5" fill="#9a3412"/>
        <circle cx="140" cy="100" r="5" fill="#9a3412"/>
        <circle cx="70" cy="160" r="5" fill="#9a3412"/>
        <circle cx="170" cy="190" r="5" fill="#9a3412"/>

        <text x="160" y="60" font-size="9.5" font-weight="bold" fill="#7c2d12">فخذ (Cuisse)</text>
        <text x="15" y="110" font-size="9.5" font-weight="bold" fill="#7c2d12">ساق (Jambe)</text>
        <text x="110" y="155" font-size="9.5" font-weight="bold" fill="#7c2d12">قدم (Pied)</text>
        <text x="120" y="205" font-size="9" font-weight="bold" fill="#c2410c" text-anchor="middle">امتداد مفاجئ يدفع الجسم للأعلى</text>

        <!-- Right: Antagonistic muscles (عضلات متضادة) -->
        <rect x="250" y="0" width="240" height="215" rx="8" fill="#f8fafc" stroke="#475569" stroke-width="1.5"/>
        <text x="370" y="24" font-size="11.5" font-weight="bold" fill="#1e293b" text-anchor="middle">عمل العضلات المتضادة (Muscles)</text>

        <rect x="260" y="42" width="220" height="68" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="370" y="62" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">1- حالة الثني (Flexion)</text>
        <text x="370" y="80" font-size="9.5" fill="#16a34a" text-anchor="middle">• تقلص العضلة القابضة (تنتفخ وتقصر)</text>
        <text x="370" y="98" font-size="9.5" fill="#dc2626" text-anchor="middle">• استرخاء العضلة الباسطة (تتمدد وترتخي)</text>

        <rect x="260" y="122" width="220" height="68" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="370" y="142" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">2- حالة البسط (Extension)</text>
        <text x="370" y="160" font-size="9.5" fill="#dc2626" text-anchor="middle">• استرخاء العضلة القابضة</text>
        <text x="370" y="178" font-size="9.5" fill="#16a34a" text-anchor="middle">• تقلص العضلة الباسطة المثبتة بالأوتار</text>

        <text x="370" y="206" font-size="9" font-weight="bold" fill="#475569" text-anchor="middle">الأوتار تنقل قوة التقلص العضلي إلى العظام الصلبة</text>
      </g>
    </svg>
  `,

  // 7. Biological Classification Tree (المذكرة 28)
  classificationTree: `
    <svg viewBox="0 0 540 290" class="w-full max-w-lg mx-auto rounded-xl border border-violet-200 bg-white p-2" dir="rtl">
      <!-- Main Title -->
      <rect x="170" y="10" width="200" height="36" rx="8" fill="#6d28d9" stroke="#4c1d95" stroke-width="2"/>
      <text x="270" y="33" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">تصنيف الكائنات الحية (Classification)</text>
      
      <!-- Kingdom split -->
      <path d="M 220 46 L 220 70 L 130 70 L 130 85" fill="none" stroke="#6d28d9" stroke-width="2"/>
      <path d="M 320 46 L 320 70 L 410 70 L 410 85" fill="none" stroke="#6d28d9" stroke-width="2"/>

      <!-- Kingdom 1: الحيوانية -->
      <g transform="translate(15, 85)">
        <rect x="0" y="0" width="240" height="190" rx="8" fill="#faf5ff" stroke="#7c3aed" stroke-width="1.5"/>
        <text x="120" y="22" font-size="11.5" font-weight="bold" fill="#5b21b6" text-anchor="middle">المملكة الحيوانية (Règne Animal)</text>
        
        <!-- Vertebrates -->
        <rect x="8" y="34" width="224" height="68" rx="5" fill="#ffffff" stroke="#c4b5fd"/>
        <text x="120" y="50" font-size="10.5" font-weight="bold" fill="#6d28d9" text-anchor="middle">1- شعبة الفقريات (عمود فقري):</text>
        <text x="120" y="68" font-size="9" fill="#4c1d95" text-anchor="middle">• صف الثدييات (ولودة، ترضع صغارها، وبر/شعر)</text>
        <text x="120" y="84" font-size="9" fill="#4c1d95" text-anchor="middle">• صفوف: الطيور، الزواحف، البرمائيات، الأسماك</text>

        <!-- Invertebrates -->
        <rect x="8" y="110" width="224" height="68" rx="5" fill="#ffffff" stroke="#c4b5fd"/>
        <text x="120" y="126" font-size="10.5" font-weight="bold" fill="#6d28d9" text-anchor="middle">2- شعبة اللافقريات (عديمة العمود):</text>
        <text x="120" y="144" font-size="9" fill="#4c1d95" text-anchor="middle">• صف الحشرات (3 أزواج أرجل + قرنا استشعار)</text>
        <text x="120" y="160" font-size="9" fill="#4c1d95" text-anchor="middle">• صفوف: القشريات، الرخويات، الديدان، العنكبيات</text>
      </g>

      <!-- Kingdom 2: النباتية -->
      <g transform="translate(285, 85)">
        <rect x="0" y="0" width="240" height="190" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
        <text x="120" y="22" font-size="11.5" font-weight="bold" fill="#14532d" text-anchor="middle">المملكة النباتية (Règne Végétal)</text>

        <!-- With stems and leaves -->
        <rect x="8" y="34" width="224" height="68" rx="5" fill="#ffffff" stroke="#86efac"/>
        <text x="120" y="50" font-size="10.5" font-weight="bold" fill="#15803d" text-anchor="middle">1- نباتات ذات سيقان وأوراق:</text>
        <text x="120" y="68" font-size="9" fill="#14532d" text-anchor="middle">• نباتات زهرية: تشكل أزهاراً وبذوراً (مشمش، قمح)</text>
        <text x="120" y="84" font-size="9" fill="#14532d" text-anchor="middle">• نباتات لازهرية: تتكاثر بالأبواغ (سراخس)</text>

        <!-- Without stems and leaves -->
        <rect x="8" y="110" width="224" height="68" rx="5" fill="#ffffff" stroke="#86efac"/>
        <text x="120" y="126" font-size="10.5" font-weight="bold" fill="#15803d" text-anchor="middle">2- نباتات عديمة السيقان والأوراق:</text>
        <text x="120" y="144" font-size="9" fill="#14532d" text-anchor="middle">• الطحالب (Algues): ذات يخضور</text>
        <text x="120" y="160" font-size="9" fill="#14532d" text-anchor="middle">• الفطريات (عديمة يخضور) والأشنات (تعايش)</text>
      </g>
    </svg>
  `,

  // 8. Fossil Formation & Sedimentary Layers (المذكرة 29)
  fossilFormation: `
    <svg viewBox="0 0 520 270" class="w-full max-w-lg mx-auto rounded-xl border border-stone-300 bg-stone-50/40 p-2" dir="rtl">
      <!-- Title -->
      <text x="260" y="20" font-size="13" font-weight="900" fill="#44403c" text-anchor="middle">مراحل تشكل المستحاثات (Fossilisation) وشروط حفظها في الصخور الرسوبية</text>
      
      <!-- 4 chronological steps -->
      <g transform="translate(15, 38)">
        <!-- Step 1 -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="115" height="150" rx="6" fill="#ffffff" stroke="#a8a29e" stroke-width="1.5"/>
          <rect x="0" y="0" width="115" height="24" rx="6" fill="#78716c"/>
          <text x="57" y="16" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">1. موت الكائن</text>
          
          <circle cx="57" cy="65" r="16" fill="#e7e5e4"/>
          <text x="57" y="70" font-size="13" text-anchor="middle">🐟</text>
          <text x="57" y="105" font-size="9" fill="#44403c" text-anchor="middle">سقوط الكائن في قاع</text>
          <text x="57" y="120" font-size="9" fill="#44403c" text-anchor="middle">بحري أو بحيرة</text>
        </g>

        <!-- Arrow 1-2 -->
        <polygon points="120,75 128,70 128,80" fill="#78716c"/>

        <!-- Step 2 -->
        <g transform="translate(125, 0)">
          <rect x="0" y="0" width="115" height="150" rx="6" fill="#ffffff" stroke="#a8a29e" stroke-width="1.5"/>
          <rect x="0" y="0" width="115" height="24" rx="6" fill="#78716c"/>
          <text x="57" y="16" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">2. طمر سريع</text>
          
          <rect x="15" y="45" width="85" height="40" fill="#d6d3d1" rx="4"/>
          <text x="57" y="68" font-size="10" text-anchor="middle">طبقة رواسب</text>
          <text x="57" y="105" font-size="9" fill="#44403c" text-anchor="middle">دفن سريع بالوحل</text>
          <text x="57" y="120" font-size="9" fill="#44403c" text-anchor="middle">لمنع التحلل الهوائي</text>
        </g>

        <!-- Arrow 2-3 -->
        <polygon points="245,75 253,70 253,80" fill="#78716c"/>

        <!-- Step 3 -->
        <g transform="translate(250, 0)">
          <rect x="0" y="0" width="115" height="150" rx="6" fill="#ffffff" stroke="#a8a29e" stroke-width="1.5"/>
          <rect x="0" y="0" width="115" height="24" rx="6" fill="#78716c"/>
          <text x="57" y="16" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">3. تمعدن وتحجر</text>
          
          <rect x="15" y="40" width="85" height="50" fill="#a8a29e" rx="4"/>
          <text x="57" y="68" font-size="11" text-anchor="middle">🦴</text>
          <text x="57" y="105" font-size="9" fill="#44403c" text-anchor="middle">استبدال المادة العضوية</text>
          <text x="57" y="120" font-size="9" fill="#44403c" text-anchor="middle">بمعادن كلسية وسيليسية</text>
        </g>

        <!-- Arrow 3-4 -->
        <polygon points="370,75 378,70 378,80" fill="#78716c"/>

        <!-- Step 4 -->
        <g transform="translate(375, 0)">
          <rect x="0" y="0" width="115" height="150" rx="6" fill="#ffffff" stroke="#a8a29e" stroke-width="1.5"/>
          <rect x="0" y="0" width="115" height="24" rx="6" fill="#57534e"/>
          <text x="57" y="16" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">4. ظهور كشاهد</text>
          
          <rect x="15" y="38" width="85" height="54" fill="#78716c" rx="4"/>
          <text x="57" y="68" font-size="14" text-anchor="middle">🐚</text>
          <text x="57" y="105" font-size="9" fill="#44403c" text-anchor="middle">ظهور المستحاثة مع</text>
          <text x="57" y="120" font-size="9" fill="#44403c" text-anchor="middle">الحت والمكاشف</text>
        </g>
      </g>

      <!-- Bottom conditions -->
      <g transform="translate(15, 200)">
        <rect x="0" y="0" width="490" height="58" rx="6" fill="#e7e5e4" stroke="#78716c"/>
        <text x="245" y="20" font-size="11" font-weight="900" fill="#292524" text-anchor="middle">شروط الاستحاثة الأساسية:</text>
        <text x="245" y="38" font-size="9.5" font-weight="bold" fill="#44403c" text-anchor="middle">1- توفر أجزاء صلبة (عظام، أصداف)  |  2- طمر سريع بالرواسب بمعزل عن الهواء  |  3- ثبات الوسط الجيولوجي</text>
      </g>
    </svg>
  `,
};
