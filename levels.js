/* Authored layouts and authored starting positions; no random shuffling. */
(function (root) {
  'use strict';
  const layouts = [
    {n:3,paths:['A2 B2 C2'],off:{B2:1}},
    {n:3,paths:['A3 B3 B2 C2 C1'],off:{B3:3,B2:1,C2:3}},
    {n:3,paths:['B2 B1 C1','B2 B3 C3'],off:{B1:3,B3:2}},
    {n:4,paths:['A3 B3 C3 C2 D2','A3 B3 C3 C4 D4'],off:{B3:1,C3:1,C2:3}},
    {n:4,paths:['A2 B2 C2 C1 D1','A2 B2 C2 C3 D3','A2 B2 B3 B4'],off:{B2:1,C2:3,C3:2}},
    {n:4,paths:['A3 B3 B2 B1','A3 B3 C3 C2 C1 D1','A3 B3 C3 C4 D4'],off:{B3:3,C3:2,C1:3}},
    {n:5,paths:['A3 B3 B2 C2 D2 D3 E3'],fixed:['C2'],off:{B3:1,B2:3,D2:3,D3:2}},
    {n:5,paths:['A3 B3 B2 C2 D2 D1 E1','A3 B3 B4 C4 D4 D5 E5'],fixed:['D2'],off:{B3:1,B2:2,C2:1,D1:3,B4:3,D4:2,D5:1}},
    {n:3,paths:['B1 B2 C2'],dual:['B2'],off:{B2:1}},
    {n:4,paths:['A3 B3 C3 C4','A3 B3 B2 C2 C3 D3'],dual:['C3'],off:{B3:3,B2:1,C2:3,C3:1}},
    {n:5,paths:['C1 C2 D2 D3 D4 C4 B4 B3 B2 C2 C3'],dual:['C2'],fixed:['C2'],off:{D2:1,D3:1,D4:3,C4:1,B4:3,B2:2}},
    {n:5,paths:['A3 B3 C3 C4 B4','A3 B3 C3 C4 C5','A3 B3 B2 C2 C3 D3 D2 E2','A3 B3 B2 C2 C3 D3 D4 E4'],dual:['C3'],off:{B2:1,C2:2,D3:3,D4:2}},
    {n:4,paths:['A3 B3 B2 C2 D2','A3 B3 C3 C2 D2'],off:{B3:2,C2:1,C3:3}},
    {n:5,paths:['A3 B3 C3 C4','A3 B3 B2 C2 C3 D3 D4','A3 B3 B2 C2 D2 D3 E3'],dual:['C3','D3'],off:{B3:1,B2:3,C2:1,D2:2,C3:1,D3:1}},
    {n:5,paths:['C3 B3 B2 B1 C1','C3 B3 B2 C2 D2 D1 E1','C3 B3 B4 B5 C5','C3 B3 B4 C4 D4 D5 E5'],fixed:['C2','C4'],off:{B3:3,B2:3,B4:3}}
  ];
  const words = [
    ['Первый огонёк','Одно нажатие — и дома станет уютнее.','Нажмите на провод: он повернётся на четверть оборота.','Прямой провод между станцией и домом должен лежать горизонтально.'],
    ['За поворотом','Свет умеет заглядывать за угол.','Соедините концы соседних проводов. Свет покажет путь.','От станции путь идёт направо, затем вверх, направо и снова вверх — к дому.'],
    ['Добрые соседи','Теперь света ждут сразу два дома.','Все дома должны светиться одновременно.','У станции два выхода: вверх и вниз. Соберите по одному повороту к каждому дому справа.'],
    ['Тихая улица','У одной линии — две тёплые истории.','Развилка направляет свет сразу в несколько веток.','Развилка в третьем столбце соединяет левую, верхнюю и нижнюю ветки.'],
    ['Свет во дворе','Иногда путь нужно немного перестроить.','Можно временно погасить дом, чтобы затем зажечь все.','Первая развилка ведёт вниз и направо. Вторая — вверх и вниз к двум домам справа.'],
    ['Пекарня открыта','Пора включить вывеску и печь.','Проследите путь от тёмных домов до общей линии.','У первой развилки — ветка вверх к дому. У второй — вверх и вниз к двум правым домам.'],
    ['Надёжная опора','Часть сети уже закреплена. Найдите к ней путь.','Провод с заклёпкой нельзя повернуть.','Обойдите двор сверху. Подведите углы к концам закреплённого прямого провода.'],
    ['Вечер в сквере','Небольшой обход меняет целую улицу.','Два дома — две ветки вокруг двора.','Из развилки рядом со станцией пути расходятся вверх и вниз. Соберите каждую ветку по отдельности.'],
    ['Рядом, но отдельно','Две дуги в одной клетке — две отдельные линии.','Между дугами свет не переходит. Каждая светится отдельно.','Нужна дуга от верхнего контакта к правому. Вторая дуга может оставаться тёмной.'],
    ['Два маршрута','Одно поле. Две независимые линии.','Каждой дуге нужен свой путь от станции.','У центральной плитки верх соединяется с правой стороной, а низ — с левой. Подведите питание сверху и слева.'],
    ['Большой обход','Иногда свет возвращается в ту же клетку.','У закреплённой плитки две независимые дорожки.','Свет выходит направо из верхней дуги, обходит двор и возвращается слева в нижнюю дугу — к дому.'],
    ['Зажги квартал','Последние окна ждут вашего света.','Каждая дуга питает свою пару домов.','У нижней развилки соедините верх, левую сторону и низ; у правой — левую сторону, верх и низ.'],
    ['После заката','Ещё одна история для тех, кто не спешит.','Не каждый провод обязательно использовать.','До дома достаточно одного непрерывного пути. Попробуйте верхний обход от станции.'],
    ['Ночная прогулка','Знакомые улицы, новые повороты.','Теперь две плитки с независимыми дугами.','Проследите путь каждого дома отдельно: соседние плитки разделяют четыре дорожки.'],
    ['Навстречу новым улицам','Двор уже светится. Впереди ещё несколько улиц.','Соедините закреплённые провода и несколько веток.','Станция питает общий узел слева. Он соединяет верхнюю и нижнюю развилки, каждая ведёт к двум домам.']
  ];

  // These 15 translations accompany the unchanged version-1 circuit definitions above.
  const legacyEnglish = [
  [
    "The First Light",
    "One tap makes a home a little warmer.",
    "Tap a wire to turn it a quarter turn.",
    "The straight wire between the station and the home should run horizontally."
  ],
  [
    "Around the Corner",
    "Light can find its way around corners.",
    "Join the ends of neighbouring wires. The light shows the route.",
    "From the station, one route goes right, up, right, then up again to the home."
  ],
  [
    "Good Neighbours",
    "Two homes are waiting for light now.",
    "Every home must be lit at the same time.",
    "The station has exits above and below. Build a corner from each exit to the homes on the right."
  ],
  [
    "A Quiet Street",
    "One line, two warm stories.",
    "A junction sends light into several branches.",
    "The junction in the third column joins the left, upper and lower branches."
  ],
  [
    "Courtyard Light",
    "Sometimes a route needs to be rebuilt.",
    "You may turn a home off briefly to light them all together.",
    "The first junction connects down and right. The second connects up and down towards the two homes on the right."
  ],
  [
    "The Bakery Opens",
    "Time to switch on the sign and the oven.",
    "Trace the dark homes back to their shared line.",
    "The first junction has a branch up to a home. The second sends power up and down to the two right-hand homes."
  ],
  [
    "A Firm Support",
    "Part of the network is already fixed. Find a way to it.",
    "A wire with a bolt cannot be rotated.",
    "Go around the courtyard above. Align the corners with the ends of the fixed straight wire."
  ],
  [
    "Evening in the Square",
    "A small detour changes the whole street.",
    "Two homes, two branches around the courtyard.",
    "The junction beside the station branches up and down. Build the two routes separately."
  ],
  [
    "Close but Separate",
    "Two arcs in one tile are two separate lines.",
    "Power cannot jump between the arcs. Each lights independently.",
    "Use the arc joining the top contact to the right contact. The other arc may remain dark."
  ],
  [
    "Two Routes",
    "One board. Two independent lines.",
    "Each arc needs its own route from the station.",
    "At the central tile, top joins right and bottom joins left. Bring power in from above and from the left."
  ],
  [
    "The Long Way Round",
    "Sometimes light returns to the same tile.",
    "The fixed tile contains two independent paths.",
    "Light leaves the upper arc to the right, goes around the courtyard and returns from the left to the lower arc leading to the home."
  ],
  [
    "Light the Block",
    "The last windows on this street are waiting.",
    "Each arc supplies its own pair of homes.",
    "At the lower junction, connect top, left and bottom. At the right junction, connect left, top and bottom."
  ],
  [
    "After Sunset",
    "Another story for those who are in no hurry.",
    "Not every wire needs to be used.",
    "A single continuous route to the home is enough. Try going above the station."
  ],
  [
    "A Night Walk",
    "Familiar streets, new turns.",
    "Now there are two tiles with independent arcs.",
    "Trace each home’s route separately: the neighbouring tiles contain four independent paths."
  ],
  [
    "Towards New Streets",
    "The courtyard is lit. More streets are waiting.",
    "Combine fixed wires with several branches.",
    "The station supplies a shared junction on its left. It feeds upper and lower junctions, each leading to two homes."
  ]
];
  const legacyDifficulties = [1,1,1,2,2,2,2,3,2,3,4,4,3,4,3];

  // Each route and starting rotation below is authored explicitly. No random generation.
  // Coordinates: A1 is top left; letters run left to right, numbers top to bottom.
  const extraLayouts = [
  {
    "n": 4,
    "d": 2,
    "p": [
      "A1 B1 B2 C2 C3 D3",
      "A1 B1 B2 B3 A3 A4"
    ],
    "s": "B1:3 B2:1 C2:2 C3:3 B3:1 A3:2",
    "ru": [
      "У калитки",
      "Два окна по разные стороны двора.",
      "У двух домов есть общий участок пути.",
      "Начните с B2: к нему подходит линия сверху, а ветки уходят направо и вниз. Нижний дом можно запитать через B3 и A3."
    ],
    "en": [
      "By the Gate",
      "Two windows on opposite sides of the courtyard.",
      "Two homes share the first part of their route.",
      "Start at B2: power arrives from above, then branches right and down. The lower home can be reached through B3 and A3."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "C5 C4 B4 B3 B2 A2",
      "C5 C4 D4 E4 E3 E2 D2 D1"
    ],
    "s": "C4:1 B4:3 B3:1 B2:2 D4:1 E4:2 E2:3 D2:1",
    "ru": [
      "Лавочка у сирени",
      "Свет обходит тихий палисадник.",
      "Собирайте длинную и короткую ветки отдельно.",
      "От C4 проведите одну ветку через B4–B2 к левому дому. Другая идёт через E4 и E2, затем поворачивает к D1."
    ],
    "en": [
      "The Lilac Bench",
      "Light finds its way around a quiet garden.",
      "Build the long and short branches separately.",
      "From C4, take one branch through B4–B2 to the left home. The other runs through E4 and E2, then turns towards D1."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "A4 B4 B3 C3 C2 D2 E2",
      "A4 B4 B3 C3 D3 D4 E4 E5"
    ],
    "x": "B3",
    "s": "B4:1 C3:2 C2:3 D2:1 D3:1 D4:3 E4:2",
    "ru": [
      "Обход клумбы",
      "Клумба остаётся в центре прогулки.",
      "Закреплённый угол задаёт начало общей линии.",
      "Подведите B4 к закреплённому B3. От C3 один путь идёт вверх через C2, другой — вправо через D3 и D4."
    ],
    "en": [
      "Around the Flowerbed",
      "The flowerbed stays at the heart of the walk.",
      "A fixed corner sets the start of the shared line.",
      "Connect B4 to the fixed B3. From C3, one route turns up through C2; the other turns right through D3 and D4."
    ]
  },
  {
    "n": 5,
    "d": 4,
    "p": [
      "C1 C2 C3 D3 E3 E4 E5 D5 C5 B5 B4 B3 C3 C4"
    ],
    "u": {
      "C3": [
        3,
        12
      ]
    },
    "x": "D5",
    "s": "C2:1 C3:1 D3:1 E3:3 E5:2 C5:1 B5:3 B4:1 B3:2",
    "ru": [
      "Длинный вечер",
      "Огонёк вернётся с дальней улицы.",
      "Две дуги одной плитки могут быть частями длинного пути.",
      "У C3 соедините верх с правой стороной, а левую — с низом. Один маршрут возвращается к левой дуге через E5, B5 и B3."
    ],
    "en": [
      "A Long Evening",
      "A little light returns from the far street.",
      "Both arcs of one tile can belong to a long route.",
      "At C3, connect top to right and left to bottom. One route returns to the left arc through E5, B5 and B3."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "C3 B3 B2 A2 A1",
      "C3 C2 D2 E2 E1",
      "C3 D3 D4 E4 E5",
      "C3 C4 B4 A4 A5"
    ],
    "x": "B2 D4",
    "s": "B3:1 A2:2 C2:3 D2:1 E2:3 D3:2 E4:1 C4:2 B4:1 A4:3",
    "ru": [
      "Встреча во дворе",
      "Соседи выходят к тёплым окнам.",
      "Начните каждую ветку от центральной станции.",
      "Четыре ветки начинаются в B3, C2, D3 и C4. Углы B2 и D4 уже закреплены: подведите к ним соседние провода."
    ],
    "en": [
      "Courtyard Gathering",
      "Neighbours gather by the warm windows.",
      "Start each branch at the central station.",
      "The four branches start at B3, C2, D3 and C4. Corners B2 and D4 are fixed: align the wires beside them."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "A1 B1 B2 B3 C3 D3 D2 E2 E1",
      "A1 B1 B2 B3 B4 C4 C5",
      "A1 B1 B2 B3 C3 D3 D4 E4"
    ],
    "s": "B1:1 B2:1 B3:2 C3:1 D3:3 D2:2 E2:1 B4:3 C4:2 D4:1",
    "ru": [
      "Речная пристань",
      "У воды ждут три огонька.",
      "Одна развилка может питать следующую.",
      "Сначала соедините станцию с B3. Его нижняя ветка идёт к C5, правая — к D3, где путь снова делится вверх и вниз."
    ],
    "en": [
      "River Landing",
      "Three lights are waiting by the water.",
      "One junction can supply another.",
      "First connect the station to B3. Its lower branch leads to C5; its right branch reaches D3, where the route splits up and down again."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "E3 D3 D2 C2 B2 B1 A1",
      "E3 D3 D4 C4 B4 A4 A5"
    ],
    "x": "C2 C4",
    "s": "D3:2 D2:1 B2:3 B1:2 D4:1 B4:1 A4:3",
    "ru": [
      "Два берега",
      "Свет отражается по обе стороны воды.",
      "Две неподвижные линии помогают разобрать ветки.",
      "От D3 направьте питание вверх к D2 и вниз к D4. Верхняя ветка проходит через C2, нижняя — через C4."
    ],
    "en": [
      "Two Riverbanks",
      "Light reflects on both sides of the water.",
      "Two fixed lines help you separate the branches.",
      "From D3, send power up to D2 and down to D4. The upper route crosses C2; the lower route crosses C4."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "A3 B3 C3 D3 E3 E2 D2 C2 C1",
      "A3 B3 C3 C4 D4 E4 E5"
    ],
    "s": "B3:1 C3:1 D3:1 E3:2 E2:3 D2:1 C2:2 C4:3 D4:1 E4:2",
    "ru": [
      "С другой стороны",
      "До близкого окна путь оказывается длиннее.",
      "Дом наверху можно подключить обходом справа.",
      "Один путь к C1 проходит от C3 через E3, E2 и C2. Второй дом получает свет по нижней ветке C4–E4."
    ],
    "en": [
      "From the Other Side",
      "A nearby window has a longer way home.",
      "A home above you can be reached around the right edge.",
      "One route to C1 runs from C3 through E3, E2 and C2. The other home is supplied by the lower branch C4–E4."
    ]
  },
  {
    "n": 5,
    "d": 4,
    "p": [
      "A2 B2 C2 C1",
      "A2 B2 B3 C3 C2 D2 E2 E3 E4",
      "A2 B2 B3 B4 A4 A5"
    ],
    "u": {
      "C2": [
        6,
        9
      ]
    },
    "s": "B2:2 C2:1 B3:1 C3:2 D2:1 E2:3 E3:1 B4:2 A4:1",
    "ru": [
      "Под мостиком",
      "Под мостиком проходят две разные линии.",
      "Дуги делят плитку, но не обмениваются светом.",
      "В C2 соедините левую сторону с верхом, а низ — с правой. Для второй дуги подведите питание через B3 и C3."
    ],
    "en": [
      "Under the Footbridge",
      "Two separate lines pass beneath the bridge.",
      "The arcs share a tile, but do not share power.",
      "At C2, join left to top and bottom to right. Feed the second arc through B3 and C3."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "C1 C2 B2 B3 B4 C4 D4 D3 D2 E2 E1",
      "C1 C2 C3 D3 E3 E4 E5"
    ],
    "x": "D3",
    "s": "C2:1 B2:2 B3:1 B4:3 C4:1 D4:2 D2:3 E2:1 C3:2 E3:3 E4:1",
    "ru": [
      "Распределитель",
      "Одна опора собирает соседние улицы.",
      "Обычный перекрёсток соединяет все свои контакты.",
      "Закреплённый D3 здесь — общий узел, не две дуги. Подведите к нему линию через C3 и распределите свет к верхней и нижней правым веткам."
    ],
    "en": [
      "The Distributor",
      "One support joins the neighbouring streets.",
      "A normal crossing joins all of its contacts.",
      "The fixed D3 is a shared junction, not two separate arcs. Feed it through C3 and distribute power to the upper and lower right branches."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "A5 A4 B4 B3 C3 D3 D2 D1 E1",
      "A5 A4 B4 B3 B2 C2 C1",
      "A5 A4 B4 B3 C3 D3 D4 D5 E5"
    ],
    "s": "A4:1 B4:3 B3:2 C3:1 D3:1 D2:1 D1:3 B2:2 C2:1 D4:1 D5:2",
    "ru": [
      "Почтовый причал",
      "Свет нужен и почте, и соседям.",
      "Отследите, где общий путь разделяется дважды.",
      "У B3 одна ветка поднимается через B2 к C1. Другая идёт к D3, откуда можно подключить верхний и нижний правые дома."
    ],
    "en": [
      "Postal Pier",
      "The post office and its neighbours need light.",
      "Find the two places where the shared route branches.",
      "At B3, one branch climbs through B2 to C1. The other reaches D3, which can supply the upper and lower right homes."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "A3 B3 C3 C2 B2 B1 C1 D1 E1 E2 F2",
      "A3 B3 C3 D3 D4 C4 C5 B5 A5 A6"
    ],
    "x": "D1 C5",
    "s": "B3:1 C3:3 C2:2 B2:1 B1:3 C1:1 E1:2 E2:3 D3:1 D4:2 C4:1 B5:1 A5:3",
    "ru": [
      "Вдоль воды",
      "Две прогулки начинаются на одной улице.",
      "Сначала найдите входы в длинные обходы.",
      "От C3 верхняя ветка идёт через C2, B2 и B1, затем вдоль первого ряда. Нижняя начинается в D3 и возвращается влево через C5."
    ],
    "en": [
      "Along the Water",
      "Two walks begin on the same street.",
      "Find the entrances to the long routes first.",
      "From C3, the upper branch goes through C2, B2 and B1, then along the first row. The lower one starts at D3 and returns left through C5."
    ]
  },
  {
    "n": 5,
    "d": 4,
    "p": [
      "E5 D5 D4 C4 C3 D3 E3 E2 E1 D1 C1 B1 B2 C2 C3 B3 A3 A2 A1"
    ],
    "u": {
      "C3": [
        6,
        9
      ]
    },
    "x": "C3",
    "s": "D5:3 D4:1 C4:2 D3:1 E3:2 E2:1 E1:3 C1:1 B1:2 B2:3 C2:1 B3:1 A3:2 A2:1",
    "ru": [
      "Обратная набережная",
      "Путь возвращается к знакомой опоре.",
      "У неподвижных дуг найдите отдельно вход и выход.",
      "В C3 нижний контакт связан с правым, верхний — с левым. Обход через правый край и первый ряд возвращает питание через C2 к левой ветке."
    ],
    "en": [
      "The Returning Riverside",
      "The route comes back to a familiar support.",
      "Find each fixed arc’s entrance and exit separately.",
      "At C3, bottom joins right and top joins left. A route around the right edge and first row brings power back through C2 to the left branch."
    ]
  },
  {
    "n": 4,
    "d": 2,
    "p": [
      "B4 B3 A3 A2 B2 B1 C1 D1 D2 C2 C3 D3 D4"
    ],
    "x": "B2",
    "s": "B3:1 A3:2 A2:3 B1:1 C1:1 D1:2 D2:3 C2:1 C3:2 D3:3",
    "ru": [
      "Книжный киоск",
      "Небольшая остановка среди больших улиц.",
      "На компактном поле полезно идти от дома назад.",
      "От дома D4 проследите путь через D3, C3 и C2. Дальше один вариант огибает верхний край через D2, D1 и B1."
    ],
    "en": [
      "The Book Kiosk",
      "A small stop between larger streets.",
      "On a compact board, try working back from the home.",
      "Trace back from D4 through D3, C3 and C2. One route then follows the upper edge through D2, D1 and B1."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "A2 B2 C2 C1 D1 E1 E2 E3 F3",
      "A2 B2 C2 C3 B3 B4 B5 A5 A6",
      "A2 B2 C2 C1 D1 E1 E2 E3 D3 D4 E4 E5 F5 F6"
    ],
    "s": "B2:1 C2:2 C1:3 D1:1 E1:2 E2:1 E3:3 C3:1 B3:2 B5:3 A5:1 D3:2 D4:3 E4:1 E5:2 F5:3",
    "ru": [
      "Три остановки",
      "У каждого причала свой вечер.",
      "Дальнюю ветку удобно завершать после общей линии.",
      "У C2 отделите нижнюю левую ветку. Путь через C1 и E1 приводит к E3: от него близкий дом справа, а дальний — через D3, D4 и E5."
    ],
    "en": [
      "Three Stops",
      "Each landing has its own evening.",
      "Finish the distant branch after the shared line.",
      "At C2, separate the lower left branch. C1 and E1 lead to E3: the nearby home is right of it; the distant one is reached through D3, D4 and E5."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "C5 C4 D4 E4 E3 D3 D2 E2 E1",
      "C5 C4 B4 A4 A3 B3 B2 A2 A1",
      "C5 C4 C3 C2 C1"
    ],
    "x": "C3",
    "s": "C4:1 D4:1 E4:2 E3:3 D3:1 D2:2 E2:3 B4:1 A4:2 A3:1 B3:3 B2:2 A2:1",
    "ru": [
      "Фонтан у воды",
      "У фонтана встречаются три дорожки.",
      "Короткая ветка не мешает двум длинным.",
      "Узел C4 питает центральный дом через закреплённый C3. Боковые дома можно подключить обходами через A4 и E4."
    ],
    "en": [
      "The Riverside Fountain",
      "Three paths meet at the fountain.",
      "A short branch can coexist with two long ones.",
      "Junction C4 supplies the central home through fixed C3. The side homes can be reached around A4 and E4."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "A1 B1 C1 C2 D2 E2 E1 F1",
      "A1 B1 C1 C2 C3 B3 B4 C4 D4 D5 E5 F5 F6",
      "A1 B1 C1 C2 D2 D3 E3 F3"
    ],
    "x": "E2 C4",
    "s": "B1:1 C1:3 C2:2 D2:1 E1:3 C3:2 B3:1 B4:3 D4:1 D5:2 E5:1 F5:3 D3:2 E3:1",
    "ru": [
      "Дальний паром",
      "Свет добирается до дальнего причала.",
      "Работайте от неподвижных участков к развилкам.",
      "Линия от C2 делится к D2 и C3. Через D2 доступны два верхних дома; ветка через B4 и закреплённый C4 уходит к нижнему правому."
    ],
    "en": [
      "The Far Ferry",
      "Light reaches the distant landing.",
      "Work from fixed sections towards the junctions.",
      "At C2, the line splits towards D2 and C3. D2 leads to two upper homes; the branch through B4 and fixed C4 reaches the lower right one."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "A3 B3 B2 C2 D2 D3 C3 C4 D4 E4 E5",
      "A3 B3 B4 A4 A5"
    ],
    "x": "C2",
    "s": "B3:1 B2:2 D2:3 D3:1 C3:2 C4:3 D4:1 E4:2 B4:3 A4:1",
    "ru": [
      "Узкая арка",
      "За аркой свет снова поворачивает.",
      "Не каждый близкий провод ведёт к ближайшему дому.",
      "Через закреплённый C2 путь идёт к D2, затем возвращается через D3 и C3 вниз. Второй дом можно подключить короткой веткой B3–B4–A4."
    ],
    "en": [
      "The Narrow Arch",
      "Beyond the arch, the light turns again.",
      "A nearby wire may lead to a more distant home.",
      "From fixed C2, go to D2, then return through D3 and C3 downwards. The other home can use the short branch B3–B4–A4."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "D1 D2 E2 F2 F3 F4 E4 D4 C4 B4 B3 B2 C2 D2 D3",
      "D1 D2 E2 F2 F3 F4 E4 E5 D5 D6"
    ],
    "u": {
      "D2": [
        3,
        12
      ]
    },
    "x": "D2",
    "s": "E2:1 F2:3 F3:1 F4:2 E4:1 D4:1 C4:1 B4:3 B3:1 B2:2 C2:1 E5:2 D5:3",
    "ru": [
      "Кольцо у верфи",
      "Один обход включает и верфь, и дом.",
      "Ответвление может работать до завершения всего обхода.",
      "Из D2 питание идёт направо. Возвратите его к левой дуге через F4, B4 и B2. От E4 отдельная ветка ведёт через E5 к дому D6."
    ],
    "en": [
      "The Shipyard Loop",
      "One route lights the shipyard and a home.",
      "A side branch can work before the whole loop is complete.",
      "Power leaves D2 to the right. Bring it back to the left arc through F4, B4 and B2. At E4, a separate branch runs through E5 to D6."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "B5 B4 C4 C3 D3 D2 C2 B2 B1 A1",
      "B5 B4 C4 D4 E4 E3 E2 E1",
      "B5 B4 C4 C3 C2 C1"
    ],
    "s": "B4:1 C4:2 C3:3 D3:1 D2:2 C2:1 B2:3 B1:2 D4:1 E4:3 E3:1 E2:1",
    "ru": [
      "Рыбацкий двор",
      "За сетями видны ещё три окна.",
      "При соединении веток общий узел сохраняет питание.",
      "У C4 пути расходятся к C3 и D4. Верхний центральный дом можно запитать через C3 и C2, а правый — вдоль E4–E2."
    ],
    "en": [
      "The Fishing Courtyard",
      "Three more windows shine beyond the nets.",
      "A shared junction keeps joined branches connected.",
      "At C4, routes split towards C3 and D4. The upper central home can be fed through C3 and C2; the right home through E4–E2."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "C6 C5 D5 D4 E4 F4 F3 E3 D3 D2 E2 F2 F1",
      "C6 C5 B5 B4 A4 A3 B3 C3 C2 B2 A2 A1",
      "C6 C5 D5 D4 C4 C3 C2 C1"
    ],
    "x": "D4 C2",
    "s": "C5:1 D5:3 E4:1 F4:2 F3:3 E3:1 D3:2 D2:1 E2:1 F2:3 B5:2 B4:1 A4:3 A3:2 B3:1 C3:3 B2:1 A2:2 C4:1",
    "ru": [
      "Городские причалы",
      "Несколько улиц пользуются общей линией.",
      "Ищите повторно используемые участки сети.",
      "C5 распределяет питание влево и вправо. Закреплённый D4 связывает правый обход с C4, а C2 помогает подключить два верхних дома."
    ],
    "en": [
      "City Landings",
      "Several streets use the same power line.",
      "Look for sections shared by several routes.",
      "C5 distributes power left and right. Fixed D4 links the right-hand route to C4, while C2 helps supply two upper homes."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "A1 A2 B2 C2 C3 D3 E3 E4 D4 C4 B4 B5 A5",
      "A1 A2 B2 C2 D2 E2 E1",
      "A1 A2 B2 C2 C3 B3 A3 A4"
    ],
    "s": "A2:1 B2:1 C2:2 C3:3 D3:1 E3:2 E4:1 D4:1 C4:1 B4:3 B5:2 D2:1 E2:2 B3:1 A3:3",
    "ru": [
      "Зелёная набережная",
      "Свет идёт между деревьями и водой.",
      "Короткие ответвления проверяйте до длинного обхода.",
      "От C2 через E2 подключается верхний правый дом. У C3 короткая левая ветка идёт к A4, длинная правая огибает низ к A5."
    ],
    "en": [
      "The Green Riverside",
      "Light travels between the trees and the water.",
      "Check short branches before tackling the long route.",
      "From C2, E2 leads to the upper right home. At C3, the short left branch reaches A4; the long right branch goes around the bottom to A5."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "F6 E6 D6 D5 C5 C4 D4 E4 E3 D3 D2 C2 C1 B1 A1",
      "F6 E6 D6 D5 C5 C4 B4 A4 A3 B3 B2 A2"
    ],
    "x": "D4 C2",
    "s": "E6:1 D6:3 D5:2 C5:1 C4:3 E4:2 E3:1 D3:3 D2:2 C1:1 B1:1 B4:1 A4:2 A3:3 B3:1 B2:2",
    "ru": [
      "Два маяка",
      "Огни ждут на соседних береговых тропах.",
      "Общий подход может разойтись далеко от станции.",
      "Соберите подход от F6 через D6, D5 и C5 к C4. От C4 можно идти вправо через D4 к A1 или влево через B4 к A2."
    ],
    "en": [
      "Two Beacons",
      "Lights await on neighbouring riverside paths.",
      "A shared approach can split far from the station.",
      "Build the approach from F6 through D6, D5 and C5 to C4. From there, go right through D4 towards A1 or left through B4 towards A2."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "C3 C2 D2 D1 E1",
      "C3 D3 E3 E4 E5",
      "C3 C4 B4 B5 A5",
      "C3 B3 A3 A2 A1",
      "C3 D3 E3 E2 D2 D1 E1"
    ],
    "s": "C2:1 D2:2 D1:3 D3:1 E3:1 E4:1 C4:2 B4:3 B5:1 B3:1 A3:2 A2:1 E2:3",
    "ru": [
      "Круг фонарей",
      "У воды есть больше одного пути.",
      "Принимается любой маршрут, который зажигает все дома.",
      "Начните с четырёх веток вокруг станции. К верхнему правому дому есть обход через E3 и E2, соединённый с D2. Необязательно сохранять каждый участок эталона."
    ],
    "en": [
      "A Ring of Lamps",
      "There is more than one way along the water.",
      "Any route that powers every home is accepted.",
      "Start with the four branches around the station. The upper right home has a route through E3 and E2 to D2. You do not have to use every reference section."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "A4 B4 C4 D4 D3 C3 C2 D2 E2 E1 F1",
      "A4 B4 B3 B2 C2 C3 D3 E3 F3 F4 F5",
      "A4 B4 C4 C5 B5 B6 A6"
    ],
    "x": "D3 B5",
    "s": "B4:1 C4:2 D4:3 C3:1 C2:3 D2:1 E2:2 E1:3 B3:1 B2:2 E3:1 F3:3 F4:1 C5:2 B6:3",
    "ru": [
      "Вечер у реки",
      "Последние причалы встречают огни.",
      "Объедините развилки и неподвижные опоры.",
      "От B4 отделите нижнюю ветку через C5 и B5. Верхняя сеть связывает C2 с закреплённым D3; через E2 доступен F1, через E3 — F5."
    ],
    "en": [
      "Evening by the River",
      "The last landings welcome their lights.",
      "Combine junctions with fixed supports.",
      "From B4, separate the lower branch through C5 and B5. The upper network joins C2 to fixed D3; E2 leads to F1, and E3 leads to F5."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "D5 D4 C4 B4 B3 C3 C2 B2 A2 A1",
      "D5 D4 E4 E3 D3 C3 C2 C1"
    ],
    "s": "D4:1 C4:1 B4:2 B3:3 C3:1 C2:2 B2:1 A2:3 E4:2 E3:1 D3:1",
    "ru": [
      "Первая терраса",
      "У подножия сада всего два окна.",
      "Два подхода могут встретиться перед домами.",
      "Один вариант соединяет D4 с C3 через B4 и B3. Другой подход идёт через E4 и D3. От C2 ветки расходятся к C1 и A1."
    ],
    "en": [
      "The First Terrace",
      "Two windows wait at the foot of the garden.",
      "Two approaches can meet before reaching the homes.",
      "One route joins D4 to C3 through B4 and B3. Another comes through E4 and D3. At C2, branches lead to C1 and A1."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "A6 A5 B5 B4 B3 C3 D3 D2 C2 C1 D1 E1 F1",
      "A6 A5 B5 B4 B3 B2 A2 A1",
      "A6 A5 B5 B4 B3 C3 D3 E3 E4 F4 F5 E5 E6"
    ],
    "x": "C2 E4",
    "s": "A5:1 B5:3 B4:1 B3:2 C3:1 D3:3 D2:2 C1:3 D1:1 E1:1 B2:2 A2:3 E3:1 F4:3 F5:2 E5:1",
    "ru": [
      "Садовые лестницы",
      "Огни поднимаются по ступеням сада.",
      "Решайте разветвлённую сеть по небольшим участкам.",
      "У B3 короткая ветка ведёт через B2 к A1. Из D3 верхний путь идёт через D2 к F1, правый — через E4 и F5 к E6."
    ],
    "en": [
      "Garden Steps",
      "Lights climb the garden steps.",
      "Solve a branching network in small sections.",
      "At B3, a short branch leads through B2 to A1. From D3, the upper route goes through D2 to F1; the right one runs through E4 and F5 to E6."
    ]
  },
  {
    "n": 6,
    "d": 5,
    "p": [
      "A5 B5 C5 C4 D4 E4 E3 E2 D2 C2 B2 B3 B4 C4 C3 D3",
      "A5 B5 C5 C4 D4 E4 E3 E2 F2 F1"
    ],
    "u": {
      "C4": [
        6,
        9
      ]
    },
    "x": "C4",
    "s": "B5:1 C5:2 D4:1 E4:3 E3:1 E2:2 D2:1 C2:1 B2:3 B3:1 B4:2 C3:3 F2:1",
    "ru": [
      "Оранжерея",
      "Тёплый свет вернётся с другой стороны стекла.",
      "Возвращённое питание должно попасть в другую дугу.",
      "C4 получает питание снизу и отправляет его направо. Обход через E2 и B2 приводит к левой стороне C4; верхняя дуга ведёт через C3 к D3."
    ],
    "en": [
      "The Glasshouse",
      "Warm light returns from the other side of the glass.",
      "Returning power must enter the other arc.",
      "C4 receives power from below and sends it right. E2 and B2 lead back to its left side; the upper exit then supplies D3 through C3."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "F5 E5 D5 C5 C4 B4 A4 A3 B3 C3 C2 B2 B1 C1 D1 D2 E2 F2 F1",
      "F5 E5 D5 C5 C4 B4 A4 A3 B3 C3 D3 E3 E4 F4",
      "F5 E5 D5 C5 C6 B6 A6"
    ],
    "x": "B4 D1",
    "s": "E5:1 D5:1 C5:2 C4:3 A4:1 A3:2 B3:1 C3:3 C2:2 B2:1 B1:3 C1:1 D2:2 E2:1 F2:3 D3:1 E3:2 E4:3 C6:2 B6:1",
    "ru": [
      "Аллеи наверху",
      "У верхнего сада три разных входа.",
      "Отделяйте короткие ветки от основной аллеи.",
      "У C5 нижняя ветка идёт к A6. Главная линия поднимается через C4 к C3: оттуда верхний путь ведёт к F1, правый — через E3 к F4."
    ],
    "en": [
      "Upper Walkways",
      "The upper garden has three different entrances.",
      "Separate short branches from the main walkway.",
      "At C5, the lower branch reaches A6. The main line climbs through C4 to C3: the upper route leads to F1, the right one through E3 to F4."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "E1 D1 D2 C2 B2 B3 A3 A4 B4 C4 D4 D5 E5",
      "E1 D1 D2 C2 B2 B3 C3 D3 E3 E2"
    ],
    "x": "B2 D4",
    "s": "D1:1 D2:2 C2:1 B3:3 A3:2 A4:1 B4:1 C4:1 D5:3 C3:1 D3:1 E3:2",
    "ru": [
      "Скамья под клёном",
      "Две тропы огибают старый клён.",
      "Закреплённые углы ограничивают подход, а не порядок решения.",
      "Подведите питание от D2 через C2 к B2. У B3 один путь уходит влево и вниз к E5, другой — вправо через C3 к E2."
    ],
    "en": [
      "The Maple Bench",
      "Two paths go around the old maple.",
      "Fixed corners constrain the route, not the order of solving.",
      "Bring power from D2 through C2 to B2. At B3, one route goes left and down towards E5; the other heads right through C3 to E2."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "B1 B2 C2 D2 D3 E3 F3 F2 E2 E1 F1",
      "B1 B2 C2 D2 D3 C3 B3 A3 A4 B4 B5 C5 C6 D6 E6 F6",
      "B1 B2 C2 D2 D3 C3 B3 A3 A4 B4 B5 C5 D5 D4 E4 F4 F5"
    ],
    "x": "B4 E2",
    "s": "B2:1 C2:1 D2:2 D3:3 E3:1 F3:3 F2:2 E1:1 C3:1 B3:1 A3:2 A4:3 B5:2 C5:1 C6:3 D6:1 E6:1 D5:2 D4:3 E4:1 F4:2",
    "ru": [
      "Склоны и площадки",
      "У каждой площадки свой поворот.",
      "Одна длинная ветка может разделиться у самого конца.",
      "Из D3 направьте питание вправо к верхнему дому и влево к нижней сети. У C5 путь делится вниз к F6 и вправо через D5 к F5."
    ],
    "en": [
      "Slopes and Landings",
      "Each landing has its own turn.",
      "A long branch can split close to its end.",
      "From D3, send power right to the upper home and left into the lower network. C5 branches down to F6 and right through D5 towards F5."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "F6 F5 E5 D5 D4 C4 B4 B3 C3 D3 D2 C2 B2 A2 A1",
      "F6 F5 E5 D5 D4 C4 B4 A4 A5 B5 B6 C6",
      "F6 F5 E5 D5 D4 E4 E3 E2 F2 F1"
    ],
    "x": "D4 B3",
    "s": "F5:1 E5:1 D5:3 C4:1 B4:2 C3:1 D3:3 D2:2 C2:1 B2:1 A2:3 A4:2 A5:1 B5:3 B6:2 E4:3 E3:1 E2:2 F2:1",
    "ru": [
      "Свет садовника",
      "Домик садовника ждёт между аллеями.",
      "Начните с неподвижного распределителя.",
      "Закреплённый D4 получает питание снизу, а отдаёт влево и вправо. Левая ветка снова делится у B4; правая идёт через E2 к F1."
    ],
    "en": [
      "The Gardener’s Light",
      "The gardener’s home waits between the walkways.",
      "Start at the fixed distributor.",
      "Fixed D4 receives power from below and sends it left and right. The left branch splits again at B4; the right one goes through E2 to F1."
    ]
  },
  {
    "n": 5,
    "d": 4,
    "p": [
      "A2 B2 B3 C3 C4 D4 E4 E3 D3 D2 C2 B2 B1 C1 D1 E1",
      "A2 B2 B3 C3 C4 B4 A4 A5"
    ],
    "u": {
      "B2": [
        3,
        12
      ]
    },
    "x": "B2",
    "s": "B3:1 C3:3 C4:2 D4:1 E4:3 E3:2 D3:1 D2:3 C2:1 B1:2 C1:1 D1:1 B4:1 A4:2",
    "ru": [
      "Круг по саду",
      "Знакомая опора встретится ещё раз.",
      "После обхода свет может выйти выше точки входа.",
      "У B2 левый контакт связан с низом, правый — с верхом. Пройдите через C4 и E4, вернитесь через C2 и поднимитесь по B1 к верхнему дому."
    ],
    "en": [
      "A Walk Around the Garden",
      "You meet a familiar support once again.",
      "After a detour, light can leave above its entrance.",
      "At B2, left joins bottom and right joins top. Go through C4 and E4, return through C2, then climb via B1 towards the upper home."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "C1 C2 D2 E2 E3 D3 D4 C4 B4 A4 A5 B5 B6 C6 D6 E6 F6",
      "C1 C2 D2 E2 E3 D3 D4 E4 F4 F3 F2 F1",
      "C1 C2 D2 E2 E3 D3 D4 C4 C3 B3 A3 A2 A1"
    ],
    "s": "C2:1 D2:1 E2:2 E3:3 D3:1 D4:2 C4:3 B4:1 A4:2 A5:3 B5:1 B6:2 C6:1 D6:1 E6:1 E4:1 F4:3 F3:1 F2:1 C3:3 B3:1 A3:2 A2:1",
    "ru": [
      "Три беседки",
      "На склоне зажигаются три беседки.",
      "Длинные крайние ветки встречаются в общей середине.",
      "У D4 разделите путь к правому краю и к C4. У C4 верхняя ветка ведёт к A1, нижний обход через A5 и B6 — к F6."
    ],
    "en": [
      "Three Gazebos",
      "Three gazebos light up on the hillside.",
      "Long outer branches meet in a shared middle.",
      "At D4, split the route towards the right edge and C4. At C4, the upper branch reaches A1; the lower route through A5 and B6 reaches F6."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "A1 B1 B2 C2 C3 D3 D4 E4 E5 F5 F6",
      "A1 B1 C1 D1 D2 E2 F2 F3 F4 E4 D4 C4 B4 B5 A5 A6"
    ],
    "x": "C2 E2 C4",
    "s": "B1:1 B2:2 C3:3 D3:2 D4:1 E4:3 E5:2 F5:1 C1:1 D1:3 D2:2 F2:3 F3:1 F4:2 B4:3 B5:2 A5:1",
    "ru": [
      "Переплетение троп",
      "Тропы встречаются между цветниками.",
      "Соединённые линии могут помогать друг другу.",
      "Один подход идёт через B2 и C3, другой — по верху через D1 и F2. Объедините их у D4–E4; оттуда доступны оба нижних дома."
    ],
    "en": [
      "Woven Paths",
      "Paths meet between the flowerbeds.",
      "Connected lines can support each other.",
      "One approach uses B2 and C3; another follows the top through D1 and F2. Join them around D4–E4 to reach both lower homes."
    ]
  },
  {
    "n": 5,
    "d": 4,
    "p": [
      "C5 C4 C3 D3 E3 E2 E1 D1 C1 B1 A1 A2 A3 B3 C3 C2"
    ],
    "u": {
      "C3": [
        6,
        9
      ]
    },
    "x": "C3 E1",
    "s": "C4:1 D3:1 E3:2 E2:1 D1:1 C1:1 B1:1 A1:3 A2:1 A3:2 B3:1",
    "ru": [
      "Возврат к клумбе",
      "До близкого окна нужно обойти сад.",
      "Близкий дом может питаться только другой дугой опоры.",
      "Из C3 свет выходит направо. Один обход проходит через E1 и A1, возвращается по B3 и выходит вверх из C3 к дому C2."
    ],
    "en": [
      "Back to the Flowerbed",
      "A nearby window calls for a walk around the garden.",
      "A nearby home may need the other arc of a support.",
      "Power leaves C3 to the right. One route passes E1 and A1, returns through B3, then leaves C3 upwards to home C2."
    ]
  },
  {
    "n": 6,
    "d": 5,
    "p": [
      "A3 B3 C3 C4 D4 D5 E5 F5 F4 E4 D4 D3 E3 F3 F2 F1",
      "A3 B3 C3 C4 B4 A4 A5 A6"
    ],
    "u": {
      "D4": [
        3,
        12
      ]
    },
    "x": "D4",
    "s": "B3:1 C3:2 C4:3 D5:1 E5:1 F5:2 F4:3 E4:1 D3:2 E3:1 F3:3 F2:1 B4:1 A4:2 A5:1",
    "ru": [
      "За каменной стеной",
      "Свет возвращается за садовую стену.",
      "Разберите входную и выходную части обхода.",
      "У D4 вход слева уходит вниз. Вернитесь справа через F5, F4 и E4: верхний выход D4 ведёт к D3 и далее к F1."
    ],
    "en": [
      "Beyond the Stone Wall",
      "Light returns beyond the garden wall.",
      "Separate the entrance and exit sections of the detour.",
      "At D4, the left entrance turns down. Return from the right through F5, F4 and E4: the upper exit leads to D3 and on to F1."
    ]
  },
  {
    "n": 6,
    "d": 5,
    "p": [
      "F1 E1 D1 D2 C2 B2 B3 C3 C4 D4 E4 E5 D5 C5 B5 A5 A6",
      "F1 E1 D1 D2 C2 B2 B3 C3 C4 B4 A4 A3 A2 B2 B1 A1",
      "F1 E1 D1 D2 E2 F2 F3 E3 D3 D4 E4 F4 F5 F6"
    ],
    "x": "C4 F3",
    "s": "E1:1 D1:2 D2:3 C2:1 B2:2 B3:1 C3:3 D4:1 E4:2 E5:3 D5:1 C5:1 B5:1 A5:2 B4:1 A4:3 A3:1 A2:2 B1:3 E2:1 F2:2 E3:1 D3:3 F4:2 F5:1",
    "ru": [
      "Панорама садов",
      "Сверху видны сразу несколько аллей.",
      "Общие участки позволяют связать большую сеть.",
      "Начните с D2: одна ветка идёт к B2, другая — через F2 и F3. Закреплённый C4 распределяет левую сеть, а D4–E4 связывают её с правой."
    ],
    "en": [
      "A View of the Gardens",
      "Several walkways come into view from above.",
      "Shared sections bring a large network together.",
      "Start at D2: one branch heads to B2, another through F2 and F3. Fixed C4 distributes the left network; D4–E4 joins it to the right."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "A5 B5 B4 C4 D4 D3 C3 B3 B2 C2 D2 E2 E1",
      "A5 B5 B4 C4 D4 D3 C3 B3 A3 A2 A1",
      "A5 B5 B4 C4 D4 D3 E3 E4 E5"
    ],
    "x": "C4",
    "s": "B5:1 B4:2 D4:3 D3:1 C3:1 B3:2 B2:3 C2:1 D2:1 E2:2 A3:3 A2:1 E3:2 E4:1",
    "ru": [
      "Тихая теплица",
      "Перед большой прогулкой — тихая остановка.",
      "Вернитесь к двум понятным развилкам.",
      "После закреплённого C4 питание приходит к D3. Его правая ветка идёт к E5, левая — к B3, где свет расходится к двум верхним домам."
    ],
    "en": [
      "The Quiet Greenhouse",
      "A quiet stop before a longer walk.",
      "Return to two familiar junctions.",
      "After fixed C4, power reaches D3. Its right branch leads to E5; the left reaches B3, which supplies the two upper homes."
    ]
  },
  {
    "n": 6,
    "d": 5,
    "p": [
      "B6 B5 C5 D5 D4 E4 E3 F3 F2 E2 D2 C2 C1 B1 A1",
      "B6 B5 C5 D5 D4 C4 B4 A4 A3 B3 C3 C2 D2 D1 E1 F1",
      "B6 B5 C5 D5 D4 E4 F4 F5 F6"
    ],
    "x": "D4 C2",
    "s": "B5:1 C5:1 D5:3 E4:2 E3:3 F3:2 F2:1 E2:1 D2:3 C1:2 B1:1 C4:1 B4:1 A4:2 A3:3 B3:1 C3:2 D1:3 E1:1 F4:3 F5:1",
    "ru": [
      "Общий сад",
      "Соседние аллеи делят одну сеть.",
      "Замкнутый участок допускает разные способы подвести питание.",
      "Опорный D4 соединяет C4, E4 и D5. Через левую сеть можно выйти к C2; через правую — к D2. Оба узла помогают зажечь верхние дома."
    ],
    "en": [
      "A Shared Garden",
      "Neighbouring walkways share one network.",
      "A loop allows different ways to bring power in.",
      "Fixed D4 connects C4, E4 and D5. The left network can reach C2; the right reaches D2. Both junctions help light the upper homes."
    ]
  },
  {
    "n": 6,
    "d": 5,
    "p": [
      "A2 B2 C2 C3 D3 D4 C4 B4 B5 C5 D5 E5 E4 F4 F3 E3 D3 D2 E2 F2 F1",
      "A2 B2 C2 C3 D3 D4 C4 B4 B5 C5 C6 B6 A6"
    ],
    "u": {
      "D3": [
        3,
        12
      ]
    },
    "x": "D3 B4",
    "s": "B2:1 C2:2 C3:3 D4:1 C4:1 B5:2 C5:3 D5:1 E5:2 E4:3 F4:1 F3:2 E3:1 D2:3 E2:1 F2:2 C6:3 B6:1",
    "ru": [
      "Круглая аллея",
      "Большой круг возвращает свет к опоре.",
      "Не соединяйте между собой независимые дуги.",
      "Из D3 левый вход поворачивает вниз. Обойдите низ через B5 и E5, затем правый край через F4 и F3: возвращение по E3 открывает путь вверх к F1."
    ],
    "en": [
      "The Circular Walk",
      "A wide loop returns light to its support.",
      "Keep the independent arcs separate.",
      "At D3, the left entrance turns down. Go around the bottom through B5 and E5, then via F4 and F3: returning through E3 opens the upper route to F1."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "F3 E3 D3 C3 C2 D2 D1 E1 F1",
      "F3 E3 E4 D4 C4 B4 B3 A3 A2 A1",
      "F3 F4 F5 E5 D5 D6 C6 B6 A6"
    ],
    "x": "D3 C4",
    "s": "E3:1 C3:2 C2:3 D2:1 D1:2 E1:1 E4:2 D4:1 B4:3 B3:2 A3:1 A2:1 F4:1 F5:3 E5:1 D5:2 D6:3 C6:1 B6:1",
    "ru": [
      "Вечерний склон",
      "Три огня отмечают край сада.",
      "Станция может питать несколько независимых начальных веток.",
      "Нижняя линия от F3 начинается через F4. Левая линия доходит до E3 и делится: через D3 — к верхнему правому дому, через E4 — к верхнему левому."
    ],
    "en": [
      "Evening on the Slope",
      "Three lights mark the edge of the garden.",
      "The station can supply several separate starting branches.",
      "The lower line from F3 starts through F4. The left line reaches E3 and splits: D3 leads to the upper right home, E4 to the upper left one."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "C6 C5 B5 B4 C4 D4 D3 E3 F3 F2 E2 D2 C2 B2 A2 A1",
      "C6 C5 B5 B4 C4 C3 B3 A3 A4 A5 A6",
      "C6 C5 B5 B4 C4 D4 D3 C3 C2 C1 D1 E1 F1"
    ],
    "x": "B4 D4 E2",
    "s": "C5:1 B5:2 C4:3 D3:1 E3:1 F3:2 F2:3 D2:1 C2:2 B2:1 A2:3 C3:1 B3:1 A3:2 A4:1 A5:1 C1:3 D1:1 E1:1",
    "ru": [
      "Высокие деревья",
      "Свет проходит между высокими кронами.",
      "Сначала найдите неподвижные части общей сети.",
      "Соедините B4 с C4 и D4. От D3 один маршрут уходит вправо к F3, другой — через C3 и C2 к верхнему ряду. Левая ветка C3 ведёт к A6."
    ],
    "en": [
      "Tall Trees",
      "Light travels between the tall treetops.",
      "Find the fixed parts of the shared network first.",
      "Join B4 to C4 and D4. From D3, one route goes right to F3; another passes C3 and C2 to the top row. The left branch of C3 leads to A6."
    ]
  },
  {
    "n": 6,
    "d": 5,
    "p": [
      "A1 B1 C1 C2 D2 E2 E3 F3 F4 E4 D4 D5 C5 B5 A5 A6",
      "A1 B1 C1 C2 B2 B3 C3 C4 B4 A4 A3",
      "A1 B1 C1 C2 D2 E2 E3 F3 F4 E4 D4 C4 C3 D3 D2 D1 E1 F1"
    ],
    "x": "E3 C4",
    "s": "B1:1 C1:2 C2:3 D2:1 E2:2 F3:3 F4:1 E4:1 D4:2 D5:3 C5:1 B5:1 A5:2 B2:3 B3:1 C3:2 B4:1 A4:3 D3:2 D1:3 E1:1",
    "ru": [
      "Последний обход",
      "Осталось связать знакомые дорожки.",
      "Кольцо полезно только вместе с выходами к домам.",
      "У C2 начинается верхняя сеть. Сохраните выходы из D4 вниз к A6 и влево к C4. Верхний правый дом можно подключить через D2 и D1."
    ],
    "en": [
      "One Last Detour",
      "The familiar paths are ready to be joined.",
      "A loop is useful only when its homes are connected too.",
      "The upper network begins at C2. Keep exits from D4 down towards A6 and left towards C4. The upper right home can be reached through D2 and D1."
    ]
  },
  {
    "n": 6,
    "d": 5,
    "p": [
      "C3 C2 B2 B1 A1",
      "C3 D3 E3 E2 F2 F1",
      "C3 C4 B4 A4 A5 B5 B6 A6",
      "C3 D3 D4 E4 F4 F5 E5 E6 F6",
      "C3 C2 D2 D1 E1 F1"
    ],
    "x": "B2 E4",
    "s": "C2:1 B1:2 D3:3 E3:1 E2:2 F2:3 C4:2 B4:1 A4:3 A5:2 B5:1 B6:3 D4:1 F4:2 F5:3 E5:1 E6:2 D2:3 D1:1 E1:1",
    "ru": [
      "Праздник огней",
      "Все три района встречают общий вечер.",
      "Соедините дома, используя всё, чему научились.",
      "От станции идут три ветки: через C2, D3 и C4. Левая нижняя заканчивается у A6, правая — у F6. Дом F1 допускает подход через D1 или E2."
    ],
    "en": [
      "Festival of Lights",
      "All three districts share one evening.",
      "Use what you have learned to connect every home.",
      "Three branches leave the station through C2, D3 and C4. The lower left ends at A6, the lower right at F6. Home F1 can be approached through D1 or E2."
    ]
  }
];
  const dailyLayouts = [
  {
    "n": 4,
    "d": 2,
    "p": [
      "D4 C4 C3 B3 B2 C2 D2 D1",
      "D4 C4 C3 B3 A3 A2 A1"
    ],
    "s": "C4:1 C3:2 B3:3 B2:1 C2:1 D2:3 A3:2 A2:1",
    "district": 0,
    "ru": [
      "Письмо от соседей",
      "Сегодня свет ждут два дальних окна.",
      "Начните с общей середины пути.",
      "Проведите свет от C4 к B3. Отсюда левый путь идёт через A3 к A1, верхний — через B2 и D2 к D1."
    ],
    "en": [
      "A Letter from the Neighbours",
      "Two distant windows are waiting today.",
      "Start with the shared middle of the route.",
      "Bring light from C4 to B3. The left route goes through A3 to A1; the upper route passes B2 and D2 to D1."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "A1 B1 C1 C2 D2 D3 E3 E4 D4 C4 B4 B5 A5",
      "A1 B1 C1 C2 B2 B3 A3 A4"
    ],
    "s": "B1:1 C1:2 C2:3 D2:1 D3:2 E3:3 E4:1 D4:1 C4:1 B4:2 B5:3 B2:1 B3:2 A3:3",
    "district": 0,
    "ru": [
      "Вечерний обход",
      "Два окна завершают прогулку вокруг двора.",
      "Разделите короткую ветку и длинный обход.",
      "У C2 поверните одну ветку влево через B2 к A4. Вторая идёт через D2 и E4, затем возвращается по четвёртому ряду к A5."
    ],
    "en": [
      "An Evening Detour",
      "Two windows complete a walk around the courtyard.",
      "Separate the short branch from the long detour.",
      "At C2, send one branch left through B2 to A4. The other goes through D2 and E4, then returns along the fourth row to A5."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "E2 D2 C2 C3 B3 B4 C4 D4 E4 E5",
      "E2 D2 C2 B2 B1 A1",
      "E2 D2 C2 C3 D3 E3"
    ],
    "x": "B3",
    "s": "D2:1 C2:2 C3:3 B4:1 C4:1 D4:1 E4:2 B2:3 B1:2 D3:1",
    "district": 0,
    "ru": [
      "Три чайника",
      "В трёх домах скоро заварят чай.",
      "Одна общая линия питает близкие и дальние дома.",
      "Сначала подключите C2 и C3. От C2 есть путь к A1 через B2; от C3 — короткий к E3 и длинный через B4 к E5."
    ],
    "en": [
      "Three Kettles",
      "Tea will soon be ready in three homes.",
      "One shared line supplies nearby and distant homes.",
      "First connect C2 and C3. From C2, B2 leads to A1; from C3, a short route reaches E3 and a longer one goes through B4 to E5."
    ]
  },
  {
    "n": 5,
    "d": 4,
    "p": [
      "B5 B4 B3 C3 D3 D2 D1 C1 B1 A1 A2 A3 B3 B2",
      "B5 B4 B3 C3 D3 D2 D1 C1 B1 A1 A2 A3 A4 A5"
    ],
    "u": {
      "B3": [
        6,
        9
      ]
    },
    "x": "B3",
    "s": "B4:1 C3:1 D3:2 D2:1 D1:3 C1:1 B1:1 A1:2 A2:1 A3:3 A4:1",
    "district": 0,
    "ru": [
      "Окно у поворота",
      "До соседнего окна ведёт большой круг.",
      "У фиксированных дуг разные выходы.",
      "B3 отправляет питание снизу направо. Обход через D1 и A1 возвращает его слева; верхний выход зажигает B2. От A3 есть ещё ветка вниз."
    ],
    "en": [
      "The Window at the Turn",
      "A wide loop leads to the next window.",
      "The fixed arcs have separate exits.",
      "B3 turns power from below towards the right. A route through D1 and A1 returns from the left; the upper exit lights B2. A3 also has a lower branch."
    ]
  },
  {
    "n": 6,
    "d": 3,
    "p": [
      "A6 B6 C6 C5 B5 B4 C4 D4 D3 E3 F3 F2 E2 E1",
      "A6 B6 C6 C5 D5 E5 F5 F6"
    ],
    "x": "D4",
    "s": "B6:1 C6:2 C5:3 B5:1 B4:2 C4:1 D3:3 E3:1 F3:2 F2:1 E2:3 D5:1 E5:1 F5:2",
    "district": 0,
    "ru": [
      "Две прогулки",
      "Одна прогулка короткая, другая — вдоль огней.",
      "Соберите развилку до дальнего маршрута.",
      "Из C5 правая ветка ведёт через F5 к F6. Левая идёт через B4 и закреплённый D4, затем через F2 к E1."
    ],
    "en": [
      "Two Walks",
      "One walk is short; the other follows the lights.",
      "Build the junction before the distant route.",
      "From C5, the right branch goes through F5 to F6. The left uses B4 and fixed D4, then travels through F2 to E1."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "D1 D2 C2 B2 B3 A3 A4 B4 C4 D4 D5 E5",
      "D1 D2 E2 E3 E4",
      "D1 D2 C2 C1 B1 A1"
    ],
    "s": "D2:1 C2:2 B2:3 B3:1 A3:2 A4:3 B4:1 C4:1 D4:2 D5:3 E2:1 E3:1 C1:2 B1:1",
    "district": 1,
    "ru": [
      "Почта на углу",
      "Сегодня зажигаем почту и соседние окна.",
      "Верхнюю короткую ветку легко пропустить.",
      "У D2 соедините левую и правую ветки. У C2 есть выход вверх через C1 к A1; нижний обход через B3 и A4 ведёт к E5."
    ],
    "en": [
      "The Corner Post Office",
      "Today we light the post office and its neighbours.",
      "The short upper branch is easy to overlook.",
      "At D2, connect the left and right branches. C2 has an upper exit through C1 to A1; the lower route through B3 and A4 leads to E5."
    ]
  },
  {
    "n": 4,
    "d": 2,
    "p": [
      "B1 B2 C2 D2 D3 C3 B3 A3 A4",
      "B1 B2 A2 A1"
    ],
    "x": "C2",
    "s": "B2:1 D2:2 D3:3 C3:1 B3:1 A3:2 A2:3",
    "district": 1,
    "ru": [
      "Уличные повороты",
      "Небольшая задача для тихого вечера.",
      "Опора указывает направление длинной ветки.",
      "От B2 один путь идёт через A2 к A1. Другой проходит через закреплённый C2, огибает D2 и D3 и возвращается по третьему ряду к A4."
    ],
    "en": [
      "Street Corners",
      "A small puzzle for a quiet evening.",
      "A support points the way along the longer branch.",
      "From B2, one route goes through A2 to A1. The other crosses fixed C2, rounds D2 and D3, then returns along the third row to A4."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "F1 F2 E2 D2 C2 C3 D3 E3 E4 D4 C4 B4 B5 A5 A6",
      "F1 F2 E2 D2 C2 C3 B3 A3 A2 B2 B1 A1"
    ],
    "x": "D2 D4",
    "s": "F2:1 E2:1 C2:2 C3:3 D3:1 E3:2 E4:3 C4:1 B4:2 B5:3 A5:1 B3:1 A3:2 A2:3 B2:1 B1:2",
    "district": 1,
    "ru": [
      "Свет вдоль причала",
      "Длинная линия делится у самой воды.",
      "Ищите развилку между двумя фиксированными участками.",
      "Общая линия от F1 проходит через D2 к C3. Левая ветка ведёт через A3 к A1; правая через E4 и D4 возвращается вниз к A6."
    ],
    "en": [
      "Light Along the Pier",
      "A long line branches beside the water.",
      "Find the junction between the two fixed sections.",
      "The shared line from F1 passes D2 to C3. Its left branch goes through A3 to A1; the right passes E4 and D4 and returns down towards A6."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "A4 B4 C4 C3 D3 D2 E2 E1",
      "A4 B4 C4 C3 B3 B2 C2 C1",
      "A4 B4 C4 D4 E4 E5"
    ],
    "s": "B4:1 C4:2 C3:3 D3:1 D2:2 E2:3 B3:1 B2:2 C2:3 D4:1 E4:2",
    "district": 1,
    "ru": [
      "Три вечерних дела",
      "Свет нужен на трёх соседних дорожках.",
      "Две развилки делят работу между собой.",
      "C4 питает нижний правый дом через D4. C3 делится к верхним домам: вправо через D2 и влево через B2."
    ],
    "en": [
      "Three Evening Errands",
      "Three neighbouring paths need light.",
      "Two junctions share the work.",
      "C4 supplies the lower right home through D4. C3 branches to the upper homes: right through D2 and left through B2."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "C1 C2 D2 E2 E3 F3 F4 E4 D4 C4 B4 B3 C3 C2 B2 A2 A1"
    ],
    "u": {
      "C2": [
        3,
        12
      ]
    },
    "x": "C2",
    "s": "D2:1 E2:2 E3:3 F3:1 F4:2 E4:1 D4:1 C4:1 B4:3 B3:2 C3:1 B2:1 A2:3",
    "district": 1,
    "ru": [
      "Обратный билет",
      "Свет отправляется в путь и возвращается.",
      "Возврат нужен другой дуге того же узла.",
      "В C2 верх связан с правой стороной, а низ — с левой. Один обход идёт через F4 и B4 и возвращается по C3, после чего свет выходит к A1."
    ],
    "en": [
      "A Return Ticket",
      "Light sets off on a journey and comes back.",
      "The return route feeds the other arc of the same tile.",
      "At C2, top joins right and bottom joins left. One detour passes F4 and B4, returns through C3, then sends light towards A1."
    ]
  },
  {
    "n": 5,
    "d": 4,
    "p": [
      "E5 D5 C5 C4 B4 B3 C3 D3 D2 C2 B2 A2 A1",
      "E5 D5 C5 C4 D4 E4 E3 E2 E1",
      "E5 D5 C5 C4 B4 B3 A3 A4 A5"
    ],
    "x": "B4",
    "s": "D5:1 C5:2 C4:3 B3:1 C3:1 D3:2 D2:3 C2:1 B2:1 A2:2 D4:1 E4:3 E3:1 E2:1 A3:2 A4:1",
    "district": 2,
    "ru": [
      "Соседские окна",
      "Три окна на трёх концах улицы.",
      "Не теряйте короткую ветку у общей опоры.",
      "От C4 правая ветка идёт по краю E4–E2. Левая проходит через B4 к B3: оттуда короткий путь ведёт к A5, длинный через D2 — к A1."
    ],
    "en": [
      "Neighbouring Windows",
      "Three windows at three ends of the street.",
      "Keep the short branch beside the shared support.",
      "From C4, the right branch follows E4–E2. The left crosses B4 to B3: a short route reaches A5, while the longer one passes D2 towards A1."
    ]
  },
  {
    "n": 6,
    "d": 4,
    "p": [
      "A2 B2 B3 C3 C4 D4 E4 E3 F3 F2 E2 D2 D1 C1 B1 A1",
      "A2 B2 B3 C3 C4 C5 D5 E5 E6 F6",
      "A2 B2 B3 A3 A4 B4 B5 A5 A6"
    ],
    "x": "D2 C5",
    "s": "B2:1 B3:2 C3:1 C4:3 D4:1 E4:2 E3:3 F3:1 F2:2 E2:1 D1:3 C1:1 B1:1 D5:1 E5:2 E6:3 A3:1 A4:2 B4:3 B5:1 A5:2",
    "district": 2,
    "ru": [
      "Длинные аллеи",
      "У трёх домов разные пути домой.",
      "Две последовательные развилки упрощают большое поле.",
      "У B3 отделите левый нижний обход к A6. Ветка через C3 доходит до C4 и делится: вниз через C5 к F6 или вправо через E4 к верхнему левому дому."
    ],
    "en": [
      "Long Walkways",
      "Three homes have different ways home.",
      "Two successive junctions make a large board easier.",
      "At B3, separate the lower left route to A6. C3 reaches C4, which splits down through C5 to F6 or right through E4 towards the upper left home."
    ]
  },
  {
    "n": 5,
    "d": 3,
    "p": [
      "C5 C4 D4 D3 E3 E2 D2 C2 B2 B3 A3 A2 A1",
      "C5 C4 B4 A4 A5",
      "C5 C4 D4 D3 C3 C2 C1 D1 E1"
    ],
    "s": "C4:1 D4:2 D3:3 E3:1 E2:2 D2:1 C2:3 B2:2 B3:1 A3:3 A2:1 B4:1 A4:2 C3:1 C1:3 D1:1",
    "district": 2,
    "ru": [
      "Утро подождёт",
      "Пусть вечером остаются ещё три огонька.",
      "Общие участки могут соединить два обхода.",
      "От C4 короткая левая ветка ведёт к A5. Правая доходит до D3; через C3 и C2 доступен верхний ряд, через E3 и D2 — дальняя левая ветка."
    ],
    "en": [
      "Morning Can Wait",
      "Let three more lights stay on this evening.",
      "Shared sections can join two detours.",
      "From C4, the short left branch reaches A5. The right reaches D3: C3 and C2 lead to the top row, while E3 and D2 lead to the far left branch."
    ]
  },
  {
    "n": 6,
    "d": 5,
    "p": [
      "B1 B2 C2 C3 D3 E3 E4 D4 C4 B4 B5 C5 D5 D6 E6 F6",
      "B1 B2 A2 A3 B3 C3 D3 D2 E2 F2 F1",
      "B1 B2 C2 C3 D3 E3 E4 F4 F5 E5"
    ],
    "x": "C4 D2",
    "s": "B2:1 C2:2 C3:3 D3:1 E3:2 E4:3 D4:1 B4:2 B5:3 C5:1 D5:2 D6:3 E6:1 A2:1 A3:2 B3:1 E2:1 F2:3 F4:2 F5:1",
    "district": 2,
    "ru": [
      "Вечерняя открытка",
      "Три огонька складываются в маленькую открытку.",
      "Сначала свяжите общую линию, затем крайние ветки.",
      "Соедините B2 с C3 и D3. У D3 верхний выход идёт через D2 к F1, правый — к E4. От E4 ветки ведут к E5 и через B5 к F6."
    ],
    "en": [
      "An Evening Postcard",
      "Three lights make a little postcard.",
      "Connect the shared line before the outer branches.",
      "Join B2 to C3 and D3. At D3, the upper exit passes D2 to F1; the right leads to E4. From E4, branches reach E5 and, through B5, F6."
    ]
  }
];
  const coordinate = name => [Number(name.slice(1)) - 1, name.charCodeAt(0) - 65];
  const copy = values => ({ title:values[0], caption:values[1], lesson:values[2], hint:values[3] });
  const authored = (layout, id, district) => root.BlockEngine.build({
    id, version:1, size:layout.n, district, difficulty:layout.d,
    ...copy(layout.ru), locale:{ en:copy(layout.en) },
    routes:layout.p.map(path=>path.split(' ').map(coordinate)),
    locked:(layout.x||'').split(' ').filter(Boolean).map(coordinate),
    duals:Object.entries(layout.u||{}).map(([at,groups])=>({ at:coordinate(at), groups })),
    scramble:layout.s.split(' ').map(entry=>{
      const [at, turns] = entry.split(':');
      return [...coordinate(at),Number(turns)];
    })
  });
  const legacy = layouts.map((layout,i) => root.BlockEngine.build({
    id:i+1, version:1, size:layout.n, district:0, difficulty:legacyDifficulties[i],
    ...copy(words[i]), locale:{ en:copy(legacyEnglish[i]) },
    routes:layout.paths.map(path=>path.split(' ').map(coordinate)),
    locked:(layout.fixed||[]).map(coordinate),duals:(layout.dual||[]).map(at=>({at:coordinate(at)})),
    scramble:Object.entries(layout.off).map(([at,turns])=>[...coordinate(at),turns])
  }));
  root.BlockDistricts = Object.freeze([
  {
    "id": 0,
    "name": "Старый двор",
    "nameEn": "Old Courtyard",
    "caption": "Первый свет, знакомые окна и тихие тропинки.",
    "captionEn": "First lights, familiar windows and quiet paths."
  },
  {
    "id": 1,
    "name": "Набережная",
    "nameEn": "Riverside",
    "caption": "Обходы, общие линии и огни у воды.",
    "captionEn": "Detours, shared lines and lights by the water."
  },
  {
    "id": 2,
    "name": "Сады на холме",
    "nameEn": "Hilltop Gardens",
    "caption": "Длинные аллеи и связанные между собой маршруты.",
    "captionEn": "Long walkways and interconnected routes."
  }
].map(Object.freeze));
  root.BlockLevels = Object.freeze([...legacy, ...extraLayouts.map((layout,i)=>authored(layout,i+16,Math.floor((i+15)/20)))]);
  root.BlockDailies = Object.freeze(dailyLayouts.map((layout,i)=>authored(layout,1001+i,layout.district)));
})(globalThis);
