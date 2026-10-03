// The calendar MCP's answers read into a HolidayReading, and the reading
// turned into the band's runs (Indonesian, for the person) and the model's
// context block (English, for the model). Pure.

import type { McpToolResult } from "claude-code";

import type { HolidayDay, HolidayReading, HolidayToday } from "../types";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const BULAN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export type Run = {
  text: string;
  color?: string;
  bold?: boolean;
  dim?: boolean;
};

/**
 * A tool's result as data: the structured result when the tool declares an
 * output schema, else the JSON its text block carries.
 */
export function answerOf(result: McpToolResult, tool: string): unknown {
  const text = result.content.find((block) => block.type === "text")?.text;
  if (result.isError)
    throw new Error(`${tool}: ${text ?? "the server reported a failure"}`);
  if (result.structuredContent !== undefined) return result.structuredContent;
  if (text === undefined) throw new Error(`${tool}: the answer has no text`);
  return JSON.parse(text);
}

/** `check_date` and `next_holiday` answers, checked, as one reading. */
export function readingFrom(
  checkDate: unknown,
  nextHoliday: unknown,
): HolidayReading {
  const today = record(checkDate, "check_date");
  const next = record(nextHoliday, "next_holiday");
  const upcoming = next.upcoming;
  if (!Array.isArray(upcoming))
    throw new Error("next_holiday: no upcoming list");

  const day: HolidayToday = {
    date: field(today, "date", "string", "check_date"),
    isoWeekday: field(today, "isoWeekday", "number", "check_date"),
    isHoliday: field(today, "is_holiday", "boolean", "check_date"),
    isWeekend: field(today, "is_weekend", "boolean", "check_date"),
    isCollectiveLeave: field(
      today,
      "is_collective_leave",
      "boolean",
      "check_date",
    ),
    holidayName:
      typeof today.holiday_name === "string" ? today.holiday_name : null,
  };
  return {
    today: day,
    upcoming: upcoming.map((item): HolidayDay => {
      const h = record(item, "next_holiday");
      return {
        date: field(h, "date", "string", "next_holiday"),
        name: field(h, "name", "string", "next_holiday"),
        daysUntil: field(h, "daysUntil", "number", "next_holiday"),
        isCollectiveLeave: field(
          h,
          "isCollectiveLeave",
          "boolean",
          "next_holiday",
        ),
      };
    }),
  };
}

/** The band's runs, sized to the columns the band has. */
export function bandRuns(r: HolidayReading, columns: number): Run[] {
  const [first, second] = r.upcoming;
  if (r.today.isHoliday) {
    const runs: Run[] = [
      { text: "◆ Hari ini libur ", color: "yellow", bold: true },
      { text: r.today.holidayName ?? "", bold: true },
    ];
    if (first && columns >= 80)
      runs.push({
        text: `   berikutnya ${first.name}, ${soon(first.daysUntil)}`,
        dim: true,
      });
    return runs;
  }
  if (!first) return [{ text: "◇ Belum ada data libur berikutnya", dim: true }];
  if (columns < 60)
    return [
      { text: `◇ ${first.name}, ${soon(first.daysUntil)}`, color: "yellow" },
    ];

  const runs: Run[] = [
    { text: "◇ Libur berikutnya ", color: "yellow", bold: true },
    { text: first.name, bold: true },
    {
      text: `  ${shortDay(first.date)} · ${soon(first.daysUntil)}`,
      dim: true,
    },
  ];
  if (second && columns >= 100)
    runs.push({
      text: `   lalu ${second.name}, ${shortDay(second.date)}`,
      dim: true,
    });
  return runs;
}

/** The reading as the context block the model's first message carries. */
export function contextText(r: HolidayReading): string {
  const t = r.today;
  const status = t.isCollectiveLeave
    ? `cuti bersama (${t.holidayName})`
    : t.isHoliday
      ? `a public holiday (${t.holidayName})`
      : t.isWeekend
        ? "a weekend"
        : "a workday";
  const upcoming = r.upcoming
    .map(
      (h) =>
        `${h.date} ${h.name} (${h.isCollectiveLeave ? "cuti bersama, " : ""}${inDays(h.daysUntil)})`,
    )
    .join("; ");
  return [
    `Today in Indonesia is ${WEEKDAYS[t.isoWeekday % 7]} ${t.date}, ${status}.`,
    `Upcoming holidays: ${upcoming || "none in the data"}.`,
    "From the husniadil.com calendar MCP (SKB 3 Menteri). Its Calendar tools answer anything further.",
  ].join("\n");
}

function soon(daysUntil: number): string {
  if (daysUntil === 0) return "hari ini";
  if (daysUntil === 1) return "besok";
  return `${daysUntil} hari lagi`;
}

function inDays(daysUntil: number): string {
  if (daysUntil === 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  return `in ${daysUntil} days`;
}

function shortDay(date: string): string {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  return `${HARI[day.getUTCDay()]} ${d} ${BULAN[m - 1]}`;
}

function record(value: unknown, tool: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null)
    throw new Error(`${tool}: the answer is not an object`);
  return value as Record<string, unknown>;
}

function field<K extends "string" | "number" | "boolean">(
  obj: Record<string, unknown>,
  key: string,
  kind: K,
  tool: string,
): K extends "string" ? string : K extends "number" ? number : boolean {
  const value = obj[key];
  if (typeof value !== kind)
    throw new Error(`${tool}: ${key} is not a ${kind}`);
  return value as K extends "string"
    ? string
    : K extends "number"
      ? number
      : boolean;
}
