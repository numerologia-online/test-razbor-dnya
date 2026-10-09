import { parseBirthDate } from "./numerology-core.js?v=1";
import { getPersonalMonthLink } from "./personal-month-links.js?v=1";

// Авторская шкала 1–22: значения выше 22 приводятся повторным вычитанием 22.
// Не менять на сумму цифр: это другая методика и она исключает энергии 1 и 2.
const reduce22 = (value) => {
  let n = Math.abs(Math.trunc(Number(value) || 0));
  while (n > 22) n -= 22;
  return n || 22;
};

// Авторская формула выбора из 682 готовых текстов.
// Личные год, месяц и день рассчитываются в цикле 1–9, без смешения со шкалой 22 энергий.
// Период для выбора текста определяется календарным годом; месячные прогнозы не меняем.
const sumYearDigits = (year) => String(year).split("").reduce((sum, digit) => sum + Number(digit), 0);
const reduce9 = (value) => {
  let n = Math.abs(Math.trunc(Number(value) || 0));
  while (n > 9) n = String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);
  return n || 9;
};
const lifePathNumber = ({ day, month, year }) => {
  let n = sumYearDigits(day) + sumYearDigits(month) + sumYearDigits(year);
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);
  }
  return n;
};
const reduce31 = (value) => {
  let n = Math.abs(Math.trunc(Number(value) || 0));
  while (n > 31) n -= 31;
  return n || 31;
};
const personalDay = ({ day, month, year }, date = new Date()) => {
  const today = date.getDate();
  const currentMonth = date.getMonth() + 1;
  const currentYear = date.getFullYear();
  const personalYear = reduce9(day + month + sumYearDigits(currentYear));
  const personalMonth = reduce9(personalYear + currentMonth);
  const personalDayNumber = reduce9(personalMonth + today);
  const universalDay = reduce9(today + currentMonth + sumYearDigits(currentYear));
  const lifePath = lifePathNumber({ day, month, year });
  const energy = reduce22(personalDayNumber + personalMonth + universalDay + day + currentMonth);
  const personalNumber = reduce31(lifePath + day + today + sumYearDigits(year));
  return { energy, personalNumber };
};

// В старых банках энергии 1 ключи вида "1-1", в остальных — "1".
// Вторая цифра новой связки — персональная позиция, а не календарное число.
const findDayEntry = (entries, energy, personalNumber) =>
  entries?.[String(personalNumber)] ?? entries?.[`${energy}-${personalNumber}`];

const loadPersonalDay = async (birth, date = new Date()) => {
  const { energy, personalNumber } = personalDay(birth, date);
  const calendarDay = date.getDate();
  try {
    const response = await fetch(`./data/day/general/general-day-${String(energy).padStart(2, "0")}.json?v=8`);
    if (!response.ok) throw new Error("personal day bank unavailable");
    const bank = await response.json();
    const entry = findDayEntry(bank.entries, energy, personalNumber);
    let practical = null;
    try {
      const practicalResponse = await fetch(`./data/day/practical/practical-day-${String(energy).padStart(2, "0")}.json?v=4`);
      if (practicalResponse.ok) practical = await practicalResponse.json();
    } catch {}
    const advice = findDayEntry(practical?.entries, energy, personalNumber) || {};
    if (entry?.text) return { energy, personalNumber, calendarDay, text: entry.text, todayNeed: advice.todayNeed || [], todayAvoid: advice.todayAvoid || [] };
  } catch {}
  return {
    energy,
    personalNumber,
    calendarDay,
    text: "Не удалось загрузить текст дня. Обновите страницу и попробуйте ещё раз.",
    todayNeed: [],
    todayAvoid: [],
    loadError: true
  };
};

const esc = (value = "") => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const paragraphs = (items = []) => items.filter(Boolean).map((text) => `<p>${esc(text)}</p>`).join("");
const bullets = (items = []) => items.filter(Boolean).map((text) => `<li>${esc(text)}</li>`).join("");
const todayLabel = () => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
const monthTitle = (date) => new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(date);
const animateScroll = (node, targetTop, duration = 980) => {
  const startTop = node.scrollTop;
  const distance = targetTop - startTop;
  const startedAt = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 4);
    node.scrollTop = startTop + distance * eased;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const calendarInfo = (energy, personalNumber) => {
  const link = getPersonalMonthLink(energy, personalNumber);
  return link ? { ...link, label: link.group } : { status: "neutral", group: "", label: "" };
};
const monthMarkedDays = (birth, date = new Date()) => {
  const total = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const selected = new Map();
  for (let day = 1; day <= total; day += 1) {
    const { energy, personalNumber } = personalDay(birth, new Date(date.getFullYear(), date.getMonth(), day));
    const info = calendarInfo(energy, personalNumber);
    // Окрашиваем только заранее отмеченные сильные связки; остальные дни серые.
    if (info.status !== "neutral") selected.set(day, { day, energy, personalNumber, info });
  }
  return selected;
};
const monthCalendar = (birth, date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const total = new Date(year, month + 1, 0).getDate();
  const first = new Date(year, month, 1).getDay();
  const offset = (first + 6) % 7;
  const cells = [];
  const marked = monthMarkedDays(birth, date);
  for (let i = 0; i < offset; i += 1) cells.push('<span class="personal-month-empty"></span>');
  for (let day = 1; day <= total; day += 1) {
    const current = new Date(year, month, day);
    const { energy, personalNumber } = personalDay(birth, current);
    const info = marked.get(day)?.info || { status: "neutral", label: "" };
    cells.push(`<button type="button" class="personal-month-day personal-month-${info.status}" data-month-day="${day}" aria-label="День ${day}, ${esc(info.label || `личный день ${energy} · ${personalNumber}`)}">${day}</button>`);
  }
  return `<section class="personal-month-preview">
    <div class="personal-month-heading"><div><p class="personal-month-kicker">Карта ближайших дней</p><h3>${esc(monthTitle(date))}</h3></div><span class="personal-month-mark">✦</span></div>
    <div class="personal-month-weekdays">${["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((d) => `<span>${d}</span>`).join("")}</div>
    <div class="personal-month-grid">${cells.join("")}</div>
    <div class="personal-month-legend"><span><i class="personal-month-dot good"></i>Лучшие дни</span><span><i class="personal-month-dot chance"></i>Важные шансы</span><span><i class="personal-month-dot risk"></i>Дни риска</span></div>
    <button type="button" class="personal-month-open">Открыть разбор месяца <span>→</span></button>
    <section class="personal-month-details" hidden>
      
      <div class="personal-month-detail-list"></div>
    </section>
  </section>`;
};

export const openPersonalDay = () => {
  const shell = document.createElement("section");
  shell.className = "personal-day-overlay personal-day-page-overlay";
  shell.innerHTML = `<div class="personal-day-card personal-day-page" role="dialog" aria-modal="true"><button class="personal-day-close" type="button" aria-label="Закрыть">×</button><p class="eyebrow">Личный прогноз</p><h2>Ваш личный расчёт дня</h2><p class="personal-day-lead">Личный разбор дня подскажет, куда направить силы, какой шаг сделать, чего избегать, к каким чувствам прислушаться и какие тайны бережно хранит для вас этот день.</p><section class="personal-day-form-panel"><p class="personal-day-form-kicker">РАССЧИТАЙТЕ СВОЙ ЛИЧНЫЙ ДЕНЬ</p><p class="personal-day-date">Сегодня ${todayLabel()}</p><form><label><span>Дата рождения</span><input required type="tel" inputmode="numeric" autocomplete="bday" placeholder="09.09.1986" maxlength="10"></label><button class="personal-day-submit" type="submit" disabled>Рассчитать личный день</button><p class="personal-day-error" hidden></p></form></section><section class="personal-day-result" hidden></section></div>`;
  document.body.append(shell);
  const card = shell.querySelector(".personal-day-card");
  const form = shell.querySelector("form");
  const input = shell.querySelector("input");
  const submit = shell.querySelector("button[type=submit]");
  const result = shell.querySelector(".personal-day-result");
  shell.querySelector(".personal-day-close").onclick = () => shell.remove();
  input.addEventListener("input", () => {
    const digits = input.value.replace(/\D/g, "").slice(0, 8);
    input.value = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join(".");
    submit.disabled = digits.length !== 8;
  });
  form.onsubmit = async (event) => {
    event.preventDefault();
    const birth = parseBirthDate(input.value);
    const error = shell.querySelector(".personal-day-error");
    if (!birth) { error.hidden = false; error.textContent = "Введите дату в формате ДД.ММ.ГГГГ"; return; }
    error.hidden = true;
    submit.disabled = true;
    submit.textContent = "Считаю ваш день…";
    const item = await loadPersonalDay(birth);
    result.hidden = false;
    result.innerHTML = `<section class="personal-day-main"><span class="personal-day-code">${item.energy} · ${item.personalNumber}</span><p class="personal-day-label">ВАШ ДЕНЬ</p>${paragraphs([item.text])}${item.todayNeed?.length ? `<section class="personal-day-advice personal-day-need"><h4><span class="personal-day-advice-icon">✓</span> Сегодня нужно</h4><ul>${bullets(item.todayNeed)}</ul></section>` : ""}${item.todayAvoid?.length ? `<section class="personal-day-advice personal-day-avoid"><h4><span class="personal-day-advice-icon">×</span> Сегодня нельзя</h4><ul>${bullets(item.todayAvoid)}</ul></section>` : ""}</section>`;
    result.insertAdjacentHTML("beforeend", monthCalendar(birth));
    const monthDetails = result.querySelector(".personal-month-details");
    const monthList = result.querySelector(".personal-month-detail-list");
    const scrollToMonthDetails = () => requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetNode = monthList.querySelector(".personal-month-summary") || monthDetails;
        if (targetNode?.scrollIntoView) {
          targetNode.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        const cardTop = card.getBoundingClientRect().top;
        const detailsTop = monthDetails.getBoundingClientRect().top;
        const target = Math.max(0, card.scrollTop + detailsTop - cardTop - 12);
        animateScroll(card, target, 1120);
      });
    });
    result.querySelector(".personal-month-open")?.addEventListener("click", async (event) => {
      const monthButton = event.currentTarget;

      if (!monthDetails.hidden && monthList.dataset.ready && !monthList.dataset.loading) {
        monthDetails.hidden = true;
        monthButton.innerHTML = "Открыть разбор месяца <span>→</span>";
        return;
      }

      monthDetails.hidden = false;
      monthButton.innerHTML = "Скрыть разбор месяца <span>↑</span>";

      if (monthList.dataset.ready) {
        scrollToMonthDetails();
        return;
      }

      if (monthList.dataset.loading) return;
      monthList.dataset.loading = "1";
      monthButton.disabled = true;
      monthButton.innerHTML = "Готовлю разбор месяца… <span>↑</span>";
      scrollToMonthDetails();

      const pdfModuleLoading = import("./personal-month-pdf.js?v=5");
      pdfModuleLoading
        .then(({ warmPersonalMonthPdfEngine }) => warmPersonalMonthPdfEngine())
        .catch(() => {});

      try {
        const now = new Date();
        const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(now);
        const marked = monthMarkedDays(birth, now);
        const monthGenitive = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"][now.getMonth()];
        const groupLines = (status) => {
          const groups = new Map();
          marked.forEach(({ day, info }) => {
            if (info.status !== status) return;
            if (!groups.has(info.group)) groups.set(info.group, []);
            groups.get(info.group).push(day);
          });
          return [...groups.entries()].map(([group, dates]) =>
            "<span class=\"personal-month-summary-line\"><i>•</i><span><strong>" + esc(group) + "</strong><em>" + dates.join(", ") + " " + monthGenitive + "</em></span></span>"
          ).join("");
        };
        const summary = "<section class=\"personal-month-summary personal-month-summary-good\"><h4><span class=\"personal-month-summary-icon\">✓</span>Лучшие дни месяца</h4><div>" + groupLines("good") + "</div></section>" +
          "<section class=\"personal-month-summary personal-month-summary-risk\"><h4><span class=\"personal-month-summary-icon\">×</span>Дни риска</h4><div>" + groupLines("risk") + "</div></section>" +
          "<section class=\"personal-month-summary personal-month-summary-chance\"><h4><span class=\"personal-month-summary-icon\">★</span>Важные шансы</h4><div>" + groupLines("chance") + "</div></section>";

        monthList.innerHTML = summary + '<p class="personal-month-loading">Загружаю тексты дней…</p>';
        scrollToMonthDetails();

        const days = await Promise.all(Array.from({ length: total }, (_, index) => {
          const day = index + 1;
          return loadPersonalDay(birth, new Date(now.getFullYear(), now.getMonth(), day)).then((item) => ({
            day, item, info: calendarInfo(item.energy, item.personalNumber)
          }));
        }));

        const cards = days.map(({ day, item }) => {
          const info = marked.get(day)?.info || { status: "neutral", label: "Обычный день" };
          return `
            <details class="personal-month-day-card personal-month-detail-${info.status}">
              <summary aria-label="${day} ${monthName}"><strong>${day} ${monthName}</strong><b aria-hidden="true">+</b></summary>
              <div class="personal-month-day-content">
                <p>${esc(item.text)}</p>
                ${item.todayNeed?.length ? `<div class="personal-month-mini need"><strong>Сегодня нужно</strong><ul>${bullets(item.todayNeed)}</ul></div>` : ""}
                ${item.todayAvoid?.length ? `<div class="personal-month-mini avoid"><strong>Сегодня нельзя</strong><ul>${bullets(item.todayAvoid)}</ul></div>` : ""}
              </div>
            </details>`;
        }).join("");

        monthList.innerHTML = summary + `<h4 class="personal-month-all-title">Все дни месяца</h4>` + cards + '<button type="button" class="personal-month-pdf">Сохранить в PDF</button>';
        monthList.dataset.ready = "1";

        const preparePdfInBackground = () => pdfModuleLoading
          .then(({ preparePersonalMonthPdf }) => preparePersonalMonthPdf({ birth, monthDate: now, days }))
          .catch(() => {});

        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(preparePdfInBackground, { timeout: 900 });
        } else {
          window.setTimeout(preparePdfInBackground, 120);
        }

        monthList.querySelector(".personal-month-pdf")?.addEventListener("click", async (event) => {
          const button = event.currentTarget;
          const originalLabel = button.textContent;
          button.disabled = true;
          button.textContent = "Готовлю PDF…";
          try {
            const { downloadPersonalMonthPdf } = await pdfModuleLoading;
            await downloadPersonalMonthPdf({ birth, monthDate: now, days });
            button.textContent = "PDF готов ✓";
          } catch (error) {
            console.error(error);
            button.textContent = "Не удалось собрать PDF";
            alert("PDF пока не удалось подготовить. Проверьте подключение к интернету и попробуйте ещё раз.");
          } finally {
            window.setTimeout(() => {
              button.disabled = false;
              button.textContent = originalLabel;
            }, 1800);
          }
        });

        scrollToMonthDetails();
      } finally {
        delete monthList.dataset.loading;
        monthButton.disabled = false;
        monthButton.innerHTML = "Скрыть разбор месяца <span>↑</span>";
      }
    });
    
    result.querySelectorAll("[data-month-day]:not(.personal-month-locked)").forEach((button) => button.addEventListener("click", () => {
      const chosen = new Date(new Date().getFullYear(), new Date().getMonth(), Number(button.dataset.monthDay));
      const { energy, personalNumber } = personalDay(birth, chosen);
      alert(`Личный день ${energy} · ${personalNumber} уже рассчитан в вашем календаре.`);
    }));
    requestAnimationFrame(() => { animateScroll(card, Math.max(0, result.offsetTop - 16)); });
    submit.textContent = "Рассчитать личный день";
    submit.disabled = false;
  };
};
