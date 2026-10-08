const PDF_SCRIPT = "https://cdn.jsdelivr.net/npm/pdfmake@0.2/build/pdfmake.min.js";
const PDF_FONTS = "https://cdn.jsdelivr.net/npm/pdfmake@0.2/build/vfs_fonts.js";

let pdfMakeLoading;

const loadScript = (src) => new Promise((resolve, reject) => {
  const existing = [...document.scripts].find((script) => script.src === src);
  if (existing) {
    if (window.pdfMake) return resolve();
    existing.addEventListener("load", resolve, { once: true });
    existing.addEventListener("error", reject, { once: true });
    return;
  }
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.onload = resolve;
  script.onerror = reject;
  document.head.append(script);
});

const getPdfMake = () => {
  if (window.pdfMake) return Promise.resolve(window.pdfMake);
  if (!pdfMakeLoading) {
    pdfMakeLoading = loadScript(PDF_SCRIPT)
      .then(() => loadScript(PDF_FONTS))
      .then(() => window.pdfMake);
  }
  return pdfMakeLoading;
};

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
];

const WEEKDAYS = [
  "ВОСКРЕСЕНЬЕ", "ПОНЕДЕЛЬНИК", "ВТОРНИК", "СРЕДА",
  "ЧЕТВЕРГ", "ПЯТНИЦА", "СУББОТА"
];

const STATUS = {
  good: {
    label: "Лучшие дни",
    color: "#466D73",
    soft: "#EAF3F2",
    border: "#B8D2D2",
    symbol: "✦"
  },
  chance: {
    label: "Важные шансы",
    color: "#9A702F",
    soft: "#F8F0DF",
    border: "#DCC792",
    symbol: "◇"
  },
  risk: {
    label: "Дни риска",
    color: "#8A5D62",
    soft: "#F6EBEB",
    border: "#DDBFC2",
    symbol: "!"
  },
  neutral: {
    label: "Обычный день",
    color: "#657484",
    soft: "#F3F1EC",
    border: "#D9D4C8",
    symbol: "·"
  }
};

const formatBirth = (birth) =>
  `${String(birth.day).padStart(2, "0")}.${String(birth.month).padStart(2, "0")}.${birth.year}`;

const coverBackground = () => ({
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
    <defs>
      <radialGradient id="paper" cx="42%" cy="18%" r="92%">
        <stop offset="0%" stop-color="#FFFDF8"/>
        <stop offset="62%" stop-color="#F8F2E7"/>
        <stop offset="100%" stop-color="#EEE3D2"/>
      </radialGradient>
      <linearGradient id="powder" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#DCEAF0"/>
        <stop offset="100%" stop-color="#C7DDE5"/>
      </linearGradient>
    </defs>
    <rect width="595" height="842" fill="url(#paper)"/>
    <rect x="20" y="20" width="555" height="802" rx="12" fill="none" stroke="#B78A3F" stroke-width=".8"/>
    <rect x="27" y="27" width="541" height="788" rx="10" fill="none" stroke="#D9C59F" stroke-width=".32"/>

    <g fill="none" stroke="#B78A3F" opacity=".30">
      <circle cx="297.5" cy="99" r="38" stroke-width=".5"/>
      <circle cx="297.5" cy="99" r="25" stroke-width=".35" stroke-dasharray="2 5"/>
      <path d="M297.5 50 V65 M297.5 133 V148 M249 99 H264 M331 99 H346" stroke-width=".45"/>
    </g>
    <g fill="#B78A3F" opacity=".55">
      <path d="M297.5 77 L301 89 L313 92.5 L301 96 L297.5 108 L294 96 L282 92.5 L294 89Z"/>
    </g>

    <!-- pale stacked calendar leaves on either side -->
    <g fill="#FFFDF9" stroke="#BCA174" stroke-width=".7" opacity=".16">
      <g transform="translate(40 332) rotate(-13)">
        <rect width="135" height="176" rx="8"/><path d="M0 33 H135" stroke-dasharray="2 5"/>
        <circle cx="28" cy="14" r="4" fill="#E2CC9D"/><circle cx="106" cy="14" r="4" fill="#E2CC9D"/>
      </g>
      <g transform="translate(438 333) rotate(12)">
        <rect width="132" height="175" rx="8"/><path d="M0 33 H132" stroke-dasharray="2 5"/>
        <circle cx="28" cy="14" r="4" fill="#E2CC9D"/><circle cx="104" cy="14" r="4" fill="#E2CC9D"/>
      </g>
      <g transform="translate(58 607) rotate(9)"><rect width="120" height="130" rx="7"/></g>
      <g transform="translate(433 605) rotate(-8)"><rect width="120" height="130" rx="7"/></g>
    </g>
    <g fill="#9D8049" font-family="Arial, sans-serif" text-anchor="middle" opacity=".07">
      <text x="102" y="448" font-size="68">07</text><text x="506" y="452" font-size="68">21</text>
      <text x="124" y="681" font-size="52">14</text><text x="483" y="682" font-size="52">30</text>
    </g>
    <g fill="#B78A3F" opacity=".42">
      <circle cx="297.5" cy="34" r="1.8"/><circle cx="288" cy="34" r=".9"/><circle cx="307" cy="34" r=".9"/>
      <circle cx="297.5" cy="808" r="1.8"/><circle cx="288" cy="808" r=".9"/><circle cx="307" cy="808" r=".9"/>
    </g>
  </svg>`
});

const innerBackground = () => ({
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
    <defs>
      <radialGradient id="innerPaper" cx="35%" cy="12%" r="96%">
        <stop offset="0%" stop-color="#FFFDF9"/>
        <stop offset="70%" stop-color="#FAF7F0"/>
        <stop offset="100%" stop-color="#F2EBDF"/>
      </radialGradient>
    </defs>
    <rect width="595" height="842" fill="url(#innerPaper)"/>
    <rect x="20" y="20" width="555" height="802" rx="10" fill="none" stroke="#B99151" stroke-width=".62"/>
    <rect x="27" y="27" width="541" height="788" rx="8" fill="none" stroke="#DCCDAF" stroke-width=".25"/>

    <g fill="none" stroke="#91B2C0" opacity=".065">
      <rect x="402" y="625" width="124" height="96" rx="4"/>
      <path d="M419.7 625 V721 M437.4 625 V721 M455.1 625 V721 M472.8 625 V721 M490.5 625 V721 M508.2 625 V721"/>
      <path d="M402 644.2 H526 M402 663.4 H526 M402 682.6 H526 M402 701.8 H526"/>
    </g>

    <!-- vintage pages and weekday traces, behind the reading area -->
    <g transform="translate(492 123) rotate(12)" stroke="#90ADB7" stroke-width=".62" opacity=".10">
      <rect x="-29" y="-34" width="91" height="125" rx="5" fill="#FFFEFB"/>
      <rect x="-20" y="-25" width="91" height="125" rx="5" fill="#FFFDF8"/>
      <rect x="-11" y="-16" width="91" height="125" rx="5" fill="#FFFDF8"/>
      <path d="M-11 8 H80" stroke-dasharray="2 5"/>
      <path d="M5 29 H64 M5 49 H64 M5 69 H64 M25 21 V80 M48 21 V80" opacity=".76"/>
      <circle cx="8" cy="-4" r="4" fill="#C4AC7F"/>
      <circle cx="61" cy="-4" r="4" fill="#C4AC7F"/>
    </g>
    <g transform="translate(29 565) rotate(-9)" fill="#FFFDF9" stroke="#B79D76" stroke-width=".53" opacity=".085">
      <rect x="0" y="0" width="117" height="143" rx="6"/>
      <path d="M0 27 H117" stroke-dasharray="2 5"/>
      <path d="M20 49 H97 M20 70 H97 M20 91 H97 M20 112 H97" opacity=".70"/>
    </g>
    <g font-family="Georgia, serif" fill="#AA905E" opacity=".16" text-anchor="middle">
      <text x="297.5" y="808" font-size="12" letter-spacing="5">9 · 9 · 6 · 6</text>
    </g>
    <g fill="#C29B58" opacity=".20">
      <circle cx="297.5" cy="34" r="1.6"/><circle cx="289" cy="34" r=".8"/><circle cx="306" cy="34" r=".8"/>
    </g>
  </svg>`
});

const coverFront = ({ month, year, birth, monthIndex }) => {
  const monthText = String(month).toUpperCase();
  const birthText = formatBirth(birth);
  const first = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const total = new Date(year, monthIndex + 1, 0).getDate();
  const dates = Array.from({ length: total }, (_, i) => {
    const cell = first + i;
    const x = 99 + (cell % 7) * 45;
    const y = 395 + Math.floor(cell / 7) * 26;
    return `<text x="${x}" y="${y}" font-size="14" fill="#4F6875" opacity=".75">${i + 1}</text>`;
  }).join("");
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="470" height="675" viewBox="0 0 470 675">
      <defs><linearGradient id="goldCover" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#946620"/><stop offset="50%" stop-color="#D8B470"/><stop offset="100%" stop-color="#966A29"/>
      </linearGradient></defs>
      <g text-anchor="middle">
        <circle cx="235" cy="45" r="28" stroke="#C4A76C" fill="none" stroke-width=".65" opacity=".8"/>
        <circle cx="235" cy="45" r="21" stroke="#D5C29D" fill="none" stroke-width=".4" stroke-dasharray="2 5"/>
        <path d="M235 20 L239 39 L257 45 L239 51 L235 70 L231 51 L213 45 L231 39Z" fill="#BE9B5C" opacity=".76"/>
        <text x="235" y="103" font-family="Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="3" fill="#986D32">НУМЕРОЛОГИЯ ONLINE</text>
        <text x="235" y="155" font-family="Georgia, serif" font-size="26" fill="#1C3B51">ЛИЧНЫЙ КАЛЕНДАРЬ</text>
        <path d="M88 174 H200 M270 174 H382" stroke="#BA9658" stroke-width=".7"/>
        <path d="M235 168 L239 174 L235 180 L231 174Z" fill="#BA9658"/>
        <text x="235" y="250" font-family="Georgia, serif" font-size="56" font-weight="700" fill="#1B3B50">${monthText}</text>
        <text x="237" y="328" font-family="Georgia, serif" font-size="75" fill="#D9C49A" opacity=".55">${year}</text>
        <text x="235" y="325" font-family="Georgia, serif" font-size="75" font-weight="700" fill="url(#goldCover)">${year}</text>
      </g>
      <rect x="54" y="360" width="362" height="173" rx="9" fill="#FFFDF9" stroke="#C4AA7E" stroke-width=".8"/>
      <rect x="54" y="360" width="362" height="28" rx="9" fill="#DFEBEC"/>
      <rect x="54" y="378" width="362" height="10" fill="#DFEBEC"/>
      <path d="M70 388 H400" stroke="#C1A273" stroke-width=".5" stroke-dasharray="2 5"/>
      <g fill="#FFFDF8" stroke="#C2A16B" stroke-width=".85">
        <circle cx="105" cy="367" r="5"/><circle cx="364" cy="367" r="5"/>
      </g>
      <g text-anchor="middle" font-family="Arial, sans-serif">
        <g font-size="10" font-weight="700" fill="#587783">
          <text x="99" y="379">ПН</text><text x="144" y="379">ВТ</text><text x="189" y="379">СР</text>
          <text x="234" y="379">ЧТ</text><text x="279" y="379">ПТ</text><text x="324" y="379">СБ</text><text x="369" y="379">ВС</text>
        </g>
        <g font-family="Georgia, serif">${dates}</g>
      </g>
      <g text-anchor="middle" font-family="Arial, sans-serif">
        <text x="235" y="565" font-size="17" font-weight="700" fill="#274153">Дата рождения · ${birthText}</text>
        <text x="235" y="608" font-size="16.5" fill="#536D7C">Ваш месяц — день за днём</text>
        <text x="235" y="637" font-size="13" fill="#8B7145">Прогнозы · важные шансы · дни риска</text>
      </g>
    </svg>`,
    width: 470, height: 675, alignment: "center"
  };
};

const groupByStatus = (days, status) => {
  const groups = new Map();
  days.forEach(({ day, info }) => {
    if (info?.status !== status) return;
    const label = info.group || STATUS[status].label;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(day);
  });
  return [...groups.entries()];
};

const summaryCard = (days, status, monthIndex) => {
  const palette = STATUS[status];
  const groups = groupByStatus(days, status);
  if (!groups.length) return null;
  return {
    table: {
      widths: ["*"],
      body: [[{
        fillColor: palette.soft,
        margin: [18, 16, 18, 16],
        stack: [
          {
            columns: [
              { text: palette.symbol, width: 28, color: palette.color, bold: true, fontSize: 20, alignment: "center" },
              { text: palette.label.toUpperCase(), color: palette.color, bold: true, fontSize: 18, margin: [5, 1, 0, 0] }
            ],
            margin: [0, 0, 0, 9]
          },
          ...groups.map(([label, dates]) => ({
            stack: [
              { text: label, bold: true, color: "#304657", fontSize: 17, margin: [0, 5, 0, 2] },
              { text: `${dates.join(", ")} ${MONTHS_GENITIVE[monthIndex]}`, color: "#687685", fontSize: 15.5 }
            ]
          }))
        ]
      }]]
    },
    layout: {
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
      hLineColor: () => palette.border,
      vLineColor: () => palette.border
    },
    margin: [0, 0, 0, 14]
  };
};

const adviceBox = (title, items, type) => {
  if (!items?.length) return null;
  const need = type === "need";
  return {
    table: {
      widths: ["*"],
      body: [[{
        fillColor: need ? "#ECF3F3" : "#F6EEEE",
        margin: [16, 13, 16, 13],
        stack: [
          {
            text: title,
            bold: true,
            color: need ? "#466D73" : "#8A5D62",
            fontSize: 15,
            characterSpacing: .6,
            margin: [0, 0, 0, 7]
          },
          {
            ul: items,
            color: "#293F50",
            fontSize: 15.5,
            lineHeight: 1.32,
            margin: [7, 0, 0, 0]
          }
        ]
      }]]
    },
    layout: {
      hLineWidth: () => 0.45,
      vLineWidth: () => 0.45,
      hLineColor: () => need ? "#BCD0D0" : "#DABFC2",
      vLineColor: () => need ? "#BCD0D0" : "#DABFC2"
    },
    margin: [0, 8, 0, 0]
  };
};

const dayHeader = ({ day, monthIndex, year, energy, weekday }) => ({
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="466" height="183" viewBox="0 0 466 183">
    <defs><linearGradient id="dayTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E5F0F1"/><stop offset="100%" stop-color="#D4E5E9"/>
    </linearGradient></defs>
    <rect x="1" y="1" width="464" height="181" rx="10" fill="#FFFDF9" stroke="#C6A46A" stroke-width=".75"/>
    <path d="M1 10 Q1 1 11 1 H455 Q465 1 465 10 V50 H1 Z" fill="url(#dayTop)"/>
    <path d="M20 50 H446" stroke="#BFA06D" stroke-width=".7" stroke-dasharray="2 4"/>
    <g fill="#FFFDF9" stroke="#B99151" stroke-width=".9"><circle cx="64" cy="16" r="6"/><circle cx="402" cy="16" r="6"/></g>
    <g font-family="Arial, sans-serif" text-anchor="middle">
      <text x="233" y="33" font-size="16" font-weight="700" letter-spacing="2" fill="#496A76">${weekday}</text>
      <text x="233" y="125" font-size="78" font-weight="700" fill="#1C3B51">${day}</text>
      <text x="233" y="152" font-size="15" font-weight="700" letter-spacing="2" fill="#926B30">${MONTHS_GENITIVE[monthIndex].toUpperCase()} · ${year}</text>
      <text x="233" y="173" font-size="13" fill="#536E78">ЛИЧНЫЙ ДЕНЬ ${energy}</text>
    </g></svg>`,
  width: 466, height: 183, alignment: "center"
});

const dayPage = ({ day, item, info }, monthIndex, year) => {
  const status = info?.status || "neutral";
  const palette = STATUS[status] || STATUS.neutral;
  const specialLabel = status === "neutral" ? "" : (info?.group || palette.label);
  const weekday = WEEKDAYS[new Date(year, monthIndex, day).getDay()];
  const forecast = String(item.text || "").trim();
  const parts = forecast ? forecast.split(/\n\s*\n/).filter(Boolean) : ["Текст дня пока недоступен."];
  return {
    // Flow days continuously: a new date does not force a blank remainder on the previous page.
    margin: [0, 18, 0, 10],
    stack: [
      { ...dayHeader({ day, monthIndex, year, energy: item.energy, weekday }), margin: [0, 0, 0, 18] },
      ...(specialLabel ? [{ text: specialLabel, fontSize: 16, bold: true, color: palette.color, alignment: "center", margin: [0, 0, 0, 14] }] : []),
      ...parts.map((part) => ({ text: part, fontSize: 19, color: "#263D4D", lineHeight: 1.38, margin: [5, 0, 5, 17] })),
      ...(item.todayNeed?.length ? [adviceBox("СЕГОДНЯ НУЖНО", item.todayNeed, "need")] : []),
      ...(item.todayAvoid?.length ? [adviceBox("СЕГОДНЯ НЕЛЬЗЯ", item.todayAvoid, "avoid")] : [])
    ]
  };
};

const buildDocument = ({ birth, monthDate, days }) => {
  const monthIndex = monthDate.getMonth();
  const year = monthDate.getFullYear();
  const month = MONTHS[monthIndex];
  const summary = ["good", "chance", "risk"]
    .map((status) => summaryCard(days, status, monthIndex))
    .filter(Boolean);

  return {
    info: {
      title: `Личный календарь · ${month} ${year} · ${formatBirth(birth)}`,
      subject: "Персональный нумерологический разбор месяца"
    },
    pageSize: "A4",
    pageMargins: [62, 66, 62, 66],
    background: (page) => page === 1 ? coverBackground() : innerBackground(),
    defaultStyle: { font: "Roboto", color: "#34495A" },
    styles: {
      coverBrand: { fontSize: 11.5, bold: true, color: "#9A702F", characterSpacing: 2.2, alignment: "center" },
      coverTitle: { fontSize: 21, bold: true, color: "#19364E", alignment: "center", characterSpacing: 1.3 },
      coverMonth: { fontSize: 49, bold: true, color: "#19364E", alignment: "center", lineHeight: 1.0 },
      coverYear: { fontSize: 67, bold: true, color: "#9A702F", alignment: "center", lineHeight: 1.0 },
      coverDate: { fontSize: 15.5, bold: true, color: "#5B6E79", alignment: "center" },
      coverCopy: { fontSize: 14.5, color: "#687985", alignment: "center", lineHeight: 1.38 },
      kicker: { fontSize: 13, bold: true, color: "#9A702F", characterSpacing: 1.35, alignment: "center" },
      pageTitle: { fontSize: 34, bold: true, color: "#19364E", alignment: "center", margin: [0, 0, 0, 12] },
      pageLead: { fontSize: 17, color: "#496372", alignment: "center", lineHeight: 1.4, margin: [8, 0, 8, 24] }
    },
    content: [
      { ...coverFront({ month, year, birth, monthIndex }), pageBreak: "after" },
      { text: "ВАШ МЕСЯЦ В ОДНОМ ВЗГЛЯДЕ", style: "kicker" },
      { text: "Главные даты месяца", style: "pageTitle" },
      {
        text: "Сначала сохраните ориентиры месяца, а дальше листайте его как личный календарь — день за днём.",
        style: "pageLead"
      },
      ...summary,
      ...days.map((day) => dayPage(day, monthIndex, year))
    ],
    footer: (page, pages) => page === 1 ? null : ({
      text: `Нумерология Онлайн · ${page - 1} / ${pages - 1}`,
      alignment: "center",
      color: "#9A8661",
      fontSize: 8.5,
      margin: [0, 11, 0, 0]
    })
  };
};

let preparedPdf = null;
let preparedPdfKey = "";
let preparingPdf = null;
let preparingPdfKey = "";

const getPdfKey = ({ birth, monthDate }) =>
  `${formatBirth(birth)}|${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;

export const warmPersonalMonthPdfEngine = () => getPdfMake();

export const preparePersonalMonthPdf = ({ birth, monthDate, days }) => {
  const key = getPdfKey({ birth, monthDate });
  if (preparedPdf && preparedPdfKey === key) return Promise.resolve(preparedPdf);
  if (preparingPdf && preparingPdfKey === key) return preparingPdf;

  preparingPdfKey = key;
  preparingPdf = (async () => {
    const pdfMake = await getPdfMake();
    if (!Array.isArray(days) || !days.length || days.some(({ item }) => !item || typeof item.text !== "string" || !item.text.trim())) throw new Error("Неполные тексты календаря");
    const definition = buildDocument({ birth, monthDate, days });
    const blob = await new Promise((resolve) => pdfMake.createPdf(definition).getBlob(resolve));
    const url = URL.createObjectURL(blob);
    const filename = `Личный календарь ${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()} · ${formatBirth(birth)}.pdf`;

    if (preparedPdf?.url && preparedPdf.url !== url) URL.revokeObjectURL(preparedPdf.url);
    preparedPdf = { url, filename };
    preparedPdfKey = key;
    return preparedPdf;
  })().finally(() => {
    preparingPdf = null;
    preparingPdfKey = "";
  });

  return preparingPdf;
};

export const downloadPersonalMonthPdf = async ({ birth, monthDate, days }) => {
  const { url, filename } = await preparePersonalMonthPdf({ birth, monthDate, days });
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
};
