import { describe, expect, mock, test } from "claude-code/testing";
import type { TestBody } from "claude-code/testing";
import type { On } from "claude-code";

const PLUGIN = "indonesian-holiday-calendar";

const WORKDAY = {
  date: "2026-10-02",
  dayOfWeek: "Jum",
  isoWeekday: 5,
  daysFromToday: 0,
  is_holiday: false,
  is_weekend: false,
  is_workday: true,
  is_collective_leave: false,
  holiday_name: null,
};

const CHRISTMAS = {
  ...WORKDAY,
  date: "2026-12-25",
  is_holiday: true,
  is_workday: false,
  holiday_name: "Hari Raya Natal",
};

const UPCOMING = {
  from: "2026-10-02",
  upcoming: [
    {
      date: "2026-12-24",
      name: "Cuti Bersama Natal",
      isCollectiveLeave: true,
      daysUntil: 83,
    },
    {
      date: "2026-12-25",
      name: "Hari Raya Natal",
      isCollectiveLeave: false,
      daysUntil: 84,
    },
    {
      date: "2027-01-01",
      name: "Tahun Baru Masehi",
      isCollectiveLeave: false,
      daysUntil: 91,
    },
  ],
};

const AFTER_CHRISTMAS = {
  from: "2026-12-25",
  upcoming: [
    {
      date: "2027-01-01",
      name: "Tahun Baru Masehi",
      isCollectiveLeave: false,
      daysUntil: 7,
    },
  ],
};

const BAND = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 120,
};

const SERVER = `plugin:${PLUGIN}:calendar`;

function calendar(on: On, today: object, upcoming: object = UPCOMING) {
  const calls: string[] = [];
  on("mcp.connect", ($, e) => {
    calls.push(`connect ${e.server}`);
    return { value: { isConnected: true, server: SERVER } };
  });
  on("mcp.call", ($, e) => {
    calls.push(`${e.server} ${e.tool}`);
    return {
      value: {
        content: [
          {
            type: "text",
            text: JSON.stringify(e.tool === "check_date" ? today : upcoming),
          },
        ],
        isError: false,
      },
    };
  });
  return calls;
}

async function band(
  $: Parameters<TestBody>[0],
  on: On,
  surface: "terminal" | "desktop",
  bodyColumns = 120,
) {
  const clock = mock.clock(on);
  on("session.start", ($, e) => ({ cwd: e.cwd }));
  await $.session.start({ surface, isInteractive: true, cwd: "/work" } as any);
  await clock.settle();
  return $.ui.mount({
    plugin: PLUGIN,
    surface,
    component: "AbovePrompt",
    props: { ...BAND, bodyColumns },
  } as any);
}

describe(PLUGIN, () => {
  for (const surface of ["terminal", "desktop"] as const) {
    test(`the band names the next holiday on ${surface}`, async ($, on) => {
      const calls = calendar(on, WORKDAY);
      const ui = await band($, on, surface);

      // "calendar" is the key under mcpServers in .claude-plugin/plugin.json.
      expect(calls).toEqual([
        "connect calendar",
        `${SERVER} check_date`,
        `${SERVER} next_holiday`,
      ]);
      expect(
        await ui.find({ type: "Text", text: /Libur berikutnya/ }),
      ).toBeDefined();
      expect(
        await ui.find({ type: "Text", text: /^Cuti Bersama Natal$/ }),
      ).toBeDefined();
      expect(
        await ui.find({ type: "Text", text: /Kam 24 Des · 83 hari lagi/ }),
      ).toBeDefined();
      expect(
        await ui.find({
          type: "Text",
          text: /lalu Hari Raya Natal, Jum 25 Des/,
        }),
      ).toBeDefined();
      await ui.unmount();
    });

    test(`on a holiday the band says so on ${surface}`, async ($, on) => {
      calendar(on, CHRISTMAS, AFTER_CHRISTMAS);
      const ui = await band($, on, surface);

      expect(
        await ui.find({ type: "Text", text: /Hari ini libur/ }),
      ).toBeDefined();
      expect(
        await ui.find({ type: "Text", text: /^Hari Raya Natal$/ }),
      ).toBeDefined();
      expect(
        await ui.find({
          type: "Text",
          text: /berikutnya Tahun Baru Masehi, 7 hari lagi/,
        }),
      ).toBeDefined();
      await ui.unmount();
    });
  }

  test("a narrow band keeps only the next holiday", async ($, on) => {
    calendar(on, WORKDAY);
    const ui = await band($, on, "terminal", 50);

    expect(
      await ui.find({
        type: "Text",
        text: /^◇ Cuti Bersama Natal, 83 hari lagi$/,
      }),
    ).toBeDefined();
    expect(await ui.find({ type: "Text", text: /lalu/ })).toBeUndefined();
    await ui.unmount();
  });

  test("the first context block carries the holidays", async ($, on) => {
    calendar(on, WORKDAY);
    on("prompt.context", ($, e) => ({ blocks: e.blocks }));

    const { blocks } = await $.prompt.context({ blocks: [] });
    const block = blocks.find((b) => b.name === "indonesianHolidays");

    expect(block?.text).toContain(
      "Today in Indonesia is Friday 2026-10-02, a workday.",
    );
    expect(block?.text).toContain(
      "2026-12-24 Cuti Bersama Natal (cuti bersama, in 83 days)",
    );
    expect(block?.text).toContain("2027-01-01 Tahun Baru Masehi (in 91 days)");
  });

  test("a failing server shows in the band", async ($, on) => {
    on("mcp.connect", () => ({ value: { isConnected: true, server: SERVER } }));
    on("mcp.call", () => ({
      value: {
        content: [{ type: "text", text: "upstream timed out" }],
        isError: true,
      },
    }));
    const ui = await band($, on, "terminal");

    expect(
      await ui.find({
        type: "Text",
        text: /Info libur gagal dimuat: check_date: upstream timed out/,
      }),
    ).toBeDefined();
    await ui.unmount();
  });

  test("a refused connection shows in the band", async ($, on) => {
    on("mcp.connect", () => ({
      value: {
        isConnected: false,
        reason: "policy",
        message: "An administrator turned this server off.",
      },
    }));
    const ui = await band($, on, "terminal");

    expect(
      await ui.find({
        type: "Text",
        text: /Info libur gagal dimuat: calendar MCP: An administrator turned this server off\./,
      }),
    ).toBeDefined();
    await ui.unmount();
  });
});
