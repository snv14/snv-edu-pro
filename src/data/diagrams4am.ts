// ================= الرسوم التخطيطية التفاعلية للسنة الرابعة متوسط (4AM) =================

export const DIAGRAMS_4AM = {
  // 1. الجهاز الهضمي ومحطات الهضم
  digestiveSystem: `<svg viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[460px] select-none font-sans">
  <defs>
    <linearGradient id="organGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f87171" />
      <stop offset="100%" stop-color="#dc2626" />
    </linearGradient>
    <linearGradient id="liverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b45309" />
      <stop offset="100%" stop-color="#78350f" />
    </linearGradient>
    <linearGradient id="stomachGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
    <filter id="shadow4am" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="3" stdDeviation="3" flood-opacity="0.15" />
    </filter>
  </defs>

  <rect width="700" height="520" fill="#f8fafc" rx="16" />
  <rect x="15" y="15" width="670" height="490" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="12" />

  <!-- العنوان -->
  <text x="350" y="45" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle">رسم تخطيطي وظيفي للجهاز الهضمي ومحطات الهضم عند الإنسان</text>

  <!-- رسم الأنبوب الهضمي -->
  <g transform="translate(140, 60)" filter="url(#shadow4am)">
    <!-- الرأس والفم -->
    <path d="M 120,20 C 100,20 80,40 80,70 C 80,90 95,110 120,115 L 120,150 L 140,150 L 140,115 C 160,110 170,90 170,70 C 170,40 150,20 120,20 Z" fill="#fed7aa" stroke="#fb923c" stroke-width="2"/>
    <ellipse cx="110" cy="75" rx="12" ry="6" fill="#ef4444"/> <!-- الفم -->

    <!-- الغدد اللعابية -->
    <ellipse cx="145" cy="65" rx="10" ry="7" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>
    <ellipse cx="135" cy="90" rx="8" ry="5" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>

    <!-- المرئ -->
    <path d="M 125,115 L 125,200 L 135,200 L 135,115 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="1.5"/>

    <!-- الكبد -->
    <path d="M 70,195 C 50,195 40,230 50,250 C 60,265 100,260 115,245 C 120,225 110,195 70,195 Z" fill="url(#liverGrad)" stroke="#451a03" stroke-width="2"/>
    <!-- الحويصل الصفراوي -->
    <ellipse cx="95" cy="245" rx="7" ry="10" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>

    <!-- المعدة -->
    <path d="M 130,200 C 110,200 95,215 105,245 C 115,270 150,270 165,245 C 175,225 160,200 130,200 Z" fill="url(#stomachGrad)" stroke="#c2410c" stroke-width="2"/>

    <!-- البنكرياس -->
    <path d="M 115,250 C 125,245 155,248 165,258 C 150,268 125,262 115,250 Z" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>

    <!-- المعي الغليظ -->
    <path d="M 80,270 L 80,380 L 180,380 L 180,270 L 165,270 L 165,365 L 95,365 L 95,270 Z" fill="#cbd5e1" stroke="#64748b" stroke-width="2" stroke-linejoin="round"/>
    <!-- الزائدة الدودية -->
    <path d="M 80,380 L 70,395" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
    <!-- المستقيم والشرج -->
    <path d="M 130,380 L 130,415 L 140,415 L 140,380 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>

    <!-- المعي الدقيق (داخل المعي الغليظ) -->
    <path d="M 105,280 Q 140,290 120,310 Q 150,320 115,335 Q 145,350 130,365" fill="none" stroke="#f472b6" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- البيانات والمحطات -->
  <!-- محطة 1: الفم -->
  <g transform="translate(430, 80)">
    <rect x="0" y="0" width="220" height="75" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="110" y="22" font-size="14" font-weight="bold" fill="#1d4ed8" text-anchor="middle">المحطة 1: الفم (هضم آلي + كيميائي)</text>
    <text x="110" y="42" font-size="12" fill="#334155" text-anchor="middle">• الأسنان واللسان واللعاب</text>
    <text x="110" y="60" font-size="12" font-weight="bold" fill="#059669" text-anchor="middle">نشاء + أميلاز لعابي ➔ مالتوز</text>
    <line x1="0" y1="35" x2="-180" y2="45" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="3,3"/>
  </g>

  <!-- محطة 2: المعدة -->
  <g transform="translate(430, 190)">
    <rect x="0" y="0" width="220" height="85" rx="8" fill="#fff7ed" stroke="#ea580c" stroke-width="1.5"/>
    <text x="110" y="22" font-size="14" font-weight="bold" fill="#c2410c" text-anchor="middle">المحطة 2: المعدة (الكيموس)</text>
    <text x="110" y="42" font-size="12" fill="#334155" text-anchor="middle">• طحن آلي بتقلصات الجدار</text>
    <text x="110" y="60" font-size="12" font-weight="bold" fill="#dc2626" text-anchor="middle">بروتين + بروتياز 1 (ببسين) ➔ ببتيدات</text>
    <text x="110" y="76" font-size="11" fill="#64748b" text-anchor="middle">وسط حامضي شديد (HCl)</text>
    <line x1="0" y1="40" x2="-155" y2="70" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="3,3"/>
  </g>

  <!-- محطة 3: المعي الدقيق -->
  <g transform="translate(430, 310)">
    <rect x="0" y="0" width="220" height="110" rx="8" fill="#fdf2f8" stroke="#db2777" stroke-width="1.5"/>
    <text x="110" y="22" font-size="14" font-weight="bold" fill="#be185d" text-anchor="middle">المحطة 3: المعي الدقيق (الكيلوس)</text>
    <text x="110" y="42" font-size="11" fill="#334155" text-anchor="middle">• مالتوز + مالتاز ➔ غلوكوز</text>
    <text x="110" y="60" font-size="11" fill="#334155" text-anchor="middle">• ببتيدات + بروتياز 2 ➔ أحماض أمينية</text>
    <text x="110" y="78" font-size="11" fill="#334155" text-anchor="middle">• دسم + صفراء + ليباز ➔ أحماض دسمة + غليسيرول</text>
    <text x="110" y="98" font-size="11" font-weight="bold" fill="#059669" text-anchor="middle">سائل غني بالمغذيات الجاهزة للامتصاص</text>
    <line x1="0" y1="50" x2="-160" y2="70" stroke="#db2777" stroke-width="1.5" stroke-dasharray="3,3"/>
  </g>

  <!-- تسميات الجهة اليسرى -->
  <g transform="translate(30, 140)">
    <text x="70" y="20" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="end">غدد لعابية</text>
    <line x1="75" y1="16" x2="195" y2="-10" stroke="#0284c7" stroke-width="1.2"/>

    <text x="70" y="80" font-size="12" font-weight="bold" fill="#78350f" text-anchor="end">الكبد والصفراء</text>
    <line x1="75" y1="76" x2="160" y2="100" stroke="#78350f" stroke-width="1.2"/>

    <text x="70" y="160" font-size="12" font-weight="bold" fill="#64748b" text-anchor="end">المعي الغليظ</text>
    <line x1="75" y1="156" x2="190" y2="180" stroke="#64748b" stroke-width="1.2"/>

    <text x="70" y="240" font-size="12" font-weight="bold" fill="#475569" text-anchor="end">فتحة الشرج (طرح الفضلات)</text>
    <line x1="75" y1="236" x2="240" y2="330" stroke="#475569" stroke-width="1.2"/>
  </g>
</svg>`,

  // 2. بنية الزغابة المعوية
  villusStructure: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <defs>
    <linearGradient id="villusBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fdf4ff" />
      <stop offset="100%" stop-color="#fae8ff" />
    </linearGradient>
    <filter id="villusShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.1" />
    </filter>
  </defs>

  <rect width="700" height="480" fill="#f8fafc" rx="16" />
  <rect x="15" y="15" width="670" height="450" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="12" />

  <text x="350" y="45" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle">رسم تخطيطي تفصيلي لبنية الزغابة المعوية (مقر الامتصاص)</text>

  <!-- جسم الزغابة المعوية -->
  <g transform="translate(180, 70)" filter="url(#villusShadow)">
    <!-- الغشاء الخارجي للزغابة (ظهارة معوية رقيقة ذات خلايا ماصة وخلايا مخاطية) -->
    <path d="M 80,330 L 80,100 C 80,20 200,20 200,100 L 200,330 Z" fill="url(#villusBg)" stroke="#c084fc" stroke-width="3"/>

    <!-- خلايا الظهارة المعوية المرصوفة -->
    <g fill="#f3e8ff" stroke="#a855f7" stroke-width="1">
      <!-- يسار -->
      <rect x="70" y="280" width="10" height="40" rx="2"/><rect x="70" y="240" width="10" height="40" rx="2"/>
      <rect x="70" y="200" width="10" height="40" rx="2"/><rect x="70" y="160" width="10" height="40" rx="2"/>
      <rect x="70" y="120" width="10" height="40" rx="2"/><rect x="70" y="80" width="10" height="40" rx="2"/>
      <!-- القمة -->
      <path d="M 70,80 C 70,10 210,10 210,80 L 200,80 C 200,25 80,25 80,80 Z" fill="#e9d5ff"/>
      <!-- يمين -->
      <rect x="200" y="80" width="10" height="40" rx="2"/><rect x="200" y="120" width="10" height="40" rx="2"/>
      <rect x="200" y="160" width="10" height="40" rx="2"/><rect x="200" y="200" width="10" height="40" rx="2"/>
      <rect x="200" y="240" width="10" height="40" rx="2"/><rect x="200" y="280" width="10" height="40" rx="2"/>
    </g>

    <!-- الميكروزغابات (اهداب دقيقة على السطح) -->
    <path d="M 66,320 L 66,90 C 66,5 214,5 214,90 L 214,320" fill="none" stroke="#9333ea" stroke-width="2" stroke-dasharray="2,2"/>

    <!-- الوعاء البلغمي (اللمفاوي) المركزي -->
    <path d="M 133,330 L 133,90 C 133,75 147,75 147,90 L 147,330 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
    <text x="140" y="180" font-size="10" font-weight="bold" fill="#854d0e" text-anchor="middle" transform="rotate(-90 140 180)">وعاء لمفاوي مركزي (بلغمي)</text>

    <!-- شبكة الشعيرات الدموية -->
    <!-- شريان (أحمر) -->
    <path d="M 110,330 L 110,120 Q 110,70 140,70 Q 170,70 170,120 L 170,330" fill="none" stroke="#ef4444" stroke-width="3"/>
    <!-- وريد (أزرق) متفرع ومتشابك -->
    <path d="M 105,330 L 105,140 Q 140,90 175,140 L 175,330" fill="none" stroke="#3b82f6" stroke-width="3"/>

    <!-- شبكة تشابك شعيرات دموية دقيقة -->
    <line x1="105" y1="130" x2="133" y2="130" stroke="#ef4444" stroke-width="1.5"/>
    <line x1="147" y1="130" x2="175" y2="130" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="105" y1="180" x2="133" y2="180" stroke="#ef4444" stroke-width="1.5"/>
    <line x1="147" y1="180" x2="175" y2="180" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="105" y1="230" x2="133" y2="230" stroke="#ef4444" stroke-width="1.5"/>
    <line x1="147" y1="230" x2="175" y2="230" stroke="#3b82f6" stroke-width="1.5"/>
  </g>

  <!-- التسميات والأسهم -->
  <!-- جهة اليمين -->
  <g transform="translate(470, 110)">
    <rect x="0" y="0" width="190" height="45" rx="6" fill="#fdf4ff" stroke="#a855f7" stroke-width="1.5"/>
    <text x="95" y="20" font-size="12" font-weight="bold" fill="#7e22ce" text-anchor="middle">ظهارة معوية (خلايا ماصة)</text>
    <text x="95" y="36" font-size="10" fill="#64748b" text-anchor="middle">جدار رفيع جداً (0.05 ملم)</text>
    <line x1="0" y1="22" x2="-80" y2="22" stroke="#a855f7" stroke-width="1.2"/>

    <rect x="0" y="80" width="190" height="50" rx="6" fill="#fefce8" stroke="#eab308" stroke-width="1.5"/>
    <text x="95" y="100" font-size="12" font-weight="bold" fill="#a16207" text-anchor="middle">وعاء لمفاوي (بلغمي)</text>
    <text x="95" y="118" font-size="10" fill="#64748b" text-anchor="middle">يمتص الأحماض الدسمة والغليسيرول</text>
    <line x1="0" y1="105" x2="-140" y2="105" stroke="#eab308" stroke-width="1.2"/>

    <rect x="0" y="170" width="190" height="50" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="95" y="190" font-size="12" font-weight="bold" fill="#1d4ed8" text-anchor="middle">شبكة شعيرات دموية</text>
    <text x="95" y="208" font-size="10" fill="#64748b" text-anchor="middle">تمتص الغلوكوز والأحماض الأمينية</text>
    <line x1="0" y1="195" x2="-100" y2="170" stroke="#3b82f6" stroke-width="1.2"/>
  </g>

  <!-- جهة اليسار -->
  <g transform="translate(30, 160)">
    <rect x="0" y="0" width="190" height="45" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
    <text x="95" y="20" font-size="12" font-weight="bold" fill="#334155" text-anchor="middle">لمعة المعي الدقيق</text>
    <text x="95" y="36" font-size="10" fill="#059669" text-anchor="middle">حيث تتواجد المغذيات (الكيلوس)</text>
    <line x1="190" y1="22" x2="230" y2="22" stroke="#64748b" stroke-width="1.2"/>

    <rect x="0" y="80" width="190" height="45" rx="6" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5"/>
    <text x="95" y="100" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">شريان وارد (دم غني بـ O2)</text>
    <line x1="190" y1="102" x2="280" y2="200" stroke="#ef4444" stroke-width="1.2"/>

    <rect x="0" y="150" width="190" height="45" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <text x="95" y="170" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="middle">وريد صادر (دم محمل بالمغذيات)</text>
    <line x1="190" y1="172" x2="275" y2="230" stroke="#2563eb" stroke-width="1.2"/>
  </g>

  <!-- قاعدة الامتصاص -->
  <rect x="150" y="420" width="400" height="35" rx="6" fill="#f0fdf4" stroke="#22c55e" stroke-width="1.5"/>
  <text x="350" y="442" font-size="12" font-weight="bold" fill="#15803d" text-anchor="middle">مساحة الامتصاص الهائلة: ملايين الزغابات تشكل سطح تبادل يفوق 200 م²</text>
</svg>`,

  // 3. طريقي الامتصاص (الدموي واللمفاوي)
  absorptionPathways: `<svg viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[450px] select-none font-sans">
  <defs>
    <linearGradient id="heartGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#991b1b" />
    </linearGradient>
    <filter id="shadowPath" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.12" />
    </filter>
  </defs>

  <rect width="700" height="500" fill="#f8fafc" rx="16" />
  <rect x="15" y="15" width="670" height="470" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="12" />

  <text x="350" y="45" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle">مخطط طريقي امتصاص ونقل المغذيات نحو القلب</text>

  <!-- القلب في الأعلى -->
  <g transform="translate(300, 70)" filter="url(#shadowPath)">
    <path d="M 50,25 C 20,-10 -10,20 50,80 C 110,20 80,-10 50,25 Z" fill="url(#heartGrad4)" stroke="#7f1d1d" stroke-width="2"/>
    <text x="50" y="45" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">القلب</text>
  </g>

  <!-- المعي الدقيق في الأسفل -->
  <g transform="translate(230, 390)" filter="url(#shadowPath)">
    <rect x="0" y="0" width="240" height="60" rx="10" fill="#fdf2f8" stroke="#db2777" stroke-width="2"/>
    <text x="120" y="28" font-size="14" font-weight="bold" fill="#9d174d" text-anchor="middle">المعي الدقيق (الزغابات المعوية)</text>
    <text x="120" y="48" font-size="11" fill="#475569" text-anchor="middle">مقر انطلاق المغذيات الممتصة</text>
  </g>

  <!-- الطريق الدموي (الجهة اليسرى) -->
  <g>
    <!-- وريد بابي كبدي -->
    <path d="M 280,390 L 220,330 L 220,290" fill="none" stroke="#ef4444" stroke-width="4" marker-end="url(#arrowRed)"/>
    <text x="140" y="340" font-size="11" font-weight="bold" fill="#b91c1c">وريد بابي كبدي</text>

    <!-- الكبد -->
    <g transform="translate(170, 230)" filter="url(#shadowPath)">
      <path d="M 10,20 C 10,-5 90,-5 90,20 C 90,50 10,50 10,20 Z" fill="#b45309" stroke="#78350f" stroke-width="2"/>
      <text x="50" y="25" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">الكبد</text>
      <text x="50" y="40" font-size="9" fill="#fef3c7" text-anchor="middle">تعديل السكر (1 غ/ل)</text>
    </g>

    <!-- وريد فوق كبدي + وريد أجوف سفلي -->
    <path d="M 220,230 L 220,180 L 310,130" fill="none" stroke="#ef4444" stroke-width="4"/>
    <text x="135" y="195" font-size="11" font-weight="bold" fill="#b91c1c">وريد فوق كبدي</text>
    <text x="210" y="150" font-size="11" font-weight="bold" fill="#b91c1c">وريد أجوف سفلي</text>

    <!-- بطاقة الطريق الدموي -->
    <rect x="30" y="75" width="190" height="95" rx="8" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5"/>
    <text x="125" y="95" font-size="13" font-weight="bold" fill="#991b1b" text-anchor="middle">1. الطريق الدموي:</text>
    <text x="125" y="115" font-size="11" fill="#1e293b" text-anchor="middle">• غلوكوز (سكر عنب)</text>
    <text x="125" y="132" font-size="11" fill="#1e293b" text-anchor="middle">• أحماض أمينية</text>
    <text x="125" y="150" font-size="11" fill="#1e293b" text-anchor="middle">• ماء + أملاح + فيتامينات C,B</text>
  </g>

  <!-- الطريق اللمفاوي (البلغمي) (الجهة اليمنى) -->
  <g>
    <!-- أوعية لمفاوية + قناة لمفاوية صدرية -->
    <path d="M 420,390 L 480,310 L 480,180 L 370,110" fill="none" stroke="#eab308" stroke-width="4" stroke-dasharray="6,4"/>
    <text x="500" y="320" font-size="11" font-weight="bold" fill="#854d0e">أوعية لمفاوية معوية</text>
    <text x="500" y="240" font-size="11" font-weight="bold" fill="#854d0e">القناة اللمفاوية الصدرية</text>
    <text x="430" y="135" font-size="11" font-weight="bold" fill="#854d0e">وريد أجوف علوي</text>

    <!-- بطاقة الطريق اللمفاوي -->
    <rect x="480" y="75" width="190" height="95" rx="8" fill="#fefce8" stroke="#eab308" stroke-width="1.5"/>
    <text x="575" y="95" font-size="13" font-weight="bold" fill="#854d0e" text-anchor="middle">2. الطريق اللمفاوي (البلغمي):</text>
    <text x="575" y="115" font-size="11" fill="#1e293b" text-anchor="middle">• أحماض دسمة</text>
    <text x="575" y="132" font-size="11" fill="#1e293b" text-anchor="middle">• غليسيرول</text>
    <text x="575" y="150" font-size="11" fill="#1e293b" text-anchor="middle">• ماء + أملاح + فيتامينات A,D,E,K</text>
  </g>

  <!-- خلاصة التوزيع -->
  <rect x="180" y="460" width="340" height="25" rx="4" fill="#f1f5f9"/>
  <text x="350" y="477" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">يلتقي الطريقان في القلب ليضخ المغذيات لجميع خلايا الجسم</text>
</svg>`,

  // 4. مكونات الدم والوسط الداخلي
  bloodComposition: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <rect width="700" height="480" fill="#f8fafc" rx="16" />
  <rect x="15" y="15" width="670" height="450" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="12" />

  <text x="350" y="45" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle">رسم تخطيطي لسحبة دموية ومكونات الوسط الداخلي</text>

  <!-- سحبة دموية مجهرية -->
  <g transform="translate(60, 80)">
    <!-- دائرة الحقل المجهري -->
    <circle cx="160" cy="160" r="140" fill="#fff1f2" stroke="#f43f5e" stroke-width="3"/>

    <!-- المصورة (البلازما) كخلفية صفراء خفيفة -->
    <circle cx="160" cy="160" r="138" fill="#fef9c3" opacity="0.3"/>

    <!-- كريات دم حمراء (أقراص مقعرة الوجهين حمراء بدون نواة) -->
    <g fill="#ef4444" stroke="#b91c1c" stroke-width="1.5">
      <circle cx="100" cy="90" r="16"/><circle cx="100" cy="90" r="8" fill="#fca5a5"/>
      <circle cx="150" cy="70" r="16"/><circle cx="150" cy="70" r="8" fill="#fca5a5"/>
      <circle cx="210" cy="95" r="16"/><circle cx="210" cy="95" r="8" fill="#fca5a5"/>
      <circle cx="80" cy="150" r="16"/><circle cx="80" cy="150" r="8" fill="#fca5a5"/>
      <circle cx="130" cy="140" r="16"/><circle cx="130" cy="140" r="8" fill="#fca5a5"/>
      <circle cx="235" cy="160" r="16"/><circle cx="235" cy="160" r="8" fill="#fca5a5"/>
      <circle cx="95" cy="220" r="16"/><circle cx="95" cy="220" r="8" fill="#fca5a5"/>
      <circle cx="155" cy="230" r="16"/><circle cx="155" cy="230" r="8" fill="#fca5a5"/>
      <circle cx="215" cy="230" r="16"/><circle cx="215" cy="230" r="8" fill="#fca5a5"/>
      <circle cx="180" cy="185" r="16"/><circle cx="180" cy="185" r="8" fill="#fca5a5"/>
    </g>

    <!-- كريات دم بيضاء (أكبر حجماً، بنواة مفصصة أو وحيدة) -->
    <!-- كرية متعددة النواة (بلعمية) -->
    <circle cx="180" cy="115" r="26" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
    <path d="M 170,105 Q 180,100 190,110 Q 195,125 180,130 Q 165,120 170,105 Z" fill="#818cf8"/>

    <!-- كرية أحادية النواة (لمفاوية) -->
    <circle cx="120" cy="180" r="24" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
    <circle cx="120" cy="180" r="16" fill="#6366f1"/>

    <!-- صفائح دموية (أجزاء صغيرة جداً) -->
    <g fill="#94a3b8">
      <circle cx="130" cy="100" r="3"/><circle cx="135" cy="104" r="2.5"/><circle cx="128" cy="105" r="2"/>
      <circle cx="165" cy="160" r="3"/><circle cx="170" cy="158" r="2"/><circle cx="200" cy="140" r="3"/>
    </g>
  </g>

  <!-- شرح المكونات والوظائف -->
  <g transform="translate(390, 75)">
    <!-- الكريات الحمراء -->
    <rect x="0" y="0" width="270" height="75" rx="8" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5"/>
    <text x="20" y="24" font-size="13" font-weight="bold" fill="#991b1b">1. الكريات الحمراء (5 ملايين/ملم³):</text>
    <text x="20" y="44" font-size="11" fill="#334155">• تحوي الهيموغلوبين (Hb) لنقل الغازات</text>
    <text x="20" y="62" font-size="11" font-weight="bold" fill="#dc2626">• Hb + 4O2 ➔ HbO8 (أحمر فاتح في الرئة)</text>

    <!-- البلازما (المصورة) -->
    <rect x="0" y="85" width="270" height="75" rx="8" fill="#fefce8" stroke="#eab308" stroke-width="1.5"/>
    <text x="20" y="109" font-size="13" font-weight="bold" fill="#854d0e">2. البلازما / المصورة (55% من الدم):</text>
    <text x="20" y="129" font-size="11" fill="#334155">• سائل مصفر ينقل المغذيات إلى الخلايا</text>
    <text x="20" y="147" font-size="11" fill="#334155">• ينقل الفضلات (البولة وحمض البولة) للكليتين</text>

    <!-- الكريات البيضاء -->
    <rect x="0" y="170" width="270" height="75" rx="8" fill="#eef2ff" stroke="#6366f1" stroke-width="1.5"/>
    <text x="20" y="194" font-size="13" font-weight="bold" fill="#3730a3">3. الكريات البيضاء (7000/ملم³):</text>
    <text x="20" y="214" font-size="11" fill="#334155">• دفاع ومناعة العضوية ضد الميكروبات</text>
    <text x="20" y="232" font-size="11" fill="#334155">• بلعميات ولمفاويات (LB و LT)</text>

    <!-- الصفائح الدموية -->
    <rect x="0" y="255" width="270" height="55" rx="8" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5"/>
    <text x="20" y="278" font-size="13" font-weight="bold" fill="#334155">4. الصفائح الدموية (250 ألف/ملم³):</text>
    <text x="20" y="297" font-size="11" fill="#475569">• تخثر الدم وتوقيف النزيف عند الجروح</text>
  </g>

  <!-- معادلة الوسط الداخلي -->
  <g transform="translate(60, 410)">
    <rect x="0" y="0" width="580" height="40" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
    <text x="290" y="25" font-size="13" font-weight="bold" fill="#15803d" text-anchor="middle">الوسط الداخلي = الدم + السائل البيني (المترشح من الشعيرات) + اللمف</text>
  </g>
</svg>`,

  // 5. القوس الانعكاسية والعصبون
  reflexArc: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <defs>
    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fdba74" />
      <stop offset="100%" stop-color="#fb923c" />
    </linearGradient>
    <filter id="shadowReflex" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.12" />
    </filter>
  </defs>

  <rect width="700" height="480" fill="#f8fafc" rx="16" />
  <rect x="15" y="15" width="670" height="450" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="12" />

  <text x="350" y="45" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle">مخطط القوس الانعكاسية للفعل المنعكس اللاإرادي الفطري</text>

  <!-- النخاع الشوكي (مقطع عرضي) في الوسط اليمين -->
  <g transform="translate(420, 110)" filter="url(#shadowReflex)">
    <!-- مادة بيضاء محيطية -->
    <ellipse cx="120" cy="130" rx="110" ry="95" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/>
    <!-- مادة رمادية مركزية (شكل فراشة بقرنين أماميين وخلفيين) -->
    <path d="M 90,80 C 110,105 130,105 150,80 C 145,120 165,140 160,175 C 135,155 105,155 80,175 C 75,140 95,120 90,80 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
    <circle cx="120" cy="130" r="4" fill="#475569"/> <!-- القناة المركزية -->

    <text x="120" y="135" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">م. رمادية</text>
    <text x="120" y="210" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">النخاع الشوكي (مركز عصبي انعكاسي)</text>

    <!-- عصبون جامع (بيني) -->
    <circle cx="125" cy="115" r="4" fill="#a855f7"/>
    <path d="M 135,95 L 125,115 L 110,145" fill="none" stroke="#a855f7" stroke-width="2"/>
  </g>

  <!-- الجلد (مستقبل حسي) في اليسار الأعلى -->
  <g transform="translate(50, 90)" filter="url(#shadowReflex)">
    <rect x="0" y="0" width="130" height="60" rx="8" fill="url(#skinGrad)" stroke="#ea580c" stroke-width="2"/>
    <text x="65" y="25" font-size="13" font-weight="bold" fill="#7c2d12" text-anchor="middle">الجلد (مستقبل حسي)</text>
    <text x="65" y="45" font-size="10" fill="#ffffff" text-anchor="middle">تنبيه فعال (وخز شوكة 🌵)</text>

    <!-- رمز التنبيه -->
    <circle cx="-15" cy="30" r="12" fill="#ef4444"/>
    <text x="-15" y="34" font-size="14" fill="#ffffff" text-anchor="middle">⚡</text>
  </g>

  <!-- العضلة (عضو منفذ) في اليسار الأسفل -->
  <g transform="translate(50, 270)" filter="url(#shadowReflex)">
    <path d="M 10,25 C 40,-5 90,-5 120,25 C 90,55 40,55 10,25 Z" fill="#f87171" stroke="#dc2626" stroke-width="2"/>
    <text x="65" y="28" font-size="13" font-weight="bold" fill="#7f1d1d" text-anchor="middle">العضلة (عضو منفذ)</text>
    <text x="65" y="44" font-size="10" fill="#ffffff" text-anchor="middle">تستجيب بالتقلص (سحب اليد)</text>
  </g>

  <!-- مسار السيالة الحسية (جذر خلفي بعقدة شوكية - أزرق) -->
  <g>
    <!-- ليف حسي من الجلد للنخاع عبر العقدة الشوكية -->
    <path d="M 180,120 Q 300,100 480,180" fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="6,3"/>
    <!-- العقدة الشوكية للجذر الخلفي -->
    <ellipse cx="380" cy="135" rx="14" ry="10" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
    <text x="380" y="139" font-size="9" fill="#ffffff" text-anchor="middle">جسم خلو</text>

    <text x="250" y="95" font-size="12" font-weight="bold" fill="#1d4ed8">1. ليف عصبي حسي (سيالة جابذة)</text>
    <!-- سهم اتجاه السيالة -->
    <polygon points="290,105 305,108 295,115" fill="#2563eb"/>
  </g>

  <!-- مسار السيالة الحركية (جذر أمامي - أحمر) -->
  <g>
    <!-- ليف حركي من النخاع للعضلة -->
    <path d="M 460,250 Q 300,310 170,295" fill="none" stroke="#dc2626" stroke-width="3"/>
    <text x="270" y="340" font-size="12" font-weight="bold" fill="#b91c1c">2. ليف عصبي حركي (سيالة نابذة)</text>
    <!-- سهم اتجاه السيالة -->
    <polygon points="250,305 235,302 245,295" fill="#dc2626"/>
  </g>

  <!-- العناصر الخمسة للقوس الانعكاسية -->
  <g transform="translate(40, 390)">
    <rect x="0" y="0" width="620" height="60" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="310" y="22" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">العناصر الخمسة الفاعلة في الفعل المنعكس الفطري:</text>
    <text x="310" y="44" font-size="11" fill="#334155" text-anchor="middle">1. مستقبل حسي (الجلد) ➔ 2. ناقل حسي (ليف حسي) ➔ 3. مركز عصبي (النخاع الشوكي) ➔ 4. ناقل حركي (ليف حركي) ➔ 5. عضو منفذ (العضلة)</text>
  </g>
</svg>`,

  // 6. سطوح القشرة المخية
  brainAreas: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <defs>
    <filter id="brainShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="3" dy="3" stdDeviation="4" flood-opacity="0.15" />
    </filter>
  </defs>

  <rect width="700" height="480" fill="#f8fafc" rx="16" />
  <rect x="15" y="15" width="670" height="450" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="12" />

  <text x="350" y="45" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle">رسم تخطيطي لسطوح (ساحات) القشرة المخية المتخصصة</text>

  <!-- رسم فص المخ -->
  <g transform="translate(60, 80)" filter="url(#brainShadow)">
    <!-- حدود الدماغ الأساسية -->
    <!-- الفص الجبهي والحركي (أحمر) -->
    <path d="M 80,180 C 60,110 130,50 200,50 C 230,50 250,70 260,100 L 220,180 L 140,210 Z" fill="#fca5a5" stroke="#ef4444" stroke-width="2"/>
    <text x="160" y="120" font-size="12" font-weight="bold" fill="#991b1b" text-anchor="middle">ساحة الحركة</text>

    <!-- ساحة الإحساس العام (أصفر) خلف شق رولاندو -->
    <path d="M 260,100 C 280,100 310,110 320,140 L 270,210 L 220,180 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
    <text x="270" y="155" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">الإحساس العام</text>

    <!-- ساحة الرؤية (فص قفوي - أزرق) -->
    <path d="M 320,140 C 370,170 370,230 330,260 L 270,210 Z" fill="#93c5fd" stroke="#2563eb" stroke-width="2"/>
    <text x="325" y="210" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="middle">ساحة الرؤية</text>

    <!-- ساحة السمع (فص صدغي - أخضر) -->
    <path d="M 140,210 L 270,210 L 270,260 C 210,280 150,260 140,210 Z" fill="#86efac" stroke="#16a34a" stroke-width="2"/>
    <text x="205" y="245" font-size="12" font-weight="bold" fill="#14532d" text-anchor="middle">ساحة السمع</text>

    <!-- شق رولاندو (فاصل رئيسي) -->
    <path d="M 260,95 L 220,185" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
    <text x="240" y="80" font-size="10" font-weight="bold" fill="#0f172a">شق رولاندو</text>

    <!-- المخيخ والبصلة السيسائية -->
    <ellipse cx="280" cy="300" rx="40" ry="25" fill="#fed7aa" stroke="#ea580c" stroke-width="1.5"/>
    <text x="280" y="305" font-size="11" font-weight="bold" fill="#9a3412" text-anchor="middle">المخيخ</text>

    <path d="M 200,280 L 200,340 L 220,340 L 220,280 Z" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
    <text x="210" y="360" font-size="10" font-weight="bold" fill="#475569" text-anchor="middle">البصلة السيسائية</text>
  </g>

  <!-- جدول أدوار الساحات المخية -->
  <g transform="translate(440, 80)">
    <rect x="0" y="0" width="220" height="340" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="110" y="26" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">أدوار الساحات المخية</text>

    <!-- 1 -->
    <g transform="translate(10, 45)">
      <rect x="0" y="0" width="200" height="50" rx="6" fill="#fef2f2" stroke="#fca5a5"/>
      <text x="10" y="20" font-size="12" font-weight="bold" fill="#991b1b">1. ساحة الحركة:</text>
      <text x="10" y="38" font-size="10" fill="#475569">تتحكم في انطلاق الأفعال الإرادية</text>
    </g>

    <!-- 2 -->
    <g transform="translate(10, 105)">
      <rect x="0" y="0" width="200" height="50" rx="6" fill="#fefce8" stroke="#fde047"/>
      <text x="10" y="20" font-size="12" font-weight="bold" fill="#854d0e">2. ساحة الإحساس العام:</text>
      <text x="10" y="38" font-size="10" fill="#475569">استقبال وترجمة إحساسات اللمس والألم</text>
    </g>

    <!-- 3 -->
    <g transform="translate(10, 165)">
      <rect x="0" y="0" width="200" height="50" rx="6" fill="#eff6ff" stroke="#93c5fd"/>
      <text x="10" y="20" font-size="12" font-weight="bold" fill="#1e40af">3. ساحة الرؤية:</text>
      <text x="10" y="38" font-size="10" fill="#475569">معالجة الرسائل الآتية من العينين</text>
    </g>

    <!-- 4 -->
    <g transform="translate(10, 225)">
      <rect x="0" y="0" width="200" height="50" rx="6" fill="#f0fdf4" stroke="#86efac"/>
      <text x="10" y="20" font-size="12" font-weight="bold" fill="#14532d">4. ساحة السمع والشم والذوق:</text>
      <text x="10" y="38" font-size="10" fill="#475569">معالجة الإشارات الحسية النوعية</text>
    </g>

    <text x="110" y="310" font-size="11" font-weight="bold" fill="#6366f1" text-anchor="middle">التكامل الوظيفي للقشرة المخية</text>
  </g>

  <!-- شريط سفلي -->
  <rect x="50" y="435" width="600" height="30" rx="6" fill="#f1f5f9"/>
  <text x="350" y="455" font-size="12" font-weight="bold" fill="#334155" text-anchor="middle">كل منطقة في القشرة المخية متخصصة في معالجة نوع محدد من الإحساس أو توجيه الحركة</text>
</svg>`,

  // 7. مراحل البلعمة الأربعة
  phagocytosis: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <rect width="700" height="480" fill="#f8fafc" rx="16" />
  <rect x="15" y="15" width="670" height="450" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="12" />

  <text x="350" y="45" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle">المراحل الأربع لعملية البلعمة (الخط الدفاعي الثاني)</text>

  <!-- المرحلة 1: الانجذاب والالتصاق -->
  <g transform="translate(35, 75)">
    <rect x="0" y="0" width="145" height="320" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="72" y="30" font-size="13" font-weight="bold" fill="#0284c7" text-anchor="middle">1. الانجذاب والالتصاق</text>

    <!-- رسم بلعمية تقترب من بكتيريا -->
    <path d="M 40,80 C 20,110 30,170 70,180 C 120,190 130,120 110,90 C 90,70 60,60 40,80 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
    <ellipse cx="75" cy="130" rx="18" ry="14" fill="#38bdf8"/> <!-- النواة -->

    <!-- بكتيريا -->
    <ellipse cx="40" cy="70" rx="8" ry="5" fill="#ef4444" stroke="#991b1b" stroke-width="1"/>
    <ellipse cx="30" cy="85" rx="8" ry="5" fill="#ef4444" stroke="#991b1b" stroke-width="1"/>

    <text x="72" y="240" font-size="11" fill="#334155" text-anchor="middle">تنجذب الخلية البلعمية</text>
    <text x="72" y="260" font-size="11" fill="#334155" text-anchor="middle">نحو البكتيريا وتلتصق</text>
    <text x="72" y="280" font-size="11" fill="#334155" text-anchor="middle">بغشائها الخارجي</text>
  </g>

  <!-- المرحلة 2: الإحاطة والابتلاع -->
  <g transform="translate(195, 75)">
    <rect x="0" y="0" width="145" height="320" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="72" y="30" font-size="13" font-weight="bold" fill="#0284c7" text-anchor="middle">2. الإحاطة والابتلاع</text>

    <!-- بلعمية ترسل أرجل كاذبة -->
    <path d="M 30,80 C 10,120 30,180 75,185 C 120,190 135,130 115,90 C 100,70 85,90 75,100 C 65,90 50,70 30,80 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
    <!-- أرجل كاذبة تحيط بالبكتيريا -->
    <ellipse cx="75" cy="85" rx="8" ry="5" fill="#ef4444"/>
    <ellipse cx="75" cy="145" rx="18" ry="14" fill="#38bdf8"/>

    <text x="72" y="240" font-size="11" fill="#334155" text-anchor="middle">ترسل البلعمية أرجلاً</text>
    <text x="72" y="260" font-size="11" font-weight="bold" fill="#0284c7" text-anchor="middle">كاذبة (Pseudopodes)</text>
    <text x="72" y="280" font-size="11" fill="#334155" text-anchor="middle">وتحبسها في فجوة بالعة</text>
  </g>

  <!-- المرحلة 3: الهضم -->
  <g transform="translate(355, 75)">
    <rect x="0" y="0" width="145" height="320" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="72" y="30" font-size="13" font-weight="bold" fill="#0284c7" text-anchor="middle">3. الهضم الكيميائي</text>

    <!-- فجوة هاضمة داخلية مع إنزيمات ليزوزوم -->
    <path d="M 40,80 C 20,110 30,180 75,185 C 120,190 135,130 115,90 C 95,65 60,65 40,80 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
    <ellipse cx="75" cy="145" rx="18" ry="14" fill="#38bdf8"/>
    <!-- فجوة هاضمة وبكتيريا متفتتة -->
    <circle cx="75" cy="100" r="14" fill="#fef08a" stroke="#ca8a04" stroke-dasharray="2,2"/>
    <circle cx="72" cy="98" r="3" fill="#ef4444"/><circle cx="78" cy="102" r="2" fill="#ef4444"/>

    <text x="72" y="240" font-size="11" fill="#334155" text-anchor="middle">تصب الليزوزومات</text>
    <text x="72" y="260" font-size="11" font-weight="bold" fill="#eab308" text-anchor="middle">إنزيمات هاضمة</text>
    <text x="72" y="280" font-size="11" fill="#334155" text-anchor="middle">لتفكيك الميكروب وتدميره</text>
  </g>

  <!-- المرحلة 4: الإطراح -->
  <g transform="translate(515, 75)">
    <rect x="0" y="0" width="145" height="320" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="72" y="30" font-size="13" font-weight="bold" fill="#0284c7" text-anchor="middle">4. إطراح الفضلات</text>

    <!-- طرح البقايا خارج الخلية -->
    <path d="M 40,80 C 20,110 30,180 75,185 C 120,190 135,130 115,90 C 95,65 60,65 40,80 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
    <ellipse cx="75" cy="145" rx="18" ry="14" fill="#38bdf8"/>
    <!-- حطام يطرح للخارج -->
    <circle cx="95" cy="80" r="2" fill="#64748b"/><circle cx="102" cy="75" r="2" fill="#64748b"/><circle cx="108" cy="85" r="1.5" fill="#64748b"/>

    <text x="72" y="240" font-size="11" fill="#334155" text-anchor="middle">طرح بقايا وفضلات</text>
    <text x="72" y="260" font-size="11" fill="#334155" text-anchor="middle">الميكروب خارج الخلية</text>
    <text x="72" y="280" font-size="11" font-weight="bold" fill="#16a34a" text-anchor="middle">نهاية التفاعل الالتهابي</text>
  </g>

  <!-- تعليق سفلي -->
  <rect x="50" y="420" width="600" height="35" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="350" y="442" font-size="12" font-weight="bold" fill="#1d4ed8" text-anchor="middle">البلعمة استجابة مناعية لانوعية سريعة وفطرية غير مرتبطة بنوع محدد من الميكروبات</text>
</svg>`,

  // 8. قواعد نقل الدم (نظام ABO و Rh)
  bloodTransfusion: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <defs>
    <filter id="bloodShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.12" />
    </filter>
  </defs>

  <rect width="700" height="480" fill="#f8fafc" rx="16" />
  <rect x="15" y="15" width="670" height="450" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="12" />

  <text x="350" y="45" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle">مخطط التوافق وقواعد نقل الدم في نظامي ABO و Rh (الريزوس)</text>

  <!-- مخطط نظام ABO (في الوسط اليسار) -->
  <g transform="translate(40, 75)">
    <rect x="0" y="0" width="370" height="320" rx="12" fill="#fff1f2" stroke="#f43f5e" stroke-width="1.5"/>
    <text x="185" y="30" font-size="16" font-weight="bold" fill="#be123c" text-anchor="middle">1. نظام الزمر الدموية ABO</text>

    <!-- الزمرة O (معطي عام في الأعلى) -->
    <g transform="translate(145, 50)" filter="url(#bloodShadow)">
      <circle cx="40" cy="30" r="28" fill="#ef4444" stroke="#991b1b" stroke-width="2"/>
      <text x="40" y="37" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">O</text>
      <text x="40" y="70" font-size="11" font-weight="bold" fill="#b91c1c" text-anchor="middle">معطي عام</text>
    </g>

    <!-- الزمرة A (يسار) -->
    <g transform="translate(40, 140)" filter="url(#bloodShadow)">
      <circle cx="35" cy="30" r="26" fill="#f87171" stroke="#b91c1c" stroke-width="2"/>
      <text x="35" y="37" font-size="17" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
    </g>

    <!-- الزمرة B (يمين) -->
    <g transform="translate(250, 140)" filter="url(#bloodShadow)">
      <circle cx="35" cy="30" r="26" fill="#f87171" stroke="#b91c1c" stroke-width="2"/>
      <text x="35" y="37" font-size="17" font-weight="bold" fill="#ffffff" text-anchor="middle">B</text>
    </g>

    <!-- الزمرة AB (مستقبل عام في الأسفل) -->
    <g transform="translate(145, 220)" filter="url(#bloodShadow)">
      <circle cx="40" cy="30" r="28" fill="#dc2626" stroke="#7f1d1d" stroke-width="2"/>
      <text x="40" y="37" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">AB</text>
      <text x="40" y="70" font-size="11" font-weight="bold" fill="#b91c1c" text-anchor="middle">مستقبل عام</text>
    </g>

    <!-- أسهم النقل المسموحة في ABO -->
    <!-- من O للجميع -->
    <line x1="155" y1="95" x2="95" y2="145" stroke="#16a34a" stroke-width="3" marker-end="url(#arrowGreen)"/>
    <line x1="215" y1="95" x2="265" y2="145" stroke="#16a34a" stroke-width="3"/>
    <line x1="185" y1="110" x2="185" y2="220" stroke="#16a34a" stroke-width="3"/>

    <!-- من A إلى AB -->
    <line x1="95" y1="185" x2="155" y2="235" stroke="#16a34a" stroke-width="3"/>
    <!-- من B إلى AB -->
    <line x1="265" y1="185" x2="215" y2="235" stroke="#16a34a" stroke-width="3"/>

    <!-- دوران ذاتي لنفس الزمرة -->
    <path d="M 180,50 C 180,30 200,30 200,50" fill="none" stroke="#16a34a" stroke-width="2"/>
    <path d="M 50,140 C 35,125 35,145 50,150" fill="none" stroke="#16a34a" stroke-width="2"/>
    <path d="M 300,140 C 315,125 315,145 300,150" fill="none" stroke="#16a34a" stroke-width="2"/>
    <path d="M 180,278 C 180,295 200,295 200,278" fill="none" stroke="#16a34a" stroke-width="2"/>
  </g>

  <!-- مخطط نظام الريزوس Rh (الجهة اليمنى) -->
  <g transform="translate(430, 75)">
    <rect x="0" y="0" width="230" height="320" rx="12" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="115" y="30" font-size="16" font-weight="bold" fill="#1d4ed8" text-anchor="middle">2. نظام الريزوس (Rh)</text>

    <!-- Rh- -->
    <g transform="translate(25, 70)">
      <circle cx="35" cy="35" r="28" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
      <text x="35" y="42" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">Rh -</text>
      <text x="35" y="80" font-size="11" fill="#475569" text-anchor="middle">سالب الريزوس</text>
    </g>

    <!-- Rh+ -->
    <g transform="translate(135, 70)">
      <circle cx="35" cy="35" r="28" fill="#2563eb" stroke="#1e40af" stroke-width="2"/>
      <text x="35" y="42" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">Rh +</text>
      <text x="35" y="80" font-size="11" fill="#475569" text-anchor="middle">موجب الريزوس</text>
    </g>

    <!-- سهم النقل المسموح: من السالب للموجب -->
    <line x1="90" y1="105" x2="135" y2="105" stroke="#16a34a" stroke-width="4"/>
    <polygon points="135,100 145,105 135,110" fill="#16a34a"/>
    <text x="115" y="145" font-size="11" font-weight="bold" fill="#16a34a" text-anchor="middle">✓ مسموح (Rh- ➔ Rh+)</text>

    <!-- سهم النقل الممنوع: من الموجب للسالب -->
    <line x1="135" y1="180" x2="90" y2="180" stroke="#dc2626" stroke-width="4" stroke-dasharray="4,3"/>
    <line x1="105" y1="170" x2="120" y2="190" stroke="#dc2626" stroke-width="4"/>
    <line x1="120" y1="170" x2="105" y2="190" stroke="#dc2626" stroke-width="4"/>
    <text x="115" y="210" font-size="11" font-weight="bold" fill="#dc2626" text-anchor="middle">✗ ممنوع خطر ارتصاص</text>

    <!-- قاعدة التوافق -->
    <rect x="15" y="235" width="200" height="65" rx="6" fill="#ffffff" stroke="#93c5fd"/>
    <text x="115" y="255" font-size="11" font-weight="bold" fill="#1e3a8a" text-anchor="middle">قاعدة الارتصاص الأساسية:</text>
    <text x="115" y="272" font-size="10" fill="#334155" text-anchor="middle">تجنب التقاء مولد ضد المعطي</text>
    <text x="115" y="288" font-size="10" fill="#334155" text-anchor="middle">مع الأجسام المضادة للمستقبل</text>
  </g>

  <!-- شريط سفلي -->
  <rect x="40" y="415" width="620" height="40" rx="8" fill="#f0fdf4" stroke="#22c55e" stroke-width="1.5"/>
  <text x="350" y="440" font-size="12" font-weight="bold" fill="#15803d" text-anchor="middle">الزمرة O- معطي عام لجميع الزمر الدموية، والزمرة AB+ مستقبل عام لجميع الزمر الدموية</text>
</svg>`,

  // 9. الطابع النووي وتشكل الأمشاج
  meiosisKaryotype: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <rect width="700" height="480" fill="#f8fafc" rx="16" />
  <rect x="15" y="15" width="670" height="450" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="12" />

  <text x="350" y="45" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle">سلوك الصبغيات أثناء الانقسام المنصف والإلقاح وتحديد الجنس</text>

  <!-- الأب (2ن = 46 صبغي 44+XY) -->
  <g transform="translate(50, 75)">
    <rect x="0" y="0" width="270" height="110" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text x="135" y="28" font-size="14" font-weight="bold" fill="#1d4ed8" text-anchor="middle">خلية أصلية عند الأب (2ن = 46 صبغي)</text>
    <text x="135" y="52" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">44 صبغي جسمي + الزوج الجنسي (XY)</text>

    <!-- أمشاج الأب (نطف نوع X ونطف نوع Y) -->
    <g transform="translate(15, 65)">
      <rect x="0" y="0" width="115" height="35" rx="6" fill="#dbeafe" stroke="#2563eb"/>
      <text x="57" y="22" font-size="11" font-weight="bold" fill="#1e40af" text-anchor="middle">50% نطفة (22+X)</text>

      <rect x="125" y="0" width="115" height="35" rx="6" fill="#dbeafe" stroke="#2563eb"/>
      <text x="182" y="22" font-size="11" font-weight="bold" fill="#1e40af" text-anchor="middle">50% نطفة (22+Y)</text>
    </g>
  </g>

  <!-- الأم (2ن = 46 صبغي 44+XX) -->
  <g transform="translate(380, 75)">
    <rect x="0" y="0" width="270" height="110" rx="10" fill="#fdf2f8" stroke="#ec4899" stroke-width="2"/>
    <text x="135" y="28" font-size="14" font-weight="bold" fill="#be185d" text-anchor="middle">خلية أصلية عند الأم (2ن = 46 صبغي)</text>
    <text x="135" y="52" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">44 صبغي جسمي + الزوج الجنسي (XX)</text>

    <!-- أمشاج الأم (نوع واحد من البويضات) -->
    <g transform="translate(45, 65)">
      <rect x="0" y="0" width="180" height="35" rx="6" fill="#fce7f3" stroke="#db2777"/>
      <text x="90" y="22" font-size="12" font-weight="bold" fill="#9d174d" text-anchor="middle">100% بويضات (22+X)</text>
    </g>
  </g>

  <!-- سهم الانقسام المنصف -->
  <text x="350" y="210" font-size="13" font-weight="bold" fill="#7c3aed" text-anchor="middle">⬇️ حدوث الإلقاح (التقاء الأمشاج) ⬇️</text>

  <!-- شبكة الإلقاح وتحديد الجنس -->
  <g transform="translate(70, 230)">
    <!-- احتمالات الإلقاح -->
    <!-- الاحتمال 1: نطفة X + بويضة X = أنثى XX -->
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="260" height="95" rx="8" fill="#fdf2f8" stroke="#db2777" stroke-width="1.5"/>
      <text x="130" y="26" font-size="13" font-weight="bold" fill="#be185d" text-anchor="middle">بويضة (22+X) + نطفة (22+X)</text>
      <text x="130" y="52" font-size="15" font-weight="bold" fill="#9d174d" text-anchor="middle">بويضة ملقحة (44 + XX) ➔ أنثى 👧</text>
      <text x="130" y="78" font-size="11" fill="#475569" text-anchor="middle">احتمال 50% ولادة أنثى</text>
    </g>

    <!-- الاحتمال 2: نطفة Y + بويضة X = ذكر XY -->
    <g transform="translate(300, 0)">
      <rect x="0" y="0" width="260" height="95" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
      <text x="130" y="26" font-size="13" font-weight="bold" fill="#1d4ed8" text-anchor="middle">بويضة (22+X) + نطفة (22+Y)</text>
      <text x="130" y="52" font-size="15" font-weight="bold" fill="#1e40af" text-anchor="middle">بويضة ملقحة (44 + XY) ➔ ذكر 👦</text>
      <text x="130" y="78" font-size="11" fill="#475569" text-anchor="middle">احتمال 50% ولادة ذكر</text>
    </g>
  </g>

  <!-- قاعدة تحديد الجنس الوراثية -->
  <g transform="translate(50, 360)">
    <rect x="0" y="0" width="600" height="90" rx="10" fill="#f8fafc" stroke="#6366f1" stroke-width="1.5"/>
    <text x="300" y="28" font-size="13" font-weight="bold" fill="#4338ca" text-anchor="middle">الاستنتاج العلمي الحاسم:</text>
    <text x="300" y="52" font-size="12" fill="#1e293b" text-anchor="middle">• النطفة الآتية من الأب هي المسؤولة الوحيدة وراثياً عن تحديد جنس المولود (ذكر أو أنثى).</text>
    <text x="300" y="74" font-size="11" fill="#475569" text-anchor="middle">• الانقسام المنصف يختزل الصيغة الصبغية من 2ن=46 إلى ن=23 صبغي، والإلقاح يعيد ثنائية الصيغة الصبغية (2ن=46).</text>
  </g>
</svg>`
,
  // 10. الاستجابة المناعية النوعية (الخلطية والخلوية)
  specificImmuneResponse: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <rect width="700" height="480" fill="#f8fafc" rx="14" />
  <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />
  <text x="350" y="40" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">الاستجابة المناعية النوعية (الخلطية والخلوية)</text>
  
  <!-- مولد الضد -->
  <g transform="translate(350, 80)">
    <circle cx="0" cy="0" r="25" fill="#ef4444" />
    <path d="M -15,-15 L -25,-25 M 15,-15 L 25,-25 M -15,15 L -25,25 M 15,15 L 25,25" stroke="#b91c1c" stroke-width="3" stroke-linecap="round"/>
    <text x="0" y="45" font-size="14" font-weight="bold" fill="#dc2626" text-anchor="middle">مولد الضد</text>
  </g>

  <!-- مسار خلطي LB -->
  <path d="M 330,110 L 200,160" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <g transform="translate(180, 180)">
    <circle cx="0" cy="0" r="30" fill="#bfdbfe" stroke="#3b82f6" stroke-width="2"/>
    <circle cx="0" cy="0" r="12" fill="#1e3a8a"/>
    <text x="0" y="50" font-size="14" font-weight="bold" fill="#2563eb" text-anchor="middle">اللمفاوية البائية (LB)</text>
  </g>

  <path d="M 180,240 L 180,280" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  
  <g transform="translate(130, 310)">
    <circle cx="0" cy="0" r="25" fill="#bfdbfe" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4"/>
    <text x="0" y="40" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="middle">LB ذاكرة (LBm)</text>
  </g>
  <g transform="translate(230, 310)">
    <circle cx="0" cy="0" r="25" fill="#bfdbfe" stroke="#3b82f6" stroke-width="2"/>
    <path d="M 25,-5 L 35,-15 L 30,-25 M 35,-15 L 45,-15" stroke="#2563eb" stroke-width="2" fill="none"/>
    <text x="0" y="40" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="middle">LB منتجة للأجسام</text>
    <path d="M 20,60 L 20,80 L 120,80" stroke="#94a3b8" stroke-width="2" fill="none" marker-end="url(#arrow)"/>
  </g>

  <!-- مسار خلوي LT -->
  <path d="M 370,110 L 500,160" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <g transform="translate(520, 180)">
    <circle cx="0" cy="0" r="30" fill="#bbf7d0" stroke="#22c55e" stroke-width="2"/>
    <circle cx="0" cy="0" r="12" fill="#14532d"/>
    <text x="0" y="50" font-size="14" font-weight="bold" fill="#16a34a" text-anchor="middle">اللمفاوية التائية (LT)</text>
  </g>

  <path d="M 520,240 L 520,280" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>

  <g transform="translate(570, 310)">
    <circle cx="0" cy="0" r="25" fill="#bbf7d0" stroke="#22c55e" stroke-width="2" stroke-dasharray="4"/>
    <text x="0" y="40" font-size="12" font-weight="bold" fill="#166534" text-anchor="middle">LT ذاكرة (LTm)</text>
  </g>
  <g transform="translate(470, 310)">
    <circle cx="0" cy="0" r="25" fill="#bbf7d0" stroke="#22c55e" stroke-width="2"/>
    <circle cx="5" cy="-5" r="3" fill="#166534"/>
    <circle cx="-5" cy="5" r="3" fill="#166534"/>
    <text x="0" y="40" font-size="12" font-weight="bold" fill="#166534" text-anchor="middle">LT قاتلة (LTc)</text>
    <path d="M -20,60 L -20,80 L -120,80" stroke="#94a3b8" stroke-width="2" fill="none" marker-end="url(#arrow)"/>
  </g>

  <!-- معقد مناعي وخلية مصابة -->
  <g transform="translate(350, 400)">
    <circle cx="-20" cy="0" r="15" fill="#ef4444" />
    <path d="M -30,-5 L -40,-15 L -45,-5 M -40,-15 L -40,-25" stroke="#2563eb" stroke-width="2" fill="none"/>
    <text x="-20" y="30" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="middle">معقد مناعي</text>
    
    <circle cx="40" cy="0" r="25" fill="#fca5a5" stroke="#ef4444" stroke-width="2" stroke-dasharray="2"/>
    <text x="40" y="40" font-size="12" font-weight="bold" fill="#991b1b" text-anchor="middle">تخريب خلية مصابة</text>
  </g>

  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
    </marker>
  </defs>
</svg>`,

  // 11. آلية الاستجابة المفرطة (الحساسية)
  allergyMechanism: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <rect width="700" height="480" fill="#f8fafc" rx="14" />
  <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />
  <text x="350" y="40" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">آلية الاستجابة المفرطة (الحساسية)</text>
  
  <line x1="350" y1="60" x2="350" y2="450" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6"/>
  <text x="175" y="80" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">التماس الأول (التحسس)</text>
  <text x="525" y="80" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">التماس الثاني (ظهور الأعراض)</text>

  <!-- التماس الأول -->
  <g transform="translate(175, 120)">
    <circle cx="0" cy="0" r="15" fill="#fcd34d" stroke="#d97706" stroke-width="2"/>
    <text x="0" y="35" font-size="12" font-weight="bold" fill="#b45309" text-anchor="middle">مُحسس (مسبّب)</text>
    <path d="M 0,45 L 0,80" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  </g>
  <g transform="translate(175, 230)">
    <circle cx="0" cy="0" r="30" fill="#bfdbfe" stroke="#3b82f6" stroke-width="2"/>
    <text x="0" y="50" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="middle">خلية بائية LB</text>
    <path d="M 40,0 L 70,0" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
    <path d="M 85,0 L 95,-10 L 90,-20 M 95,-10 L 105,-10" stroke="#2563eb" stroke-width="2" fill="none"/>
    <text x="95" y="15" font-size="11" font-weight="bold" fill="#2563eb" text-anchor="middle">IgE</text>
  </g>
  <g transform="translate(175, 360)">
    <circle cx="0" cy="0" r="35" fill="#fecaca" stroke="#ef4444" stroke-width="2"/>
    <circle cx="0" cy="0" r="10" fill="#b91c1c"/>
    <circle cx="-15" cy="-10" r="3" fill="#f87171"/>
    <circle cx="15" cy="15" r="3" fill="#f87171"/>
    <circle cx="15" cy="-10" r="3" fill="#f87171"/>
    <circle cx="-15" cy="15" r="3" fill="#f87171"/>
    <text x="0" y="55" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">خلية صارية (Mastocyte)</text>
    <path d="M -20,-35 L -10,-25 L -5,-35 M -10,-25 L -10,-15" stroke="#2563eb" stroke-width="2" fill="none"/>
    <path d="M 20,-35 L 10,-25 L 5,-35 M 10,-25 L 10,-15" stroke="#2563eb" stroke-width="2" fill="none"/>
    <text x="0" y="-45" font-size="11" fill="#475569" text-anchor="middle">تثبت IgE</text>
  </g>
  <path d="M 175,290 L 175,310" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- التماس الثاني -->
  <g transform="translate(525, 120)">
    <circle cx="0" cy="0" r="15" fill="#fcd34d" stroke="#d97706" stroke-width="2"/>
    <path d="M 0,25 L 0,60" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  </g>
  <g transform="translate(525, 230)">
    <circle cx="0" cy="0" r="35" fill="#fecaca" stroke="#ef4444" stroke-width="2"/>
    <circle cx="0" cy="0" r="10" fill="#b91c1c"/>
    <path d="M -20,-35 L -10,-25 L -5,-35 M -10,-25 L -10,-15" stroke="#2563eb" stroke-width="2" fill="none"/>
    <path d="M 20,-35 L 10,-25 L 5,-35 M 10,-25 L 10,-15" stroke="#2563eb" stroke-width="2" fill="none"/>
    <circle cx="-20" cy="-35" r="8" fill="#fcd34d" stroke="#d97706" stroke-width="1"/>
    <circle cx="20" cy="-35" r="8" fill="#fcd34d" stroke="#d97706" stroke-width="1"/>
    <text x="0" y="55" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">ارتباط المُحسس بـ IgE</text>
    <path d="M 0,70 L 0,100" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  </g>
  <g transform="translate(525, 380)">
    <circle cx="-20" cy="-10" r="4" fill="#ef4444"/>
    <circle cx="20" cy="-10" r="4" fill="#ef4444"/>
    <circle cx="0" cy="10" r="4" fill="#ef4444"/>
    <circle cx="-15" cy="15" r="4" fill="#ef4444"/>
    <circle cx="15" cy="20" r="4" fill="#ef4444"/>
    <text x="0" y="45" font-size="13" font-weight="bold" fill="#dc2626" text-anchor="middle">تحرير الهيستامين (ظهور الأعراض)</text>
  </g>

  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
    </marker>
  </defs>
</svg>`,

  // 12. المقارنة بين اللقاح والمصل
  vaccineVsSerum: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <rect width="700" height="480" fill="#f8fafc" rx="14" />
  <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />
  <text x="350" y="40" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">المقارنة بين اللقاح والمصل</text>
  
  <line x1="350" y1="60" x2="350" y2="450" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6"/>
  <text x="175" y="80" font-size="16" font-weight="bold" fill="#16a34a" text-anchor="middle">اللقاح (Vaccin)</text>
  <text x="525" y="80" font-size="16" font-weight="bold" fill="#2563eb" text-anchor="middle">المصل (Sérum)</text>

  <!-- اللقاح -->
  <g transform="translate(175, 130)">
    <rect x="-40" y="-20" width="80" height="40" fill="#dcfce7" stroke="#22c55e" stroke-width="2" rx="6"/>
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#15803d" text-anchor="middle">ميكروب ميت/ضعيف</text>
    <path d="M 0,30 L 0,70" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  </g>
  <g transform="translate(175, 230)">
    <rect x="-80" y="-30" width="160" height="60" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2" rx="6"/>
    <text x="0" y="-5" font-size="12" fill="#334155" text-anchor="middle">مفعول وقائي (مناعة نشطة)</text>
    <text x="0" y="15" font-size="12" fill="#334155" text-anchor="middle">يحفز العضوية لإنتاج أجسام مضادة</text>
    <path d="M 0,40 L 0,80" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  </g>
  <g transform="translate(175, 340)">
    <circle cx="-30" cy="-10" r="15" fill="#bfdbfe" stroke="#3b82f6" stroke-width="2"/>
    <text x="-30" y="-5" font-size="10" font-weight="bold" fill="#1e40af" text-anchor="middle">LBm</text>
    <path d="M 10,-20 L 20,-30 L 15,-40 M 20,-30 L 30,-30" stroke="#2563eb" stroke-width="2" fill="none"/>
    <path d="M 15,0 L 25,-10 L 20,-20 M 25,-10 L 35,-10" stroke="#2563eb" stroke-width="2" fill="none"/>
    <text x="0" y="30" font-size="13" font-weight="bold" fill="#16a34a" text-anchor="middle">مفعول طويل المدى (ذاكرة مناعية)</text>
  </g>

  <!-- المصل -->
  <g transform="translate(525, 130)">
    <rect x="-40" y="-20" width="80" height="40" fill="#dbeafe" stroke="#3b82f6" stroke-width="2" rx="6"/>
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#1d4ed8" text-anchor="middle">أجسام مضادة جاهزة</text>
    <path d="M 0,30 L 0,70" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  </g>
  <g transform="translate(525, 230)">
    <rect x="-80" y="-30" width="160" height="60" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2" rx="6"/>
    <text x="0" y="-5" font-size="12" fill="#334155" text-anchor="middle">مفعول علاجي (مناعة سلبية)</text>
    <text x="0" y="15" font-size="12" fill="#334155" text-anchor="middle">يقضي على الميكروب فوراً</text>
    <path d="M 0,40 L 0,80" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  </g>
  <g transform="translate(525, 340)">
    <path d="M -15,-20 L -5,-30 L -10,-40 M -5,-30 L 5,-30" stroke="#2563eb" stroke-width="2" fill="none"/>
    <path d="M 15,-20 L 25,-30 L 20,-40 M 25,-30 L 35,-30" stroke="#2563eb" stroke-width="2" fill="none"/>
    <text x="0" y="30" font-size="13" font-weight="bold" fill="#dc2626" text-anchor="middle">مفعول مؤقت (تُطرح مع الفضلات)</text>
    <text x="0" y="50" font-size="13" font-weight="bold" fill="#dc2626" text-anchor="middle">لا يترك ذاكرة مناعية</text>
  </g>

  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
    </marker>
  </defs>
</svg>`,

  // 13. مراحل الإلقاح واستعادة الصيغة الصبغية
  fertilizationProcess: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <rect width="700" height="480" fill="#f8fafc" rx="14" />
  <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />
  <text x="350" y="40" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">مراحل الإلقاح واستعادة الصيغة الصبغية (2ن)</text>

  <!-- البويضة -->
  <g transform="translate(350, 160)">
    <circle cx="0" cy="0" r="70" fill="#fee2e2" stroke="#ef4444" stroke-width="3"/>
    <circle cx="0" cy="0" r="25" fill="#fca5a5"/>
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#7f1d1d" text-anchor="middle">ن=23</text>
    <text x="0" y="-85" font-size="14" font-weight="bold" fill="#dc2626" text-anchor="middle">بويضة (مِشيج أنثوي)</text>
  </g>

  <!-- النطاف -->
  <g transform="translate(180, 160)">
    <!-- نطفة 1 -->
    <path d="M 0,0 Q -30,-10 -60,0" fill="none" stroke="#3b82f6" stroke-width="2"/>
    <ellipse cx="10" cy="0" rx="12" ry="6" fill="#bfdbfe" stroke="#2563eb" stroke-width="2"/>
    <text x="10" y="3" font-size="10" font-weight="bold" fill="#1e3a8a" text-anchor="middle">ن</text>
    <text x="10" y="-20" font-size="12" font-weight="bold" fill="#2563eb" text-anchor="middle">نطفة</text>
  </g>
  <g transform="translate(350, 260) rotate(90)">
    <!-- نطفة 2 -->
    <path d="M 0,0 Q -30,-10 -60,0" fill="none" stroke="#3b82f6" stroke-width="2"/>
    <ellipse cx="10" cy="0" rx="12" ry="6" fill="#bfdbfe" stroke="#2563eb" stroke-width="2"/>
    <text x="10" y="3" font-size="10" transform="rotate(-90 10 3)" font-weight="bold" fill="#1e3a8a" text-anchor="middle">ن</text>
  </g>

  <path d="M 350,250 L 350,300" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- البويضة الملقحة -->
  <g transform="translate(350, 370)">
    <circle cx="0" cy="0" r="50" fill="#f3e8ff" stroke="#b91c1c" stroke-width="3"/>
    <circle cx="0" cy="0" r="20" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">2ن=46</text>
    <text x="120" y="5" font-size="14" font-weight="bold" fill="#b91c1c" text-anchor="start">بويضة ملقحة (خلية جسمية)</text>
    <text x="120" y="25" font-size="12" fill="#475569" text-anchor="start">يندمج المشيجان وتستعاد الصيغة 2ن</text>
  </g>

  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
    </marker>
  </defs>
</svg>`,

  // 14. الشذوذ الصبغي والطفرات الوراثية
  geneticDisorders: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[440px] select-none font-sans">
  <rect width="700" height="480" fill="#f8fafc" rx="14" />
  <rect x="12" y="12" width="676" height="456" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" />
  <text x="350" y="40" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">الشذوذ الصبغي والطفرات الوراثية</text>
  
  <line x1="350" y1="60" x2="350" y2="450" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6"/>
  <text x="175" y="80" font-size="16" font-weight="bold" fill="#dc2626" text-anchor="middle">متلازمة داون (ثلاثية 21)</text>
  <text x="525" y="80" font-size="16" font-weight="bold" fill="#d97706" text-anchor="middle">الطفرات الوراثية (ADN)</text>

  <!-- متلازمة داون -->
  <g transform="translate(175, 180)">
    <text x="0" y="-50" font-size="13" fill="#334155" text-anchor="middle">خلل في عدد الصبغيات أثناء الانقسام</text>
    
    <!-- الطابع النووي المصغر -->
    <rect x="-80" y="-20" width="160" height="120" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2" rx="6"/>
    
    <g transform="translate(-50, 10)">
      <path d="M -5,0 Q 0,-20 5,0 Q 0,30 -5,0" fill="#94a3b8"/>
      <path d="M 5,0 Q 10,-20 15,0 Q 10,30 5,0" fill="#94a3b8"/>
      <text x="5" y="40" font-size="10" fill="#64748b" text-anchor="middle">19</text>
    </g>
    <g transform="translate(0, 10)">
      <path d="M -5,0 Q 0,-20 5,0 Q 0,30 -5,0" fill="#94a3b8"/>
      <path d="M 5,0 Q 10,-20 15,0 Q 10,30 5,0" fill="#94a3b8"/>
      <text x="5" y="40" font-size="10" fill="#64748b" text-anchor="middle">20</text>
    </g>
    
    <!-- الزوج 21 الشاذ -->
    <g transform="translate(50, 10)">
      <path d="M -15,0 Q -10,-20 -5,0 Q -10,30 -15,0" fill="#ef4444"/>
      <path d="M -5,0 Q 0,-20 5,0 Q 0,30 -5,0" fill="#ef4444"/>
      <path d="M 5,0 Q 10,-20 15,0 Q 10,30 5,0" fill="#ef4444"/>
      <text x="0" y="40" font-size="12" font-weight="bold" fill="#dc2626" text-anchor="middle">21</text>
      <circle cx="0" cy="10" r="25" fill="none" stroke="#dc2626" stroke-width="2"/>
    </g>
    
    <text x="0" y="130" font-size="13" font-weight="bold" fill="#b91c1c" text-anchor="middle">النتيجة: 47 صبغياً بدلاً من 46</text>
  </g>

  <!-- الطفرات -->
  <g transform="translate(525, 180)">
    <text x="0" y="-50" font-size="13" fill="#334155" text-anchor="middle">خلل في بنية الصبغي أو الـ ADN</text>
    
    <!-- ADN -->
    <path d="M -50,0 Q -25,-40 0,0 T 50,0" fill="none" stroke="#3b82f6" stroke-width="4"/>
    <path d="M -50,20 Q -25,-20 0,20 T 50,20" fill="none" stroke="#2563eb" stroke-width="4"/>
    <line x1="-35" y1="-10" x2="-35" y2="10" stroke="#94a3b8" stroke-width="3"/>
    <line x1="-15" y1="-15" x2="-15" y2="5" stroke="#94a3b8" stroke-width="3"/>
    <line x1="15" y1="15" x2="15" y2="-5" stroke="#94a3b8" stroke-width="3"/>
    
    <!-- تأثير إشعاعي -->
    <path d="M 20,-60 L 30,-30 L 40,-40 L 45,-10" fill="none" stroke="#f59e0b" stroke-width="3"/>
    <circle cx="35" cy="-5" r="15" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4"/>
    <text x="35" y="-70" font-size="12" font-weight="bold" fill="#d97706" text-anchor="middle">عوامل مطفرة (إشعاع، كيمياء)</text>

    <text x="0" y="130" font-size="13" font-weight="bold" fill="#b45309" text-anchor="middle">النتيجة: ظهور صفات غير عادية أو أمراض</text>
  </g>

  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
    </marker>
  </defs>
</svg>`

,
  // 15. الدعامة الوراثية وتجربة نقل الأنوية
  nuclearTransferDNA: `<svg viewBox="0 0 700 480" xmlns="http://www.w3.org/2000/svg">
  <!-- الخلفية -->
  <rect width="100%" height="100%" fill="#ffffff" rx="12" />
  <text x="350" y="40" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1e293b" text-anchor="middle">تجربة الاستنساخ (نقل الأنوية) والدعامة الوراثية</text>

  <!-- الضفدع أ (معطي النواة) -->
  <g transform="translate(150, 100)">
    <rect x="-80" y="0" width="160" height="40" rx="20" fill="#22c55e" opacity="0.2"/>
    <text x="0" y="25" font-family="Arial" font-size="14" font-weight="bold" fill="#15803d" text-anchor="middle">ضفدع (أ) سلالة خضراء</text>
    
    <circle cx="0" cy="90" r="30" fill="#bbf7d0" stroke="#22c55e" stroke-width="2"/>
    <circle cx="0" cy="90" r="12" fill="#15803d"/> <!-- النواة -->
    <text x="0" y="145" font-family="Arial" font-size="13" fill="#475569" text-anchor="middle">خلية جنينية معطية</text>
    
    <path d="M0,155 L0,200" stroke="#64748b" stroke-width="2" stroke-dasharray="4,4" fill="none" marker-end="url(#arrow)"/>
    <text x="-10" y="180" font-family="Arial" font-size="12" fill="#64748b" text-anchor="end">سحب النواة</text>

    <circle cx="0" cy="230" r="12" fill="#15803d"/>
    <text x="-20" y="235" font-family="Arial" font-size="13" font-weight="bold" fill="#15803d" text-anchor="end">نواة (أ)</text>
  </g>

  <!-- الضفدع ب (مستقبل النواة) -->
  <g transform="translate(550, 100)">
    <rect x="-80" y="0" width="160" height="40" rx="20" fill="#f1f5f9" stroke="#cbd5e1"/>
    <text x="0" y="25" font-family="Arial" font-size="14" font-weight="bold" fill="#64748b" text-anchor="middle">ضفدع (ب) سلالة بيضاء</text>
    
    <circle cx="0" cy="90" r="30" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <circle cx="0" cy="90" r="12" fill="#94a3b8"/>
    <text x="0" y="145" font-family="Arial" font-size="13" fill="#475569" text-anchor="middle">بويضة مخصبة</text>

    <path d="M0,155 L0,200" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,4" fill="none" marker-end="url(#arrow)"/>
    <text x="10" y="180" font-family="Arial" font-size="12" fill="#ef4444" text-anchor="start">تخريب النواة</text>
    
    <circle cx="0" cy="230" r="30" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <text x="40" y="235" font-family="Arial" font-size="13" fill="#64748b" text-anchor="start">بويضة منزوعة النواة</text>
  </g>

  <!-- زرع النواة -->
  <path d="M 170,230 L 320,230" stroke="#3b82f6" stroke-width="2" fill="none" marker-end="url(#arrow)"/>
  <path d="M 520,230 L 380,230" stroke="#3b82f6" stroke-width="2" fill="none" marker-end="url(#arrow)"/>
  <text x="350" y="200" font-family="Arial" font-size="14" font-weight="bold" fill="#3b82f6" text-anchor="middle">زرع النواة (أ) في البويضة (ب)</text>
  
  <g transform="translate(350, 230)">
    <circle cx="0" cy="0" r="30" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <circle cx="0" cy="0" r="12" fill="#15803d"/>
  </g>

  <!-- النمو والتطور -->
  <path d="M 350,270 L 350,330" stroke="#3b82f6" stroke-width="2" fill="none" marker-end="url(#arrow)"/>
  <text x="360" y="305" font-family="Arial" font-size="13" fill="#475569" text-anchor="start">انقسامات خلوية ونمو</text>

  <!-- النتيجة -->
  <g transform="translate(350, 390)">
    <rect x="-85" y="-35" width="170" height="40" rx="20" fill="#22c55e" opacity="0.2"/>
    <text x="0" y="-10" font-family="Arial" font-size="15" font-weight="bold" fill="#15803d" text-anchor="middle">ضفدع (ج) سلالة خضراء</text>
    <text x="0" y="25" font-family="Arial" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">الضفدع الناتج يحمل صفات الضفدع المعطي (أ)</text>
    <text x="0" y="45" font-family="Arial" font-size="13" fill="#dc2626" text-anchor="middle">الاستنتاج: النواة هي مقر المعلومات الوراثية</text>
  </g>

  <!-- الدعامة الوراثية (ADN) -->
  <g transform="translate(600, 390)">
    <rect x="-80" y="-50" width="160" height="110" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="0" y="-25" font-family="Arial" font-size="13" font-weight="bold" fill="#334155" text-anchor="middle">بنية الدعامة الوراثية</text>
    <text x="0" y="-5" font-family="Arial" font-size="11" fill="#475569" text-anchor="middle">الصبغي يتكون من الـ ADN</text>
    <!-- رسم مبسط للحمض النووي -->
    <path d="M -20,15 Q 0,-5 20,15 T -20,35 T 20,55" fill="none" stroke="#6366f1" stroke-width="2"/>
    <path d="M 20,15 Q 0,-5 -20,15 T 20,35 T -20,55" fill="none" stroke="#ec4899" stroke-width="2"/>
    <line x1="-15" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="1"/>
    <line x1="-15" y1="35" x2="15" y2="35" stroke="#94a3b8" stroke-width="1"/>
    <line x1="-5" y1="25" x2="5" y2="25" stroke="#94a3b8" stroke-width="1"/>
    <line x1="-5" y1="45" x2="5" y2="45" stroke="#94a3b8" stroke-width="1"/>
  </g>

  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
    </marker>
  </defs>
</svg>`

};
