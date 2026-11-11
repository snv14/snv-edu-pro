// Algerian Curriculum 3AM Pedagogical Diagrams (SVG Visual Schematics)
// Based on official Middle School Natural Sciences - Inspector/Teacher Hamza Moussa

export const DIAGRAMS_3AM = {
  // 1. Seismic Waves & Hypocenter Diagram (المذكرة 3)
  seismicWaves: `
    <svg viewBox="0 0 500 280" class="w-full max-w-lg mx-auto rounded-xl border border-gray-200 bg-gradient-to-b from-sky-50 to-amber-50/30 p-2" dir="rtl">
      <!-- Ground surface -->
      <path d="M 30 90 Q 150 85 250 90 T 470 90 L 470 250 L 30 250 Z" fill="#e2d9cc" stroke="#8c7853" stroke-width="2"/>
      
      <!-- Fault Line -->
      <line x1="180" y1="90" x2="270" y2="230" stroke="#dc2626" stroke-width="3" stroke-dasharray="6 3"/>
      
      <!-- Hypocenter / Focus (البؤرة) -->
      <circle cx="235" cy="175" r="9" fill="#ef4444" stroke="#991b1b" stroke-width="2"/>
      <circle cx="235" cy="175" r="16" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 3"/>
      
      <!-- Epicenter (المركز السطحي) -->
      <circle cx="235" cy="90" r="7" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
      
      <!-- Vertical propagation line -->
      <line x1="235" y1="175" x2="235" y2="90" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4 2"/>
      
      <!-- Wavefront arcs -->
      <path d="M 195 175 A 40 40 0 0 1 275 175" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4 2"/>
      <path d="M 165 175 A 70 70 0 0 1 305 175" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5 3"/>
      <path d="M 135 175 A 100 100 0 0 1 335 175" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6 4"/>
      <path d="M 105 175 A 130 130 0 0 1 365 175" fill="none" stroke="#2563eb" stroke-width="2"/>

      <!-- Buildings on surface -->
      <rect x="222" y="65" width="26" height="25" fill="#f87171" stroke="#991b1b" stroke-width="1.5"/>
      <polygon points="222,65 235,50 248,65" fill="#b91c1c"/>
      <text x="235" y="45" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">دمار أعظمي</text>

      <rect x="120" y="72" width="20" height="18" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
      <rect x="340" y="72" width="20" height="18" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>

      <!-- Labels -->
      <text x="235" y="115" font-size="11" font-weight="bold" fill="#991b1b" text-anchor="middle">المركز السطحي (Épicentre)</text>
      <text x="260" y="180" font-size="11" font-weight="bold" fill="#991b1b" text-anchor="start">البؤرة (Foyer)</text>
      <text x="170" y="140" font-size="10" font-weight="bold" fill="#dc2626" text-anchor="middle">شاقولي</text>
      <text x="320" y="220" font-size="11" font-weight="bold" fill="#b91c1c">خط الفالق (Faille)</text>
      <text x="390" y="150" font-size="10" font-weight="bold" fill="#1d4ed8">انتشار الأمواج الزلزالية</text>
    </svg>
  `,

  // 2. Folds and Faults Diagram (المذكرة 6)
  foldsFaults: `
    <svg viewBox="0 0 500 290" class="w-full max-w-lg mx-auto rounded-xl border border-gray-200 bg-white p-2" dir="rtl">
      <!-- 1. Fold (طية) -->
      <g transform="translate(15, 20)">
        <text x="110" y="15" font-size="13" font-weight="900" fill="#0f766e" text-anchor="middle">تشكل الطية (صخور مرنة)</text>
        
        <!-- Compressional arrows -->
        <polygon points="10,55 35,45 35,65" fill="#e11d48"/>
        <line x1="35" y1="55" x2="60" y2="55" stroke="#e11d48" stroke-width="4"/>
        
        <polygon points="210,55 185,45 185,65" fill="#e11d48"/>
        <line x1="185" y1="55" x2="160" y2="55" stroke="#e11d48" stroke-width="4"/>

        <!-- Fold Arcs -->
        <path d="M 40 85 Q 110 30 180 85" fill="none" stroke="#f59e0b" stroke-width="12" stroke-linecap="round"/>
        <path d="M 40 97 Q 110 42 180 97" fill="none" stroke="#0ea5e9" stroke-width="10" stroke-linecap="round"/>
        <path d="M 40 108 Q 110 53 180 108" fill="none" stroke="#10b981" stroke-width="10" stroke-linecap="round"/>
        <path d="M 40 119 Q 110 64 180 119" fill="none" stroke="#8b5cf6" stroke-width="10" stroke-linecap="round"/>
        
        <text x="110" y="105" font-size="10" font-weight="bold" fill="#047857" text-anchor="middle">انثناء الطبقات دون انكسار</text>
      </g>

      <!-- Divider -->
      <line x1="250" y1="20" x2="250" y2="270" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="4 2"/>

      <!-- 2. Fault (فالق) -->
      <g transform="translate(260, 20)">
        <text x="110" y="15" font-size="13" font-weight="900" fill="#b91c1c" text-anchor="middle">تشكل الفالق (صخور صلبة)</text>
        
        <!-- Compressional arrows -->
        <polygon points="10,55 35,45 35,65" fill="#e11d48"/>
        <line x1="35" y1="55" x2="60" y2="55" stroke="#e11d48" stroke-width="4"/>
        
        <polygon points="210,55 185,45 185,65" fill="#e11d48"/>
        <line x1="185" y1="55" x2="160" y2="55" stroke="#e11d48" stroke-width="4"/>

        <!-- Block Left Up -->
        <g transform="translate(0, -10)">
          <polygon points="35,60 105,60 90,110 20,110" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
          <polygon points="20,110 90,110 75,135 5,135" fill="#0ea5e9" stroke="#0369a1" stroke-width="1.5"/>
        </g>

        <!-- Fault Plane Line -->
        <line x1="105" y1="50" x2="65" y2="150" stroke="#dc2626" stroke-width="3"/>

        <!-- Block Right Down -->
        <g transform="translate(30, 15)">
          <polygon points="85,60 155,60 140,110 70,110" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
          <polygon points="70,110 140,110 125,135 55,135" fill="#0ea5e9" stroke="#0369a1" stroke-width="1.5"/>
        </g>

        <text x="110" y="175" font-size="10.5" font-weight="bold" fill="#b91c1c" text-anchor="middle">انكسار وإزاحة الطبقات (مقر البؤرة)</text>
      </g>

      <!-- Bottom Summary Box -->
      <rect x="25" y="220" width="450" height="50" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="250" y="240" font-size="11" font-weight="bold" fill="#1e293b" text-anchor="middle">قوى الانضغاط الباطنية + صخور مرنة ⬅ طيات | صخور صلبة ⬅ فوالق (سبب الزلازل)</text>
      <text x="250" y="258" font-size="10" font-weight="medium" fill="#64748b" text-anchor="middle">تؤدي قوى الانضغاط المستمرة إلى تشكل السلاسل الجبلية في العالم كالأطلس والهيمالايا</text>
    </svg>
  `,

  // 3. Oceanic Ridge & Convection Currents (المذكرات 8 و 9)
  oceanicRidge: `
    <svg viewBox="0 0 500 270" class="w-full max-w-lg mx-auto rounded-xl border border-gray-200 bg-white p-2" dir="rtl">
      <!-- Ocean Water -->
      <rect x="20" y="30" width="460" height="70" fill="#e0f2fe"/>
      <text x="250" y="55" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">مياه المحيط (Océan)</text>

      <!-- Ocean Floor & Lithosphere -->
      <polygon points="20,100 200,100 250,130 300,100 480,100 480,170 20,170" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
      
      <!-- Rift / Axis of Ridge -->
      <polygon points="230,130 250,110 270,130 250,170" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>

      <!-- Rising Magma -->
      <path d="M 245 250 Q 240 190 250 135 Q 260 190 255 250 Z" fill="#dc2626"/>
      <text x="250" y="195" font-size="10" font-weight="black" fill="#ffffff" text-anchor="middle">ماغما</text>

      <!-- Divergence Arrows -->
      <g fill="#1d4ed8">
        <polygon points="120,80 90,70 90,90"/>
        <line x1="90" y1="80" x2="160" y2="80" stroke="#1d4ed8" stroke-width="3"/>
        <text x="125" y="68" font-size="9.5" font-weight="bold">حركة التباعد</text>

        <polygon points="380,80 410,70 410,90"/>
        <line x1="410" y1="80" x2="340" y2="80" stroke="#1d4ed8" stroke-width="3"/>
        <text x="375" y="68" font-size="9.5" font-weight="bold">حركة التباعد</text>
      </g>

      <!-- Asthenosphere & Convection currents -->
      <rect x="20" y="170" width="460" height="90" fill="#ffe4e6"/>
      
      <!-- Convection loops -->
      <path d="M 180 230 A 25 25 0 1 1 180 190" fill="none" stroke="#be123c" stroke-width="2.5" stroke-dasharray="4 2"/>
      <polygon points="175,190 185,180 185,195" fill="#be123c"/>
      <text x="150" y="220" font-size="9.5" font-weight="bold" fill="#be123c">تيارات الحمل</text>

      <path d="M 320 230 A 25 25 0 1 0 320 190" fill="none" stroke="#be123c" stroke-width="2.5" stroke-dasharray="4 2"/>
      <polygon points="325,190 315,180 315,195" fill="#be123c"/>
      <text x="350" y="220" font-size="9.5" font-weight="bold" fill="#be123c">تيارات الحمل</text>

      <!-- Labels -->
      <text x="250" y="25" font-size="12" font-weight="black" fill="#1e293b" text-anchor="middle">الظهرة المحيطية (Dorsale Océanique) ومحور الريفت</text>
      <text x="70" y="140" font-size="10" font-weight="bold" fill="#78350f">لوح محيطي قديم</text>
      <text x="430" y="140" font-size="10" font-weight="bold" fill="#78350f" text-anchor="end">لوح محيطي جديد</text>
      <text x="70" y="240" font-size="10" font-weight="bold" fill="#881337">الأستينوسفير (مائع)</text>
    </svg>
  `,

  // 4. Subduction & Explosive Volcanoes (المذكرات 10 و 11)
  subductionZone: `
    <svg viewBox="0 0 520 290" class="w-full max-w-lg mx-auto rounded-xl border border-gray-200 bg-white p-2" dir="rtl">
      <!-- Ocean -->
      <polygon points="20,40 220,40 180,100 20,100" fill="#bae6fd"/>
      <text x="100" y="65" font-size="10.5" font-weight="bold" fill="#0369a1">محيط</text>

      <!-- Ocean Trench (خندق محيطي) -->
      <polygon points="180,95 210,130 225,95" fill="#0284c7"/>
      <text x="195" y="85" font-size="10" font-weight="bold" fill="#0369a1" text-anchor="middle">خندق محيطي</text>

      <!-- Subducting Oceanic Plate -->
      <polygon points="20,100 180,100 320,250 250,265 140,140 20,140" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>
      <text x="80" y="125" font-size="10" font-weight="bold" fill="#ffffff">قشرة محيطية (أثقل)</text>

      <!-- Continental Plate -->
      <polygon points="220,95 290,45 350,90 410,40 500,95 500,180 320,250 220,120" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>
      <text x="400" y="125" font-size="10" font-weight="bold" fill="#78350f">قشرة قارية (أخف)</text>

      <!-- Mountains / Volcanoes -->
      <polygon points="270,95 300,35 330,95" fill="#b45309"/>
      <polygon points="380,95 410,30 440,95" fill="#b45309"/>
      
      <!-- Eruption Ash & Lava -->
      <path d="M 405 30 Q 395 5 410 0 Q 425 5 415 30" fill="#ef4444"/>
      <circle cx="410" cy="0" r="10" fill="#f97316" opacity="0.8"/>
      <text x="410" y="-12" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">بركان انفجاري لزج</text>

      <!-- Benioff Zone Earthquake Foci -->
      <g fill="#dc2626" stroke="#ffffff" stroke-width="1">
        <circle cx="210" cy="135" r="4.5"/>
        <circle cx="235" cy="165" r="4.5"/>
        <circle cx="260" cy="195" r="4.5"/>
        <circle cx="285" cy="225" r="4.5"/>
      </g>
      <line x1="200" y1="125" x2="295" y2="235" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3 2"/>
      <text x="210" y="205" font-size="9.5" font-weight="black" fill="#b91c1c">مستوى بنيوف (Benioff)</text>

      <!-- Magma Ascent -->
      <path d="M 285 220 Q 350 180 405 60" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="4 2"/>

      <!-- Labels -->
      <text x="260" y="280" font-size="11" font-weight="black" fill="#1e293b" text-anchor="middle">رسم تخطيطي لظاهرة الغوص والبركنة الانفجارية وتشكل الجبال</text>
    </svg>
  `,

  // 5. Earth Internal Structure & Discontinuities (المذكرة 12)
  earthStructure: `
    <svg viewBox="0 0 500 300" class="w-full max-w-lg mx-auto rounded-xl border border-gray-200 bg-slate-900 p-2 text-white" dir="rtl">
      <!-- Outer Wedge -->
      <path d="M 120 40 L 400 40 L 260 280 Z" fill="#b91c1c" stroke="#f87171" stroke-width="2"/>
      
      <!-- Layer 1: Crust (القشرة) -->
      <path d="M 120 40 L 400 40 L 388 58 L 132 58 Z" fill="#22c55e"/>
      
      <!-- Layer 2: Upper Mantle / Asthenosphere -->
      <path d="M 132 58 L 388 58 L 360 105 L 160 105 Z" fill="#eab308"/>
      
      <!-- Layer 3: Lower Mantle -->
      <path d="M 160 105 L 360 105 L 315 180 L 205 180 Z" fill="#f97316"/>
      
      <!-- Layer 4: Outer Core (نواة خارجية سائلة) -->
      <path d="M 205 180 L 315 180 L 285 235 L 235 235 Z" fill="#ef4444"/>
      
      <!-- Layer 5: Inner Core (نواة داخلية صلبة) -->
      <path d="M 235 235 L 285 235 L 260 280 Z" fill="#fbbf24"/>

      <!-- Discontinuity Labels -->
      <line x1="132" y1="58" x2="40" y2="58" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3 2"/>
      <text x="35" y="62" font-size="9.5" font-weight="bold" fill="#38bdf8" text-anchor="end">انقطاع موهو (Mohorovičić) [~30-70 كم]</text>

      <line x1="205" y1="180" x2="40" y2="180" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3 2"/>
      <text x="35" y="184" font-size="9.5" font-weight="bold" fill="#38bdf8" text-anchor="end">انقطاع غوتنبرغ (Gutenberg) [2900 كم]</text>

      <line x1="235" y1="235" x2="40" y2="235" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3 2"/>
      <text x="35" y="239" font-size="9.5" font-weight="bold" fill="#38bdf8" text-anchor="end">انقطاع ليمان (Lehmann) [5100 كم]</text>

      <!-- Right Layer Names -->
      <text x="410" y="50" font-size="10" font-weight="bold" fill="#86efac">القشرة الأرضية (صلبة)</text>
      <text x="380" y="85" font-size="10" font-weight="bold" fill="#fde047">الرداء العلوي (أستينوسفير مائع)</text>
      <text x="340" y="145" font-size="10" font-weight="bold" fill="#fdba74">الرداء السفلي (صلب)</text>
      <text x="305" y="210" font-size="10" font-weight="bold" fill="#fca5a5">النواة الخارجية (سائلة)</text>
      <text x="275" y="265" font-size="10" font-weight="bold" fill="#fef08a">النواة الداخلية (صلبة 6370 كم)</text>
    </svg>
  `,

  // 6. Hexagonal Components of Landscape (المذكرة 15)
  landscapeComponents: `
    <svg viewBox="0 0 500 240" class="w-full max-w-lg mx-auto rounded-xl border border-gray-200 bg-slate-50 p-2" dir="rtl">
      <!-- Center Node -->
      <polygon points="250,75 295,100 295,150 250,175 205,150 205,100" fill="#0f766e" stroke="#115e59" stroke-width="2"/>
      <text x="250" y="122" font-size="12" font-weight="black" fill="#ffffff" text-anchor="middle">مكونات</text>
      <text x="250" y="140" font-size="12" font-weight="black" fill="#ffffff" text-anchor="middle">المنظر الطبيعي</text>

      <!-- 1. Top Right: التضاريس -->
      <polygon points="370,15 415,40 415,90 370,115 325,90 325,40" fill="#f8fafc" stroke="#0ea5e9" stroke-width="2"/>
      <text x="370" y="60" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">التضاريس</text>
      <text x="370" y="78" font-size="9" font-weight="medium" fill="#64748b" text-anchor="middle">جبال، سهول، هضاب</text>

      <!-- 2. Top Left: الغطاء النباتي -->
      <polygon points="130,15 175,40 175,90 130,115 85,90 85,40" fill="#f8fafc" stroke="#16a34a" stroke-width="2"/>
      <text x="130" y="60" font-size="11" font-weight="bold" fill="#15803d" text-anchor="middle">الغطاء النباتي</text>
      <text x="130" y="78" font-size="9" font-weight="medium" fill="#64748b" text-anchor="middle">غابات، سهوب، واحات</text>

      <!-- 3. Bottom Right: مكاشف الصخور -->
      <polygon points="370,135 415,160 415,210 370,235 325,210 325,160" fill="#f8fafc" stroke="#d97706" stroke-width="2"/>
      <text x="370" y="180" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">مكاشف الصخور</text>
      <text x="370" y="198" font-size="9" font-weight="medium" fill="#64748b" text-anchor="middle">طبقات مائلة، أفقية، طيات</text>

      <!-- 4. Bottom Left: المجاري المائية -->
      <polygon points="130,135 175,160 175,210 130,235 85,210 85,160" fill="#f8fafc" stroke="#2563eb" stroke-width="2"/>
      <text x="130" y="180" font-size="11" font-weight="bold" fill="#1d4ed8" text-anchor="middle">المجاري المائية</text>
      <text x="130" y="198" font-size="9" font-weight="medium" fill="#64748b" text-anchor="middle">أودية، شلالات، بحيرات</text>

      <!-- 5. Bottom Center: نشاطات الإنسان -->
      <polygon points="250,175 285,195 285,230 250,248 215,230 215,195" fill="#f8fafc" stroke="#9333ea" stroke-width="2"/>
      <text x="250" y="215" font-size="10.5" font-weight="bold" fill="#7e22ce" text-anchor="middle">نشاطات الإنسان</text>

      <!-- Connecting Lines -->
      <line x1="295" y1="100" x2="325" y2="80" stroke="#cbd5e1" stroke-width="2"/>
      <line x1="205" y1="100" x2="175" y2="80" stroke="#cbd5e1" stroke-width="2"/>
      <line x1="295" y1="150" x2="325" y2="170" stroke="#cbd5e1" stroke-width="2"/>
      <line x1="205" y1="150" x2="175" y2="170" stroke="#cbd5e1" stroke-width="2"/>
    </svg>
  `,

  // 7. Soil Horizons & Formation (المذكرات 28 و 31)
  soilHorizons: `
    <svg viewBox="0 0 500 270" class="w-full max-w-lg mx-auto rounded-xl border border-gray-200 bg-white p-2" dir="rtl">
      <!-- Plants and Grass -->
      <rect x="20" y="20" width="460" height="20" fill="#ecfdf5"/>
      <path d="M 40 25 L 45 10 L 50 25 M 120 25 L 125 8 L 130 25 M 240 25 L 245 12 L 250 25 M 380 25 L 385 10 L 390 25" stroke="#16a34a" stroke-width="2"/>
      
      <!-- Layer O: Litter (فراش التربة) -->
      <rect x="20" y="40" width="460" height="25" fill="#78350f"/>
      <text x="35" y="57" font-size="10" font-weight="bold" fill="#fef3c7">الأفق O: فراش التربة (Litière) - بقايا أوراق ومادة عضوية غير متحللة</text>

      <!-- Layer A: Humus-Rich Topsoil (أفق الدبال) -->
      <rect x="20" y="65" width="460" height="50" fill="#451a03"/>
      <text x="35" y="95" font-size="10" font-weight="bold" fill="#fed7aa">الأفق A: أفق دبالي خصب - خليط من مادة عضوية متحللة ومعادن وكائنات دقيقة</text>

      <!-- Layer B: Subsoil (أفق التراكم والترسيب) -->
      <rect x="20" y="115" width="460" height="65" fill="#c2410c"/>
      <text x="35" y="152" font-size="10" font-weight="bold" fill="#ffedd5">الأفق B: أفق التراكم المعدني - طين وأكاسيد حديد وأملاح مرسبة من الأعلى</text>

      <!-- Layer C: Fragmented Bedrock (صخرة أم مفككة) -->
      <rect x="20" y="180" width="460" height="45" fill="#78716c"/>
      <text x="35" y="208" font-size="10" font-weight="bold" fill="#f5f5f4">الأفق C: قطع صخرية مفككة ناتجة عن تصدع الصخرة الأم بفعل المناخ</text>

      <!-- Layer R: Bedrock (الصخرة الأم الصلبة) -->
      <rect x="20" y="225" width="460" height="35" fill="#44403c"/>
      <text x="35" y="248" font-size="10" font-weight="bold" fill="#e7e5e4">الصخرة الأم (Roche mère / Bedrock): صخرة صلبة غير مجواة</text>
    </svg>
  `,

  // 8. Water Cycle (المذكرة 25)
  waterCycle: `
    <svg viewBox="0 0 500 260" class="w-full max-w-lg mx-auto rounded-xl border border-gray-200 bg-sky-50 p-2" dir="rtl">
      <!-- Sun -->
      <circle cx="430" cy="45" r="22" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
      <text x="430" y="50" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">شمس</text>

      <!-- Clouds & Condensation -->
      <ellipse cx="270" cy="40" rx="35" ry="18" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
      <ellipse cx="295" cy="35" rx="25" ry="15" fill="#ffffff"/>
      <text x="280" y="44" font-size="9.5" font-weight="bold" fill="#475569" text-anchor="middle">تكاثف السحب</text>

      <!-- Evaporation Arrows -->
      <path d="M 390 160 Q 380 110 330 65" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="4 2"/>
      <polygon points="330,65 340,70 335,78" fill="#0284c7"/>
      <text x="400" y="110" font-size="9" font-weight="bold" fill="#0369a1">تبخر المياه</text>

      <!-- Rainfall (تساقط) -->
      <g stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4 4">
        <line x1="250" y1="65" x2="240" y2="100"/>
        <line x1="270" y1="65" x2="260" y2="100"/>
        <line x1="290" y1="65" x2="280" y2="100"/>
      </g>
      <text x="280" y="90" font-size="9.5" font-weight="bold" fill="#0284c7">تساقط (أمطار/ثلوج)</text>

      <!-- Mountain and Ground -->
      <polygon points="20,180 120,80 220,180 500,180 500,250 20,250" fill="#84cc16"/>
      
      <!-- Surface Runoff -->
      <path d="M 120 120 Q 200 175 350 200" fill="none" stroke="#0284c7" stroke-width="4"/>
      <text x="180" y="150" font-size="9.5" font-weight="bold" fill="#0369a1">جريان سطحي (أودية)</text>

      <!-- Ocean -->
      <rect x="350" y="190" width="140" height="60" fill="#0284c7"/>
      <text x="420" y="225" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">البحر / المحيط</text>

      <!-- Groundwater & Infiltration (نفاذ وجيب مائي) -->
      <rect x="20" y="210" width="330" height="40" fill="#0369a1" opacity="0.85"/>
      <text x="180" y="235" font-size="10.5" font-weight="bold" fill="#ffffff" text-anchor="middle">مياه جوفية (جيب مائي Nappe)</text>
    </svg>
  `,
};
