# Indonesian Holiday Calendar

Indonesian public holidays and cuti bersama (collective leave), taken from the official SKB 3 Menteri decrees, for Claude. The plugin connects Claude to the calendar's remote MCP server, and in Claude Code it also shows the next holiday above the prompt and tells the model about upcoming holidays at the start of each conversation.

## What it adds

**Calendar tools**, from the remote MCP server at `https://husniadil.com/calendar/mcp`. They work in claude.ai chat, Cowork and Claude Code:

- `check_date`: whether a date is a holiday, a weekend or a working day.
- `next_holiday`: the next holidays after a date, across the year boundary.
- `get_holiday`: one holiday by its slug, with every date it spans.
- `find_holidays`: holidays by name keyword, category and date range.
- `show_calendar`: the holidays in a range of months, drawn as a calendar where the host renders MCP Apps.
- `find_long_weekends`: long-weekend opportunities and the leave days each one costs.
- `count_workdays`: working days between two dates.
- `calendar_info`: which years are covered, and whether each is an official decree or a prediction.

**A holiday band above the prompt**, in Claude Code only (the terminal, the IDE extensions and the desktop app's Code tab). The band is in Indonesian:

```text
◇ Libur berikutnya Cuti Bersama Natal  Kam 24 Des · 83 hari lagi   lalu Hari Raya Natal, Jum 25 Des
◆ Hari ini libur Hari Raya Natal   berikutnya Tahun Baru Masehi, 7 hari lagi
```

A narrow terminal gets a shorter line, such as `◇ Cuti Bersama Natal, 83 hari lagi`. When the server cannot be reached, the band says so in red.

**A context block for the model**, in Claude Code only: today's status (workday, weekend, holiday or cuti bersama) and the next three holidays, added to the first message of each conversation, so Claude knows them without calling a tool.

## What it sends and fetches

The plugin talks to one server, `https://husniadil.com/calendar/mcp`, run by the author of this plugin. In Claude Code the band calls `check_date` (with no arguments, meaning today in Jakarta) and `next_holiday` (asking for three holidays) when a session starts and then once an hour. Those calls carry no personal data, no file contents and no credentials. The tools Claude calls send only the dates, names or ranges in each call. The plugin stores nothing on disk. It keeps the last answer in memory for the session.

## Data

Holiday dates come from the SKB 3 Menteri decree for each year, as published by the Indonesian government. `calendar_info` says which years are official and which are predictions. The same data backs the calendar at [husniadil.com/calendar](https://husniadil.com/calendar).

## Development

```bash
claude plugin validate ./indonesian-holiday-calendar
claude plugin test ./indonesian-holiday-calendar
claude --plugin-dir ./indonesian-holiday-calendar
```

The band is a Claude Code mod: `hooks/register.tsx` registers the hooks, and `hooks/holidays.ts` reads the server's answers and builds the band and the context block. `tests/` runs against the Claude Code runtime with the server stubbed.

## License

MIT
