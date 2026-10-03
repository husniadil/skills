export type HolidayDay = {
  date: string;
  name: string;
  daysUntil: number;
  isCollectiveLeave: boolean;
};

export type HolidayToday = {
  date: string;
  isoWeekday: number;
  isHoliday: boolean;
  isWeekend: boolean;
  isCollectiveLeave: boolean;
  holidayName: string | null;
};

export type HolidayReading = { today: HolidayToday; upcoming: HolidayDay[] };

declare module "claude-code" {
  interface PluginState {
    "indonesian-holiday-calendar": {
      reading: HolidayReading | null;
      failure: string | null;
    };
  }
}
