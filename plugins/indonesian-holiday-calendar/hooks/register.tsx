// The holiday band: the next Indonesian holiday above the prompt, and the
// same facts in the model's first context block, read from the calendar MCP
// at husniadil.com/calendar/mcp, the server this plugin's manifest lists.

import { atom, read, update } from "claude-code";
import type { EngineInterface, Register } from "claude-code";

import type { HolidayReading } from "../types";
import { answerOf, bandRuns, contextText, readingFrom } from "./holidays";
import type { Run } from "./holidays";

const HOUR = 60 * 60 * 1000;

// The calendar server's key under `mcpServers` in .claude-plugin/plugin.json.
// The site's src/lib/mcp/claude-plugin.test.ts holds the two together.
const MANIFEST_SERVER = "calendar";

const reading = atom(
  { plugin: "indonesian-holiday-calendar", key: "reading" } as const,
  null,
);
const failure = atom(
  { plugin: "indonesian-holiday-calendar", key: "failure" } as const,
  null,
);

/** Registers the band, its hourly refresh and the context block. */
export const register: Register = (on) => {
  on("session.start", async ($, e, next) => {
    const result = await next(e);
    // Off the start path, so the first prompt never waits on the network.
    // Hourly, so the band moves past midnight without a restart.
    $.clock.after(0, () => void refresh($));
    $.clock.every(HOUR, () => void refresh($));
    return result;
  });

  on("prompt.context", async ($, e, next) => {
    const result = await next(e);
    const r = (await read($, reading)) ?? (await refresh($));
    if (r === null) return result;
    return {
      ...result,
      blocks: [
        ...result.blocks,
        { name: "indonesianHolidays", text: contextText(r) },
      ],
    };
  });

  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e);
    const r = await read($, reading);
    const failed = await read($, failure);
    if (r === null && failed === null) return next(e);

    const runs: Run[] =
      r === null
        ? [{ text: `◇ Info libur gagal dimuat: ${failed}`, color: "red" }]
        : bandRuns(r, e.props.bodyColumns);
    const { Box, Text } = $.ui.resolve(e);
    return (
      <Box flexDirection="row" paddingX={1}>
        {runs.map((run) => (
          <Text color={run.color} bold={run.bold} dimColor={run.dim}>
            {run.text}
          </Text>
        ))}
      </Box>
    );
  });
};

// A stale reading stays on screen when a later refresh fails; the failure
// shows only while there is nothing else to show.
async function refresh($: EngineInterface): Promise<HolidayReading | null> {
  try {
    // The manifest's server, or the name the session already runs it under.
    const calendar = await $.mcp.connect(MANIFEST_SERVER);
    if (!calendar.isConnected)
      throw new Error(`calendar MCP: ${calendar.message}`);
    const [today, upcoming] = await Promise.all([
      $.mcp.call(calendar.server, "check_date"),
      $.mcp.call(calendar.server, "next_holiday", { count: 3 }),
    ]);
    const r = readingFrom(
      answerOf(today, "check_date"),
      answerOf(upcoming, "next_holiday"),
    );
    await update($, reading, () => r);
    await update($, failure, () => null);
    return r;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await update($, failure, () => message);
    return null;
  }
}
