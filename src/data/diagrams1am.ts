// ================= الرسوم التخطيطية التفاعلية للسنة الأولى متوسط (1AM) =================

export const DIAGRAMS_1AM = {
  // 1. تجارب تصنيف الأغذية حسب الأصل والمصدر والكشف بالحرق
  foodClassification: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
    <rect width="700" height="480" fill="#f8fafc" rx="14" />
    <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />
    
    <text x="350" y="40" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">تجارب الكشف عن أصل الأغذية (عضوي / معدني) بالتسخين</text>

    <!-- الأنبوب 1: سكر -->
    <g transform="translate(60, 65)">
      <rect x="15" y="10" width="110" height="190" fill="#fef2f2" stroke="#fca5a5" stroke-width="1.5" rx="8"/>
      <!-- موقد -->
      <path d="M 60,170 L 80,170 L 70,140 Z" fill="#f97316"/>
      <!-- أنبوب مائل -->
      <line x1="70" y1="50" x2="70" y2="135" stroke="#475569" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="70" cy="132" rx="5" ry="4" fill="#0f172a"/>
      <text x="70" y="30" font-size="13" font-weight="bold" fill="#dc2626" text-anchor="middle">أنبوب + سكر</text>
      <text x="70" y="190" font-size="11" fill="#b91c1c" text-anchor="middle">تفحم (أصل عضوي)</text>
    </g>

    <!-- الأنبوب 2: ملح -->
    <g transform="translate(210, 65)">
      <rect x="15" y="10" width="110" height="190" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" rx="8"/>
      <path d="M 60,170 L 80,170 L 70,140 Z" fill="#f97316"/>
      <line x1="70" y1="50" x2="70" y2="135" stroke="#475569" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="70" cy="132" rx="5" ry="4" fill="#ffffff" stroke="#94a3b8"/>
      <text x="70" y="30" font-size="13" font-weight="bold" fill="#16a34a" text-anchor="middle">أنبوب + ملح</text>
      <text x="70" y="190" font-size="11" fill="#15803d" text-anchor="middle">لا يتفحم (أصل معدني)</text>
    </g>

    <!-- الأنبوب 3: خبز -->
    <g transform="translate(360, 65)">
      <rect x="15" y="10" width="110" height="190" fill="#fef2f2" stroke="#fca5a5" stroke-width="1.5" rx="8"/>
      <path d="M 60,170 L 80,170 L 70,140 Z" fill="#f97316"/>
      <line x1="70" y1="50" x2="70" y2="135" stroke="#475569" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="70" cy="132" rx="5" ry="4" fill="#0f172a"/>
      <text x="70" y="30" font-size="13" font-weight="bold" fill="#dc2626" text-anchor="middle">أنبوب + خبز</text>
      <text x="70" y="190" font-size="11" fill="#b91c1c" text-anchor="middle">تفحم (أصل عضوي)</text>
    </g>

    <!-- الأنبوب 4: ماء -->
    <g transform="translate(510, 65)">
      <rect x="15" y="10" width="110" height="190" fill="#f0f9ff" stroke="#7dd3fc" stroke-width="1.5" rx="8"/>
      <path d="M 60,170 L 80,170 L 70,140 Z" fill="#f97316"/>
      <line x1="70" y1="50" x2="70" y2="135" stroke="#475569" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="70" cy="132" rx="5" ry="4" fill="#38bdf8"/>
      <text x="70" y="30" font-size="13" font-weight="bold" fill="#0284c7" text-anchor="middle">أنبوب + ماء</text>
      <text x="70" y="190" font-size="11" fill="#0369a1" text-anchor="middle">تبخر الماء (معدني)</text>
    </g>

    <!-- خلاصة التصنيف -->
    <g transform="translate(40, 290)">
      <rect width="620" height="160" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="10"/>
      <text x="310" y="30" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">خلاصة تصنيف الأغذية حسب الأصل والمصدر</text>
      
      <rect x="20" y="50" width="280" height="90" fill="#fef2f2" stroke="#f87171" rx="8"/>
      <text x="160" y="75" font-size="14" font-weight="bold" fill="#dc2626" text-anchor="middle">أغذية ذات أصل عضوي (تحترق)</text>
      <text x="160" y="98" font-size="12" fill="#7f1d1d" text-anchor="middle">• مصدر نباتي: خبز، بطاطا، سكر، خضر، فواكه</text>
      <text x="160" y="120" font-size="12" fill="#7f1d1d" text-anchor="middle">• مصدر حيواني: لحم، بيض، حليب، زبدة، سمك</text>

      <rect x="320" y="50" width="280" height="90" fill="#f0fdf4" stroke="#4ade80" rx="8"/>
      <text x="460" y="75" font-size="14" font-weight="bold" fill="#16a34a" text-anchor="middle">أغذية ذات أصل معدني (لا تحترق)</text>
      <text x="460" y="100" font-size="12" fill="#14532d" text-anchor="middle">• مصدر طبيعي معدني: الماء والملح</text>
      <text x="460" y="120" font-size="12" fill="#14532d" text-anchor="middle">• لا تحتوي على عنصر الكربون (الفحم)</text>
    </g>
  </svg>`,

  // 2. تحليل الحليب والكشف عن مكوناته العضوية والمعدنية
  milkAnalysis: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
    <rect width="700" height="480" fill="#f8fafc" rx="14" />
    <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />

    <text x="350" y="38" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">الكشف عن المكونات العضوية والمعدنية للحليب (غذاء مركب كامل)</text>

    <!-- بطاقات الكواشف -->
    <g transform="translate(30, 60)">
      <!-- السكر -->
      <rect x="10" y="10" width="145" height="175" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5" rx="8"/>
      <text x="82" y="32" font-size="13" font-weight="bold" fill="#b45309" text-anchor="middle">1. السكر (لاكتوز)</text>
      <text x="82" y="58" font-size="11" fill="#78350f" text-anchor="middle">مصل الحليب +</text>
      <text x="82" y="74" font-size="11" fill="#78350f" text-anchor="middle">محلول فهلينغ + تسخين</text>
      <rect x="35" y="90" width="95" height="40" fill="#ef4444" rx="6"/>
      <text x="82" y="115" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">راسب أحمر آجوري</text>
      <text x="82" y="165" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">مادة عضوية سكرية</text>

      <!-- البروتين -->
      <rect x="170" y="10" width="145" height="175" fill="#fef9c3" stroke="#eab308" stroke-width="1.5" rx="8"/>
      <text x="242" y="32" font-size="13" font-weight="bold" fill="#a16207" text-anchor="middle">2. البروتين (جبنين)</text>
      <text x="242" y="58" font-size="11" fill="#713f12" text-anchor="middle">قشدة / خثارة +</text>
      <text x="242" y="74" font-size="11" fill="#713f12" text-anchor="middle">حمض الآزوت</text>
      <rect x="195" y="90" width="95" height="40" fill="#facc15" rx="6"/>
      <text x="242" y="115" font-size="12" font-weight="bold" fill="#854d0e" text-anchor="middle">ظهور لون أصفر</text>
      <text x="242" y="165" font-size="11" font-weight="bold" fill="#a16207" text-anchor="middle">مادة عضوية بروتينية</text>

      <!-- الدسم -->
      <rect x="330" y="10" width="145" height="175" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5" rx="8"/>
      <text x="402" y="32" font-size="13" font-weight="bold" fill="#475569" text-anchor="middle">3. الدسم (الزبدة)</text>
      <text x="402" y="58" font-size="11" fill="#334155" text-anchor="middle">حك قشدة الحليب</text>
      <text x="402" y="74" font-size="11" fill="#334155" text-anchor="middle">على ورقة بيضاء</text>
      <rect x="355" y="90" width="95" height="40" fill="#e2e8f0" stroke="#cbd5e1" rx="6"/>
      <text x="402" y="110" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">بقعة نصف شفافة</text>
      <text x="402" y="124" font-size="10" fill="#64748b" text-anchor="middle">لا تزول بالحرارة</text>
      <text x="402" y="165" font-size="11" font-weight="bold" fill="#475569" text-anchor="middle">مادة عضوية دسمة</text>

      <!-- الأملاح المعدنية -->
      <rect x="490" y="10" width="145" height="175" fill="#f0f9ff" stroke="#38bdf8" stroke-width="1.5" rx="8"/>
      <text x="562" y="32" font-size="13" font-weight="bold" fill="#0369a1" text-anchor="middle">4. الأملاح والماء</text>
      <text x="562" y="55" font-size="10" fill="#075985" text-anchor="middle">• نترات الفضة ➔ كلور</text>
      <text x="562" y="70" font-size="10" fill="#075985" text-anchor="middle">• أكسالات ➔ كالسيوم</text>
      <rect x="515" y="90" width="95" height="40" fill="#ffffff" stroke="#bae6fd" rx="6"/>
      <text x="562" y="110" font-size="11" font-weight="bold" fill="#0284c7" text-anchor="middle">راسب أبيض يسود</text>
      <text x="562" y="124" font-size="10" fill="#0369a1" text-anchor="middle">بالضوء (كلورور)</text>
      <text x="562" y="165" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">مواد معدنية أساسية</text>
    </g>

    <!-- استنتاج الحليب غذاء كامل -->
    <g transform="translate(40, 275)">
      <rect width="620" height="175" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5" rx="10"/>
      <text x="310" y="28" font-size="15" font-weight="bold" fill="#0369a1" text-anchor="middle">النتيجة العلمية: تصنيف الأغذية حسب التركيب</text>
      
      <text x="600" y="60" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">1. الغذاء البسيط:</text>
      <text x="600" y="80" font-size="12" fill="#334155" text-anchor="end">يتكون من مادة غذائية واحدة فقط (مثل: السكر الأبيض، الزيت النقي، زلال البيض).</text>

      <text x="600" y="110" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">2. الغذاء المركب:</text>
      <text x="600" y="130" font-size="12" fill="#334155" text-anchor="end">يتكون من مادتين بسيطتين أو أكثر (مثل: الخبز، البطاطا، اللحم، الذرة).</text>

      <text x="600" y="155" font-size="13" font-weight="bold" fill="#0284c7" text-anchor="end">3. الغذاء المركب الكامل (الحليب):</text>
      <text x="310" y="155" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">يحتوي على جميع العناصر البسيطة العضوية والمعدنية بنسب متقاربة.</text>
    </g>
  </svg>`,

  // 3. دور الأغذية والرواتب الغذائية والتوازن الغذائي
  nutritionRations: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
    <rect width="700" height="480" fill="#f8fafc" rx="14" />
    <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />

    <text x="350" y="38" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">دور الأغذية في الجسم وأنواع الرواتب الغذائية</text>

    <!-- قطاعات دور الأغذية -->
    <g transform="translate(30, 60)">
      <!-- أغذية الطاقة -->
      <rect x="15" y="10" width="300" height="135" fill="#fef2f2" stroke="#f87171" stroke-width="1.5" rx="8"/>
      <text x="165" y="35" font-size="15" font-weight="bold" fill="#dc2626" text-anchor="middle">أغذية الطاقة (النشاط والحركة)</text>
      <text x="165" y="62" font-size="13" font-weight="bold" fill="#7f1d1d" text-anchor="middle">• الغلوسيدات (السكريات) + الدسم (الدهون)</text>
      <text x="165" y="85" font-size="11" fill="#991b1b" text-anchor="middle">تستعملها الخلايا في إنتاج الطاقة اللازمة للمجهود العضلي</text>
      <text x="165" y="105" font-size="11" fill="#991b1b" text-anchor="middle">وتوليد حرارة الجسم (أمثلة: الحبوب، العسل، الزيوت)</text>
      <rect x="80" y="115" width="170" height="22" fill="#ef4444" rx="4"/>
      <text x="165" y="130" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">وقود ونشاط العضوية</text>

      <!-- أغذية النمو والبناء -->
      <rect x="330" y="10" width="300" height="135" fill="#f0fdf4" stroke="#4ade80" stroke-width="1.5" rx="8"/>
      <text x="480" y="35" font-size="15" font-weight="bold" fill="#16a34a" text-anchor="middle">أغذية النمو والبناء والصيانة</text>
      <text x="480" y="62" font-size="13" font-weight="bold" fill="#14532d" text-anchor="middle">• البروتينات + الماء + الأملاح + الفيتامينات</text>
      <text x="480" y="85" font-size="11" fill="#166534" text-anchor="middle">تستعمل لبناء خلايا وأنسجة الجسم وزيادة الطول والوزن</text>
      <text x="480" y="105" font-size="11" fill="#166534" text-anchor="middle">وترميم الأنسجة التالفة (أمثلة: اللحوم، البيض، الأسماك)</text>
      <rect x="395" y="115" width="170" height="22" fill="#22c55e" rx="4"/>
      <text x="480" y="130" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">بناء وترميم الخلايا</text>
    </g>

    <!-- الرواتب الغذائية الأربعة -->
    <g transform="translate(30, 220)">
      <rect width="640" height="235" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="10"/>
      <text x="320" y="28" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">الراتب الغذائي: كمية الأغذية اللازمة لتلبية حاجات الجسم خلال 24 ساعة</text>

      <rect x="15" y="45" width="140" height="170" fill="#eff6ff" stroke="#93c5fd" rx="6"/>
      <text x="85" y="70" font-size="13" font-weight="bold" fill="#1d4ed8" text-anchor="middle">1. راتب النمو</text>
      <text x="85" y="95" font-size="11" fill="#1e3a8a" text-anchor="middle">خاص بالأطفال</text>
      <text x="85" y="115" font-size="11" fill="#1e3a8a" text-anchor="middle">والمراهقين</text>
      <text x="85" y="140" font-size="11" font-weight="bold" fill="#2563eb" text-anchor="middle">غني بالبروتينات</text>
      <text x="85" y="160" font-size="10" fill="#3b82f6" text-anchor="middle">والكالسيوم والماء</text>

      <rect x="170" y="45" width="140" height="170" fill="#fff7ed" stroke="#fdba74" rx="6"/>
      <text x="240" y="70" font-size="13" font-weight="bold" fill="#c2410c" text-anchor="middle">2. راتب العمل</text>
      <text x="240" y="95" font-size="11" fill="#7c2d12" text-anchor="middle">خاص بالرياضيين</text>
      <text x="240" y="115" font-size="11" fill="#7c2d12" text-anchor="middle">والعمال النشطين</text>
      <text x="240" y="140" font-size="11" font-weight="bold" fill="#ea580c" text-anchor="middle">غني بالغلوسيدات</text>
      <text x="240" y="160" font-size="10" fill="#f97316" text-anchor="middle">والدسم للطاقة</text>

      <rect x="325" y="45" width="140" height="170" fill="#f0fdf4" stroke="#86efac" rx="6"/>
      <text x="395" y="70" font-size="13" font-weight="bold" fill="#15803d" text-anchor="middle">3. راتب الصيانة</text>
      <text x="395" y="95" font-size="11" fill="#14532d" text-anchor="middle">خاص بشخص بالغ</text>
      <text x="395" y="115" font-size="11" fill="#14532d" text-anchor="middle">في حالة راحة</text>
      <text x="395" y="140" font-size="11" font-weight="bold" fill="#16a34a" text-anchor="middle">متوازن معتدل</text>
      <text x="395" y="160" font-size="10" fill="#22c55e" text-anchor="middle">للحفاظ على الوزن</text>

      <rect x="480" y="45" width="140" height="170" fill="#fdf4ff" stroke="#f0abfc" rx="6"/>
      <text x="550" y="70" font-size="13" font-weight="bold" fill="#a21caf" text-anchor="middle">4. راتب الإنتاج</text>
      <text x="550" y="95" font-size="11" fill="#701a75" text-anchor="middle">خاص بالمرأة</text>
      <text x="550" y="115" font-size="11" fill="#701a75" text-anchor="middle">الحامل أو المرضع</text>
      <text x="550" y="140" font-size="11" font-weight="bold" fill="#c026d3" text-anchor="middle">غني بالمواد البنائية</text>
      <text x="550" y="160" font-size="10" fill="#d946ef" text-anchor="middle">والحديد والفيتامين</text>
    </g>
  </svg>`,

  // 4. التغذية المعدنية ومحلول كنوب NPK عند النبات الأخضر
  plantMineralNutrition: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
    <rect width="700" height="480" fill="#f8fafc" rx="14" />
    <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />

    <text x="350" y="38" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">التغذية المعدنية للنبات الأخضر وتأثير محلول كنوب (NPK)</text>

    <!-- الأنابيب الخمسة لمحلول كنوب -->
    <g transform="translate(25, 60)">
      <!-- 1. محلول كامل -->
      <g transform="translate(10, 0)">
        <rect x="0" y="80" width="90" height="120" fill="#dcfce7" stroke="#22c55e" stroke-width="1.5" rx="6"/>
        <!-- نبتة سليمة -->
        <path d="M 45,80 L 45,15" stroke="#15803d" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="25" cy="30" rx="18" ry="8" fill="#22c55e" transform="rotate(-30 25 30)"/>
        <ellipse cx="65" cy="30" rx="18" ry="8" fill="#22c55e" transform="rotate(30 65 30)"/>
        <ellipse cx="45" cy="15" rx="14" ry="7" fill="#16a34a"/>
        <text x="45" y="220" font-size="12" font-weight="bold" fill="#15803d" text-anchor="middle">1. محلول كامل</text>
        <text x="45" y="238" font-size="10" fill="#166534" text-anchor="middle">NPK 2‰</text>
        <text x="45" y="254" font-size="10" font-weight="bold" fill="#15803d" text-anchor="middle">نمو جيد جداً</text>
      </g>

      <!-- 2. بدون N -->
      <g transform="translate(135, 0)">
        <rect x="0" y="80" width="90" height="120" fill="#fef9c3" stroke="#eab308" stroke-width="1.5" rx="6"/>
        <path d="M 45,80 L 45,40" stroke="#ca8a04" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="30" cy="50" rx="12" ry="6" fill="#facc15" transform="rotate(-30 30 50)"/>
        <ellipse cx="60" cy="50" rx="12" ry="6" fill="#facc15" transform="rotate(30 60 50)"/>
        <text x="45" y="220" font-size="12" font-weight="bold" fill="#a16207" text-anchor="middle">2. بدون آزوت N</text>
        <text x="45" y="238" font-size="10" fill="#713f12" text-anchor="middle">PK فقط</text>
        <text x="45" y="254" font-size="10" font-weight="bold" fill="#ca8a04" text-anchor="middle">نبات قزم وأصفر</text>
      </g>

      <!-- 3. بدون P -->
      <g transform="translate(260, 0)">
        <rect x="0" y="80" width="90" height="120" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" rx="6"/>
        <path d="M 45,80 L 45,35" stroke="#166534" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="30" cy="45" rx="12" ry="6" fill="#14532d" transform="rotate(-30 30 45)"/>
        <ellipse cx="60" cy="45" rx="12" ry="6" fill="#14532d" transform="rotate(30 60 45)"/>
        <text x="45" y="220" font-size="12" font-weight="bold" fill="#14532d" text-anchor="middle">3. بدون فوسفور P</text>
        <text x="45" y="238" font-size="10" fill="#14532d" text-anchor="middle">NK فقط</text>
        <text x="45" y="254" font-size="10" font-weight="bold" fill="#14532d" text-anchor="middle">أوراق خضراء داكنة</text>
      </g>

      <!-- 4. بدون K -->
      <g transform="translate(385, 0)">
        <rect x="0" y="80" width="90" height="120" fill="#fef9c3" stroke="#fde047" stroke-width="1.5" rx="6"/>
        <path d="M 45,80 L 45,38" stroke="#854d0e" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="32" cy="48" rx="11" ry="5" fill="#eab308" transform="rotate(-30 32 48)"/>
        <ellipse cx="58" cy="48" rx="11" ry="5" fill="#eab308" transform="rotate(30 58 48)"/>
        <text x="45" y="220" font-size="12" font-weight="bold" fill="#854d0e" text-anchor="middle">4. بدون بوتاسيوم K</text>
        <text x="45" y="238" font-size="10" fill="#854d0e" text-anchor="middle">NP فقط</text>
        <text x="45" y="254" font-size="10" font-weight="bold" fill="#854d0e" text-anchor="middle">نمو بطيء ومصفر</text>
      </g>

      <!-- 5. مفرط التركيز 20‰ -->
      <g transform="translate(510, 0)">
        <rect x="0" y="80" width="90" height="120" fill="#fef2f2" stroke="#f87171" stroke-width="1.5" rx="6"/>
        <path d="M 45,80 L 45,60 C 45,50 60,65 70,75" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="70" cy="75" rx="10" ry="4" fill="#78350f" transform="rotate(45 70 75)"/>
        <text x="45" y="220" font-size="12" font-weight="bold" fill="#dc2626" text-anchor="middle">5. تركيز عالٍ NPK</text>
        <text x="45" y="238" font-size="10" fill="#991b1b" text-anchor="middle">NPK 20‰</text>
        <text x="45" y="254" font-size="10" font-weight="bold" fill="#dc2626" text-anchor="middle">ذبول وموت النبات</text>
      </g>
    </g>

    <!-- تركيب محلول كنوب الأساسي -->
    <g transform="translate(35, 335)">
      <rect width="630" height="120" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" rx="10"/>
      <text x="315" y="25" font-size="14" font-weight="bold" fill="#15803d" text-anchor="middle">مكونات محلول كنوب المخبري (NPK 2‰)</text>
      <text x="590" y="55" font-size="12" fill="#14532d" text-anchor="end">• ماء مقطر: 1000 ملل (1 لتر)</text>
      <text x="590" y="78" font-size="12" fill="#14532d" text-anchor="end">• نترات الكالسيوم (الآزوت N): 1 غرام</text>
      <text x="590" y="100" font-size="12" fill="#14532d" text-anchor="end">• فوسفات أحادي البوتاسيوم (الفوسفور P): 0.75 غرام</text>
      <text x="250" y="55" font-size="12" fill="#14532d" text-anchor="end">• نترات البوتاسيوم (البوتاسيوم K): 0.25 غرام</text>
      <text x="250" y="78" font-size="12" fill="#14532d" text-anchor="end">• كلورير الحديد: أثر (قطرات قليلة)</text>
      <text x="250" y="100" font-size="12" font-weight="bold" fill="#16a34a" text-anchor="end">أي نقص أو إفراط يؤثر سلباً على حياة النبات</text>
    </g>
  </svg>`,

  // 5. مقر الامتصاص (الأوبار الماصة والثغور الورقية)
  plantAbsorption: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
    <rect width="700" height="480" fill="#f8fafc" rx="14" />
    <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />

    <text x="350" y="38" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">مقر الامتصاص عند النبات الأخضر (الجذر والثغر الورقي)</text>

    <!-- رسم مقطع الجذر ومناطقه -->
    <g transform="translate(40, 60)">
      <rect width="280" height="390" fill="#fffbeb" stroke="#fde68a" stroke-width="1.5" rx="8"/>
      <text x="140" y="28" font-size="15" font-weight="bold" fill="#92400e" text-anchor="middle">1. بنية الجذر ومناطق الامتصاص</text>

      <!-- رسم تخطيطي للجذر -->
      <path d="M 120,50 L 120,320 C 120,340 160,340 160,320 L 160,50 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>
      
      <!-- المنطقة الفلينية -->
      <line x1="120" y1="90" x2="160" y2="90" stroke="#78350f" stroke-dasharray="3 3"/>
      <text x="70" y="75" font-size="11" font-weight="bold" fill="#78350f" text-anchor="middle">المنطقة الفلينية</text>

      <!-- المنطقة الوبرية والأوبار الماصة -->
      <line x1="120" y1="180" x2="160" y2="180" stroke="#78350f" stroke-dasharray="3 3"/>
      <!-- أوبار ماصة يمينا ويسارا -->
      <line x1="120" y1="105" x2="90" y2="105" stroke="#f97316" stroke-width="2"/>
      <line x1="120" y1="125" x2="85" y2="125" stroke="#f97316" stroke-width="2"/>
      <line x1="120" y1="145" x2="90" y2="145" stroke="#f97316" stroke-width="2"/>
      <line x1="120" y1="165" x2="85" y2="165" stroke="#f97316" stroke-width="2"/>
      <line x1="160" y1="105" x2="190" y2="105" stroke="#f97316" stroke-width="2"/>
      <line x1="160" y1="125" x2="195" y2="125" stroke="#f97316" stroke-width="2"/>
      <line x1="160" y1="145" x2="190" y2="145" stroke="#f97316" stroke-width="2"/>
      <line x1="160" y1="165" x2="195" y2="165" stroke="#f97316" stroke-width="2"/>
      <rect x="15" y="130" width="60" height="24" fill="#ea580c" rx="4"/>
      <text x="45" y="146" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">أوبار ماصة</text>
      <text x="235" y="140" font-size="11" font-weight="bold" fill="#c2410c" text-anchor="middle">المنطقة الوبرية</text>
      <text x="235" y="155" font-size="9" fill="#ea580c" text-anchor="middle">(مقر الامتصاص)</text>

      <!-- منطقة النمو -->
      <line x1="120" y1="260" x2="160" y2="260" stroke="#78350f" stroke-dasharray="3 3"/>
      <text x="70" y="225" font-size="11" font-weight="bold" fill="#78350f" text-anchor="middle">منطقة النمو</text>

      <!-- القلنسوة -->
      <path d="M 120,290 L 140,335 L 160,290 Z" fill="#b45309"/>
      <text x="70" y="315" font-size="11" font-weight="bold" fill="#78350f" text-anchor="middle">القلنسوة</text>
      
      <rect x="20" y="355" width="240" height="25" fill="#fef3c7" rx="4"/>
      <text x="140" y="372" font-size="11" font-weight="bold" fill="#92400e" text-anchor="middle">يمتص المحلول المعدني بالأوبار الماصة</text>
    </g>

    <!-- رسم بنية الثغر الورقي -->
    <g transform="translate(360, 60)">
      <rect width="300" height="390" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5" rx="8"/>
      <text x="150" y="28" font-size="15" font-weight="bold" fill="#15803d" text-anchor="middle">2. بنية الثغر (المسامة) في الأوراق</text>

      <!-- رسم الثغر المجهري -->
      <g transform="translate(70, 70)">
        <!-- خليتان حارستان كلوية الشكل -->
        <path d="M 40,20 C 15,40 15,100 40,120 C 55,100 55,40 40,20 Z" fill="#86efac" stroke="#15803d" stroke-width="2"/>
        <path d="M 120,20 C 145,40 145,100 120,120 C 105,100 105,40 120,20 Z" fill="#86efac" stroke="#15803d" stroke-width="2"/>
        <!-- الفتحة الثغرية -->
        <ellipse cx="80" cy="70" rx="15" ry="30" fill="#047857"/>
        <!-- صانعات خضراء ونواة -->
        <circle cx="35" cy="70" r="6" fill="#166534"/>
        <circle cx="125" cy="70" r="6" fill="#166534"/>
      </g>

      <text x="150" y="235" font-size="12" font-weight="bold" fill="#166534" text-anchor="middle">فتحة الثغر (تبادل غازات CO2 و O2 وبخار الماء)</text>
      
      <!-- بطاقة شرح المبادلات -->
      <rect x="15" y="260" width="270" height="115" fill="#ffffff" stroke="#86efac" rx="6"/>
      <text x="270" y="282" font-size="12" font-weight="bold" fill="#15803d" text-anchor="end">• المبادلات الغازية اليخضورية:</text>
      <text x="270" y="302" font-size="11" fill="#14532d" text-anchor="end">امتصاص CO2 وطرح O2 في وجود الضوء.</text>
      <text x="270" y="330" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="end">• ظاهرة النتح:</text>
      <text x="270" y="350" font-size="11" fill="#075985" text-anchor="end">طرح الماء الزائد في شكل بخار عبر الثغور.</text>
    </g>
  </svg>`,

  // 6. التركيب الضوئي وانتقال النسغ في النبات
  photosynthesisSap: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
    <rect width="700" height="480" fill="#f8fafc" rx="14" />
    <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />

    <text x="350" y="38" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">التركيب الضوئي ومسار انتقال النسغ الناقص والكامل</text>

    <!-- رسم النبتة والمسارات -->
    <g transform="translate(180, 55)">
      <!-- الشمس / الضوء -->
      <circle cx="30" cy="30" r="18" fill="#facc15" stroke="#eab308" stroke-width="2"/>
      <line x1="30" y1="5" x2="30" y2="-5" stroke="#facc15" stroke-width="2"/>
      <line x1="55" y1="30" x2="65" y2="30" stroke="#facc15" stroke-width="2"/>
      <line x1="48" y1="48" x2="60" y2="60" stroke="#facc15" stroke-width="2"/>
      <text x="75" y="45" font-size="12" font-weight="bold" fill="#ca8a04">ضوء الشمس</text>

      <!-- أوراق وساق -->
      <rect x="160" y="70" width="16" height="230" fill="#86efac" stroke="#16a34a" stroke-width="2" rx="4"/>
      
      <!-- ورقة التركيب الضوئي -->
      <path d="M 175,120 C 230,80 290,110 280,150 C 250,180 200,160 175,140 Z" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
      <text x="240" y="125" font-size="11" font-weight="bold" fill="#ffffff">التركيب الضوئي</text>
      
      <!-- أسهم الغازات -->
      <path d="M 310,105 L 275,120" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arrow)" stroke-dasharray="2 2"/>
      <text x="315" y="105" font-size="11" font-weight="bold" fill="#dc2626">امتصاص CO2</text>
      
      <path d="M 275,155 L 310,170" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow)" stroke-dasharray="2 2"/>
      <text x="315" y="175" font-size="11" font-weight="bold" fill="#2563eb">طرح O2 وبخار الماء</text>

      <!-- ثمرة مدخرات -->
      <circle cx="120" cy="180" r="22" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
      <text x="120" y="185" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">ثمرة (مدخرات)</text>

      <!-- مسار النسغ الصاعد (ناقص - أزرق) -->
      <path d="M 164,280 L 164,130" stroke="#0284c7" stroke-width="4" stroke-linecap="round"/>
      <!-- مسار النسغ الهابط (كامل - أحمر/أخضر) -->
      <path d="M 172,140 L 172,280" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/>

      <!-- الجذور والتربة -->
      <rect x="90" y="300" width="160" height="60" fill="#fef3c7" stroke="#d97706" rx="6"/>
      <path d="M 168,300 L 168,350 M 168,320 L 130,345 M 168,325 L 205,345" stroke="#78350f" stroke-width="2.5"/>
      <text x="168" y="358" font-size="10" font-weight="bold" fill="#78350f" text-anchor="middle">امتصاص النسغ الناقص من التربة</text>
    </g>

    <!-- مقارنة بين النسغين -->
    <g transform="translate(30, 395)">
      <rect width="640" height="70" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
      <text x="620" y="25" font-size="12" font-weight="bold" fill="#0284c7" text-anchor="end">• النسغ الناقص (الأزرق):</text>
      <text x="480" y="25" font-size="11" fill="#0369a1" text-anchor="end">ماء + أملاح معدنية ممتصة، ينتقل صعوداً في الأوعية الخشبية نحو الأوراق.</text>
      
      <text x="620" y="52" font-size="12" font-weight="bold" fill="#16a34a" text-anchor="end">• النسغ الكامل (الأخضر):</text>
      <text x="480" y="52" font-size="11" fill="#14532d" text-anchor="end">نسغ ناقص + مواد عضوية مركبة، ينتقل إلى كافة أجزاء النبات لتغذيته وتخزين الفائض.</text>
    </g>
  </svg>`,

  // 7. الجهاز التنفسي والسنخ الرئوي عند الإنسان
  humanRespiratory: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
    <rect width="700" height="480" fill="#f8fafc" rx="14" />
    <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />

    <text x="350" y="38" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">الجهاز التنفسي والمبادلات الغازية على مستوى السنخ الرئوي</text>

    <!-- الجهاز التنفسي العام -->
    <g transform="translate(40, 60)">
      <rect width="280" height="390" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.5" rx="8"/>
      <text x="140" y="25" font-size="14" font-weight="bold" fill="#0369a1" text-anchor="middle">مجاري الجهاز التنفسي</text>

      <!-- أنف وفم ورغامى -->
      <path d="M 130,45 L 150,45 L 140,75 L 140,140" stroke="#0284c7" stroke-width="5" stroke-linecap="round" fill="none"/>
      <!-- تفرع لقصبتين -->
      <path d="M 140,140 L 95,180 M 140,140 L 185,180" stroke="#0284c7" stroke-width="4"/>
      
      <!-- الرئة اليمنى واليسرى -->
      <path d="M 60,170 C 40,190 40,270 80,290 C 110,290 120,240 100,180 Z" fill="#fca5a5" stroke="#dc2626" stroke-width="1.5"/>
      <path d="M 220,170 C 240,190 240,270 200,290 C 170,290 160,240 180,180 Z" fill="#fca5a5" stroke="#dc2626" stroke-width="1.5"/>

      <text x="140" y="55" font-size="11" fill="#0c4a6e" text-anchor="middle">الأنف والفم</text>
      <text x="140" y="110" font-size="11" font-weight="bold" fill="#0284c7" text-anchor="middle">الرغامى</text>
      <text x="85" y="235" font-size="12" font-weight="bold" fill="#991b1b" text-anchor="middle">رئة يمنى</text>
      <text x="195" y="235" font-size="12" font-weight="bold" fill="#991b1b" text-anchor="middle">رئة يسرى</text>

      <rect x="15" y="315" width="250" height="60" fill="#ffffff" stroke="#7dd3fc" rx="6"/>
      <text x="140" y="335" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">خصائص سطح التبادل الرئوي:</text>
      <text x="140" y="352" font-size="10" fill="#0c4a6e" text-anchor="middle">• 700 مليون سنخ رئوي (مساحة 200 م²)</text>
      <text x="140" y="367" font-size="10" fill="#0c4a6e" text-anchor="middle">• غشاء رقيق جداً وغني بالشعيرات الدموية</text>
    </g>

    <!-- تكبير السنخ الرئوي -->
    <g transform="translate(350, 60)">
      <rect width="310" height="390" fill="#fef2f2" stroke="#fecaca" stroke-width="1.5" rx="8"/>
      <text x="155" y="25" font-size="14" font-weight="bold" fill="#dc2626" text-anchor="middle">بنية السنخ الرئوي (مقر المبادلات)</text>

      <!-- كيس السنخ الرئوي -->
      <g transform="translate(75, 45)">
        <ellipse cx="80" cy="90" rx="65" ry="60" fill="#ffffff" stroke="#f87171" stroke-width="2"/>
        <!-- شعيرة دموية محيطة -->
        <path d="M 0,90 C 20,170 140,170 160,90" fill="none" stroke="#ef4444" stroke-width="18" stroke-linecap="round"/>
        <path d="M 0,90 C 20,170 140,170 160,90" fill="none" stroke="#3b82f6" stroke-width="14" stroke-linecap="round" stroke-dasharray="80 150"/>
        
        <!-- أسهم دخول وخروج الهواء -->
        <path d="M 80,0 L 80,50" stroke="#2563eb" stroke-width="3"/>
        <text x="50" y="25" font-size="10" font-weight="bold" fill="#2563eb">شهيق O2</text>
        <path d="M 95,50 L 95,0" stroke="#ea580c" stroke-width="3"/>
        <text x="125" y="25" font-size="10" font-weight="bold" fill="#ea580c">زفير CO2</text>

        <!-- أسهم التبادل الغازي عبر الغشاء -->
        <text x="80" y="85" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">تجويف السنخ</text>
        <path d="M 70,110 L 70,135" stroke="#2563eb" stroke-width="2.5"/>
        <text x="55" y="125" font-size="9" font-weight="bold" fill="#2563eb">O2</text>
        <path d="M 90,135 L 90,110" stroke="#dc2626" stroke-width="2.5"/>
        <text x="105" y="125" font-size="9" font-weight="bold" fill="#dc2626">CO2</text>
      </g>

      <!-- جدول هواء الشهيق والزفير -->
      <g transform="translate(15, 230)">
        <rect width="280" height="145" fill="#ffffff" stroke="#cbd5e1" rx="6"/>
        <text x="140" y="20" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">مقارنة هواء الشهيق وهواء الزفير</text>
        <line x1="10" y1="30" x2="270" y2="30" stroke="#e2e8f0"/>
        
        <text x="260" y="50" font-size="11" font-weight="bold" fill="#334155" text-anchor="end">الغاز</text>
        <text x="180" y="50" font-size="11" font-weight="bold" fill="#2563eb" text-anchor="end">هواء الشهيق</text>
        <text x="80" y="50" font-size="11" font-weight="bold" fill="#dc2626" text-anchor="end">هواء الزفير</text>

        <text x="260" y="75" font-size="11" fill="#334155" text-anchor="end">الأكسجين O2</text>
        <text x="170" y="75" font-size="11" fill="#2563eb" text-anchor="end">21 %</text>
        <text x="70" y="75" font-size="11" fill="#dc2626" text-anchor="end">16 % (أقل)</text>

        <text x="260" y="100" font-size="11" fill="#334155" text-anchor="end">ثاني أكسيد CO2</text>
        <text x="170" y="100" font-size="11" fill="#2563eb" text-anchor="end">0.03 %</text>
        <text x="70" y="100" font-size="11" fill="#dc2626" text-anchor="end">4 % (أكثر)</text>

        <text x="260" y="125" font-size="11" fill="#334155" text-anchor="end">بخار الماء</text>
        <text x="170" y="125" font-size="11" fill="#2563eb" text-anchor="end">متغير</text>
        <text x="70" y="125" font-size="11" fill="#dc2626" text-anchor="end">كثيف مشبع</text>
      </g>
    </g>
  </svg>`,

  // 8. الجهاز البولي وبنية الكلية والإطراح
  urinarySystem: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
    <rect width="700" height="480" fill="#f8fafc" rx="14" />
    <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />

    <text x="350" y="38" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">أجهزة الإطراح عند الإنسان (الجهاز البولي والجلد)</text>

    <!-- الجهاز البولي -->
    <g transform="translate(30, 60)">
      <rect width="300" height="390" fill="#fef2f2" stroke="#fca5a5" stroke-width="1.5" rx="8"/>
      <text x="150" y="25" font-size="14" font-weight="bold" fill="#b91c1c" text-anchor="middle">1. الجهاز البولي (تصفية الدم)</text>

      <!-- الأوعية الرئيسية (شريان أحمر ووريد أزرق) -->
      <path d="M 140,40 L 140,210" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>
      <path d="M 160,40 L 160,210" stroke="#2563eb" stroke-width="8" stroke-linecap="round"/>

      <!-- كليتان حبة فاصولياء -->
      <path d="M 80,70 C 50,70 50,140 80,140 C 95,140 95,70 80,70 Z" fill="#991b1b" stroke="#7f1d1d" stroke-width="2"/>
      <path d="M 220,70 C 250,70 250,140 220,140 C 205,140 205,70 220,70 Z" fill="#991b1b" stroke="#7f1d1d" stroke-width="2"/>

      <text x="50" y="105" font-size="11" font-weight="bold" fill="#991b1b">كلية يمنى</text>
      <text x="245" y="105" font-size="11" font-weight="bold" fill="#991b1b">كلية يسرى</text>

      <!-- الحالبان -->
      <path d="M 85,130 C 85,200 130,230 135,260" fill="none" stroke="#f59e0b" stroke-width="3"/>
      <path d="M 215,130 C 215,200 170,230 165,260" fill="none" stroke="#f59e0b" stroke-width="3"/>
      <text x="75" y="210" font-size="11" font-weight="bold" fill="#b45309">حالب أيمن</text>
      <text x="225" y="210" font-size="11" font-weight="bold" fill="#b45309">حالب أيسر</text>

      <!-- المثانة والإحليل -->
      <ellipse cx="150" cy="275" rx="35" ry="25" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <text x="150" y="280" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">المثانة</text>
      <line x1="150" y1="300" x2="150" y2="330" stroke="#ca8a04" stroke-width="4"/>
      <text x="150" y="348" font-size="11" font-weight="bold" fill="#713f12" text-anchor="middle">الإحليل (مجرى البول)</text>

      <rect x="15" y="360" width="270" height="20" fill="#fee2e2" rx="4"/>
      <text x="150" y="375" font-size="10" font-weight="bold" fill="#991b1b" text-anchor="middle">تخلص الكليتان الدم من البولة وحمض البول</text>
    </g>

    <!-- الجلد ومقارنة البول والعرق -->
    <g transform="translate(350, 60)">
      <rect width="320" height="390" fill="#fffbeb" stroke="#fde68a" stroke-width="1.5" rx="8"/>
      <text x="160" y="25" font-size="14" font-weight="bold" fill="#92400e" text-anchor="middle">2. مقطع الجلد (الغدة العرقية)</text>

      <!-- مقطع البشرة والأدمة -->
      <g transform="translate(20, 45)">
        <rect x="0" y="0" width="280" height="30" fill="#fed7aa" stroke="#fb923c" rx="4"/>
        <text x="240" y="20" font-size="11" font-weight="bold" fill="#9a3412">البشرة (مسامات)</text>

        <rect x="0" y="35" width="280" height="110" fill="#ffedd5" stroke="#fdba74" rx="4"/>
        <text x="240" y="55" font-size="11" font-weight="bold" fill="#9a3412">الأدمة</text>

        <!-- غدة عرقية ملتفة وقناة إفراغ -->
        <path d="M 120,0 L 120,70 C 100,75 90,115 130,120 C 150,110 130,80 115,95" fill="none" stroke="#0284c7" stroke-width="3"/>
        <text x="60" y="115" font-size="11" font-weight="bold" fill="#0369a1">غدة عرقية</text>
        <circle cx="120" cy="0" r="4" fill="#0284c7"/>
        <text x="120" y="-8" font-size="10" font-weight="bold" fill="#0284c7" text-anchor="middle">مسامة عرقية</text>
      </g>

      <!-- مقارنة البول والعرق -->
      <g transform="translate(15, 215)">
        <rect width="290" height="160" fill="#ffffff" stroke="#cbd5e1" rx="6"/>
        <text x="145" y="22" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">مقارنة تركيب البول والعرق</text>
        <line x1="10" y1="32" x2="280" y2="32" stroke="#e2e8f0"/>

        <text x="270" y="50" font-size="11" font-weight="bold" fill="#475569" text-anchor="end">المكون (غ/ل)</text>
        <text x="190" y="50" font-size="11" font-weight="bold" fill="#ca8a04" text-anchor="end">البول</text>
        <text x="90" y="50" font-size="11" font-weight="bold" fill="#0284c7" text-anchor="end">العرق</text>

        <text x="270" y="75" font-size="11" fill="#334155" text-anchor="end">الماء</text>
        <text x="180" y="75" font-size="11" fill="#334155" text-anchor="end">950 - 990</text>
        <text x="80" y="75" font-size="11" fill="#334155" text-anchor="end">950 - 990</text>

        <text x="270" y="100" font-size="11" fill="#334155" text-anchor="end">الأملاح المعدنية</text>
        <text x="180" y="100" font-size="11" fill="#334155" text-anchor="end">6 - 10 غ</text>
        <text x="80" y="100" font-size="11" fill="#334155" text-anchor="end">0.5 - 4 غ</text>

        <text x="270" y="125" font-size="11" fill="#334155" text-anchor="end">الفضلات (البولة)</text>
        <text x="180" y="125" font-size="11" font-weight="bold" fill="#ca8a04" text-anchor="end">20 - 30 غ</text>
        <text x="80" y="125" font-size="11" font-weight="bold" fill="#0284c7" text-anchor="end">0.7 غ (مخفف)</text>

        <text x="145" y="148" font-size="10" font-weight="bold" fill="#0369a1" text-anchor="middle">العرق بول مخفف يطرح عبر الغدد العرقية</text>
      </g>
    </g>
  </svg>`,

  // 9. بنية البذرة ومراحل الإنتاش
  seedGermination: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
    <rect width="700" height="480" fill="#f8fafc" rx="14" />
    <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />

    <text x="350" y="38" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">بنية بذرة الفاصولياء ومراحل الإنتاش</text>

    <!-- بنية البذرة -->
    <g transform="translate(30, 60)">
      <rect width="280" height="390" fill="#fffbeb" stroke="#fde68a" stroke-width="1.5" rx="8"/>
      <text x="140" y="25" font-size="14" font-weight="bold" fill="#92400e" text-anchor="middle">1. بنية بذرة الفاصولياء المفتوحة</text>

      <!-- فلقة كلية -->
      <g transform="translate(40, 50)">
        <path d="M 40,20 C -10,60 -10,160 40,200 C 130,220 180,180 180,110 C 180,40 120,0 40,20 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
        <text x="90" y="120" font-size="14" font-weight="bold" fill="#854d0e" text-anchor="middle">فلقة (مدخرات)</text>

        <!-- الرشيم (النبيتة) -->
        <g transform="translate(30, 40)">
          <!-- جذير -->
          <path d="M 25,60 C 20,40 10,20 0,10" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/>
          <text x="-15" y="15" font-size="11" font-weight="bold" fill="#15803d">جذير</text>
          <!-- سويقة -->
          <path d="M 25,60 L 35,75" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/>
          <text x="50" y="65" font-size="11" font-weight="bold" fill="#15803d">سويقة</text>
          <!-- عجز وأوراق أولية -->
          <ellipse cx="45" cy="85" rx="10" ry="6" fill="#22c55e"/>
          <text x="65" y="90" font-size="11" font-weight="bold" fill="#15803d">عجز</text>
        </g>
      </g>

      <rect x="15" y="295" width="250" height="80" fill="#ffffff" stroke="#fef08a" rx="6"/>
      <text x="240" y="318" font-size="11" font-weight="bold" fill="#713f12" text-anchor="end">• اللحافة: غشاء خارجي لحماية البذرة.</text>
      <text x="240" y="340" font-size="11" font-weight="bold" fill="#713f12" text-anchor="end">• الفلقتان: مدخرات غذائية (نشاء وبروتين).</text>
      <text x="240" y="362" font-size="11" font-weight="bold" fill="#15803d" text-anchor="end">• الرشيم: كائن حي نائم يتحول لنبتة كاملة.</text>
    </g>

    <!-- مراحل الإنتاش المتسلسلة -->
    <g transform="translate(330, 60)">
      <rect width="340" height="390" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5" rx="8"/>
      <text x="170" y="25" font-size="14" font-weight="bold" fill="#15803d" text-anchor="middle">2. المراحل الأساسية للإنتاش</text>

      <!-- المرحلة 1 -->
      <g transform="translate(20, 45)">
        <rect width="300" height="50" fill="#ffffff" stroke="#86efac" rx="6"/>
        <circle cx="25" cy="25" r="14" fill="#22c55e"/>
        <text x="25" y="30" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">1</text>
        <text x="280" y="22" font-size="11" font-weight="bold" fill="#166534" text-anchor="end">انتفاخ البذرة وبروز الجذير</text>
        <text x="280" y="38" font-size="10" fill="#15803d" text-anchor="end">تمزق اللحافة وخروج الجذير نحو الأسفل</text>
      </g>

      <!-- المرحلة 2 -->
      <g transform="translate(20, 105)">
        <rect width="300" height="50" fill="#ffffff" stroke="#86efac" rx="6"/>
        <circle cx="25" cy="25" r="14" fill="#22c55e"/>
        <text x="25" y="30" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">2</text>
        <text x="280" y="22" font-size="11" font-weight="bold" fill="#166534" text-anchor="end">نمو السويقة نحو الأعلى</text>
        <text x="280" y="38" font-size="10" fill="#15803d" text-anchor="end">استطالة السويقة رافعة الفلقتين فوق التربة</text>
      </g>

      <!-- المرحلة 3 -->
      <g transform="translate(20, 165)">
        <rect width="300" height="50" fill="#ffffff" stroke="#86efac" rx="6"/>
        <circle cx="25" cy="25" r="14" fill="#22c55e"/>
        <text x="25" y="30" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">3</text>
        <text x="280" y="22" font-size="11" font-weight="bold" fill="#166534" text-anchor="end">تشكل الجذور والساق</text>
        <text x="280" y="38" font-size="10" fill="#15803d" text-anchor="end">تفرع الجذور ونمو العجز لأوراق خضراء أولية</text>
      </g>

      <!-- المرحلة 4 -->
      <g transform="translate(20, 225)">
        <rect width="300" height="50" fill="#ffffff" stroke="#86efac" rx="6"/>
        <circle cx="25" cy="25" r="14" fill="#22c55e"/>
        <text x="25" y="30" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">4</text>
        <text x="280" y="22" font-size="11" font-weight="bold" fill="#166534" text-anchor="end">ذبول وسقوط الفلقتين</text>
        <text x="280" y="38" font-size="10" fill="#15803d" text-anchor="end">استهلاك كامل المدخرات بعد اكتمال النبتة الفتية</text>
      </g>

      <rect x="20" y="290" width="300" height="85" fill="#dcfce7" stroke="#4ade80" rx="6"/>
      <text x="170" y="315" font-size="11" font-weight="bold" fill="#14532d" text-anchor="middle">تعريف الإنتاش:</text>
      <text x="170" y="335" font-size="10" fill="#14532d" text-anchor="middle">مجموع التحولات المورفولوجية والفيزيولوجية</text>
      <text x="170" y="352" font-size="10" fill="#14532d" text-anchor="middle">التي تطرأ على البذرة أثناء تحول الرشيم إلى نبتة فتية مستقلة</text>
    </g>
  </svg>`,

  // 10. بنية الزهرة والتأبير والإلقاح عند النباتات الزهرية
  flowerReproduction: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
    <rect width="700" height="480" fill="#f8fafc" rx="14" />
    <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />

    <text x="350" y="38" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">بنية الزهرة الكاملة، التأبير، والإلقاح الزهري</text>

    <!-- رسم تشريح الزهرة -->
    <g transform="translate(40, 60)">
      <rect width="300" height="390" fill="#fdf4ff" stroke="#f0abfc" stroke-width="1.5" rx="8"/>
      <text x="150" y="25" font-size="14" font-weight="bold" fill="#a21caf" text-anchor="middle">1. مقطع طولي في زهرة كاملة خنثى</text>

      <!-- الكأس والسبلات -->
      <path d="M 120,310 L 150,340 L 180,310" stroke="#15803d" stroke-width="6" fill="none"/>
      <text x="70" y="335" font-size="11" font-weight="bold" fill="#15803d">سبلة (كأس)</text>

      <!-- التويج والبتلات الملونة -->
      <path d="M 80,240 C 40,160 80,100 120,160 Z" fill="#f472b6" stroke="#db2777" stroke-width="2"/>
      <path d="M 220,240 C 260,160 220,100 180,160 Z" fill="#f472b6" stroke="#db2777" stroke-width="2"/>
      <text x="50" y="140" font-size="11" font-weight="bold" fill="#db2777">بتلة (تويج)</text>

      <!-- المدقة (أنثوي) في المركز -->
      <g transform="translate(130, 130)">
        <ellipse cx="20" cy="120" rx="20" ry="25" fill="#86efac" stroke="#15803d" stroke-width="2"/>
        <text x="20" y="125" font-size="10" font-weight="bold" fill="#14532d" text-anchor="middle">مبيض (بويضات)</text>
        <line x1="20" y1="95" x2="20" y2="40" stroke="#16a34a" stroke-width="4"/>
        <text x="-15" y="70" font-size="10" font-weight="bold" fill="#15803d">قلم</text>
        <ellipse cx="20" cy="35" rx="10" ry="6" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
        <text x="20" y="20" font-size="11" font-weight="bold" fill="#ca8a04" text-anchor="middle">ميسم</text>
      </g>
      <text x="225" y="280" font-size="11" font-weight="bold" fill="#15803d">المدقة (عضو أنثوي)</text>

      <!-- الأسدية (ذكرية) يمينا ويسارا -->
      <g transform="translate(90, 150)">
        <line x1="15" y1="120" x2="0" y2="40" stroke="#ca8a04" stroke-width="2.5"/>
        <ellipse cx="0" cy="35" rx="8" ry="5" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/>
        <text x="-10" y="30" font-size="10" font-weight="bold" fill="#b45309">مئبر (طلع)</text>
      </g>
      <g transform="translate(180, 150)">
        <line x1="15" y1="120" x2="30" y2="40" stroke="#ca8a04" stroke-width="2.5"/>
        <ellipse cx="30" cy="35" rx="8" ry="5" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/>
      </g>
      <text x="75" y="280" font-size="11" font-weight="bold" fill="#b45309">سداة (عضو ذكري)</text>
    </g>

    <!-- التأبير والإلقاح ودورة الحياة -->
    <g transform="translate(360, 60)">
      <rect width="300" height="390" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5" rx="8"/>
      <text x="150" y="25" font-size="14" font-weight="bold" fill="#15803d" text-anchor="middle">2. التأبير وتطور الثمرة والبذور</text>

      <g transform="translate(15, 45)">
        <rect width="270" height="90" fill="#ffffff" stroke="#86efac" rx="6"/>
        <text x="255" y="22" font-size="12" font-weight="bold" fill="#16a34a" text-anchor="end">• عملية التأبير (Pollinisation):</text>
        <text x="255" y="42" font-size="11" fill="#14532d" text-anchor="end">انتقال حبوب الطلع من المئبر إلى الميسم.</text>
        <text x="255" y="62" font-size="11" fill="#14532d" text-anchor="end">تأبير ذاتي (في نفس الزهرة الخنثى) أو خلطي</text>
        <text x="255" y="80" font-size="10" fill="#15803d" text-anchor="end">بواسطة: الحشرات (النحل)، الرياح، أو الإنسان.</text>
      </g>

      <g transform="translate(15, 145)">
        <rect width="270" height="100" fill="#ffffff" stroke="#86efac" rx="6"/>
        <text x="255" y="22" font-size="12" font-weight="bold" fill="#16a34a" text-anchor="end">• عملية الإلقاح الزهري:</text>
        <text x="255" y="42" font-size="11" fill="#14532d" text-anchor="end">نمو أنبوب طلعي من حبة الطلع عبر القلم</text>
        <text x="255" y="62" font-size="11" fill="#14532d" text-anchor="end">لإلقاح البويضة داخل المبيض.</text>
        <text x="255" y="85" font-size="11" font-weight="bold" fill="#0284c7" text-anchor="end">بيضة ملقحة ➔ تتطور إلى بذرة</text>
      </g>

      <g transform="translate(15, 255)">
        <rect width="270" height="115" fill="#fef9c3" stroke="#fde047" rx="6"/>
        <text x="255" y="22" font-size="12" font-weight="bold" fill="#854d0e" text-anchor="end">• مصير أجزاء الزهرة بعد الإلقاح:</text>
        <text x="255" y="45" font-size="11" fill="#713f12" text-anchor="end">1. المبيض ➔ يتحول إلى ثمرة لحمية أو جافة.</text>
        <text x="255" y="68" font-size="11" fill="#713f12" text-anchor="end">2. البويضات الملقحة ➔ تتحول إلى بذور.</text>
        <text x="255" y="92" font-size="11" fill="#713f12" text-anchor="end">3. السبالت والبتلات والأسدية ➔ تذبل وتسقط.</text>
      </g>
    </g>
  </svg>`,

  // 11. بنية الخلية (الحيوانية والنباتية) وحدة بناء الكائنات الحية
  cellStructure: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
    <rect width="700" height="480" fill="#f8fafc" rx="14" />
    <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />

    <text x="350" y="38" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">بنية الخلية الحيوانية والخلية النباتية (الوحدة البنائية للكائنات الحية)</text>

    <!-- الخلية الحيوانية (مخاطية الفم) -->
    <g transform="translate(40, 60)">
      <rect width="290" height="340" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5" rx="8"/>
      <text x="145" y="25" font-size="14" font-weight="bold" fill="#1d4ed8" text-anchor="middle">1. خلية حيوانية (مخاطية الفم - تكبير 600x)</text>

      <!-- شكل الخلية الحيوانية المرن وغير المنتظم -->
      <g transform="translate(30, 45)">
        <path d="M 40,20 C 120,-10 210,30 220,110 C 230,190 170,220 90,210 C 10,200 -10,130 10,70 Z" fill="#dbeafe" stroke="#3b82f6" stroke-width="2.5"/>
        <!-- هيولى (سيتوبلازم) -->
        <text x="115" y="165" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="middle">هيولى (Cytoplasme)</text>
        <!-- نواة مركزية -->
        <ellipse cx="115" cy="100" rx="28" ry="24" fill="#1e3a8a" stroke="#1d4ed8" stroke-width="2"/>
        <text x="115" y="105" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">نواة</text>
        <circle cx="110" cy="95" r="5" fill="#60a5fa"/> <!-- نوية -->
      </g>

      <text x="270" y="280" font-size="11" font-weight="bold" fill="#2563eb" text-anchor="end">• غشاء هيولي خارجي مرن</text>
      <text x="270" y="300" font-size="11" font-weight="bold" fill="#2563eb" text-anchor="end">• هيولى سائلة تسبح فيها العضيات</text>
      <text x="270" y="320" font-size="11" font-weight="bold" fill="#1e3a8a" text-anchor="end">• نواة مركزية بها المادة الوراثية</text>
    </g>

    <!-- الخلية النباتية (حرشفة البصل) -->
    <g transform="translate(370, 60)">
      <rect width="290" height="340" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" rx="8"/>
      <text x="145" y="25" font-size="14" font-weight="bold" fill="#15803d" text-anchor="middle">2. خلية نباتية (بشرة البصل - تكبير 500x)</text>

      <!-- شكل هندسي سداسي منتظم بجدار سيليلوزي -->
      <g transform="translate(30, 45)">
        <polygon points="10,40 60,10 180,10 220,50 210,180 150,210 40,210 10,170" fill="#bbf7d0" stroke="#15803d" stroke-width="5"/>
        <polygon points="15,43 62,15 177,15 215,52 205,176 148,205 43,205 15,167" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
        
        <!-- فجوة عصارية كبيرة -->
        <ellipse cx="110" cy="115" rx="65" ry="50" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="3 3"/>
        <text x="110" y="120" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">فجوة عصارية نامية</text>

        <!-- نواة جانبية مضغوطة -->
        <ellipse cx="170" cy="65" rx="18" ry="14" fill="#14532d"/>
        <text x="170" y="69" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">نواة</text>
      </g>

      <text x="270" y="280" font-size="11" font-weight="bold" fill="#15803d" text-anchor="end">• جدار سيليلوزي سميك هيكلي</text>
      <text x="270" y="300" font-size="11" font-weight="bold" fill="#15803d" text-anchor="end">• غشاء هيولي + هيولى سيتوبلازمية</text>
      <text x="270" y="320" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="end">• فجوة عصارية كبيرة ممتلئة بالماء</text>
    </g>

    <!-- الخلاصة المشتركة -->
    <g transform="translate(40, 410)">
      <rect width="620" height="55" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
      <text x="310" y="24" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">الخلاصة: الخلية هي الوحدة التركيبية والبنائية والوظيفية الأساسية لجميع الكائنات الحية.</text>
      <text x="310" y="44" font-size="11" fill="#475569" text-anchor="middle">تشترك جميع الخلايا في: الغشاء الهيولي + الهيولى (السيتوبلازم) + النواة.</text>
    </g>
  </svg>`,
};
