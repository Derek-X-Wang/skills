#!/usr/bin/env -S BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 bun

import { Database } from "bun:sqlite";
import { statSync } from "node:fs";
import { opendir, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

type Harness = "claude-code" | "codex" | "opencode";
type CoverageState = "supported" | "absent" | "unsupported-schema" | "unreadable";
type Command = "doctor" | "search" | "inspect";

type HarnessCoverage = {
  harness: Harness;
  state: CoverageState;
  schemaId?: string;
  reasonCode?: string;
};

type Envelope<T> = {
  command: Command | null;
  contractVersion: 1;
  coverage: {
    complete: boolean;
    harnesses: HarnessCoverage[];
  };
  data: T | null;
  status: "complete" | "partial" | "blocked" | "error";
  warnings: Array<{ code: string; message: string }>;
};

type BoundsReport = {
  bytesRead: number;
  elapsedMs: number;
  exhausted: string[];
  filesRead: number;
  maxBytes: number;
  maxFiles: number;
  maxMillis: number;
  maxMessages: number;
  maxResults: number;
  messagesRead: number;
  recordsSkipped: number;
};

type SearchSignal = { code: string; query?: string };

type NormalizedSession = {
  archived?: boolean;
  branch?: string;
  cwd: string;
  harness: Harness;
  key: string;
  preview?: string;
  sessionId: string;
  sourceKind?: string;
  updatedAt?: string;
};

type SearchMatch = {
  rank: number;
  score: number;
  session: NormalizedSession;
  signals: SearchSignal[];
};

type SearchData = {
  bounds: BoundsReport;
  contentTrust: "untrusted-transcript";
  matches: SearchMatch[];
  queries: string[];
  scope: { cwd: string; kind: "project" };
};

type SearchAdapterResult = {
  ambiguousSessionCount?: number;
  bounds: BoundsReport;
  matches: SearchMatch[];
  schemaObserved?: boolean;
};

type RedactedExcerpt = {
  locator: string;
  ordinal: number;
  redacted: boolean;
  role: "user" | "assistant";
  text: string;
  truncated: boolean;
};

type InspectBounds = {
  bytesRead: number;
  charactersReturned: number;
  elapsedMs: number;
  exhausted: string[];
  filesRead: number;
  maxBytes: number;
  maxCharacters: number;
  maxFiles: number;
  maxMillis: number;
  maxMessages: number;
  messagesRead: number;
  recordsSkipped: number;
};

type InspectData = {
  bounds: InspectBounds;
  contentTrust: "untrusted-transcript";
  excerpts: RedactedExcerpt[];
  references: { commits: string[]; files: string[]; issues: string[] };
  session: NormalizedSession;
};

const MAX_FILES = 500;
const MAX_BYTES = 16 * 1024 * 1024;
const MAX_QUERIES = 8;
const MAX_QUERY_BYTES = 1_024;
const MAX_TOTAL_QUERY_BYTES = 4_096;
const MAX_RESULTS = 20;
const MAX_RECORDS = 256;
const MAX_SEARCH_MESSAGES = 5_000;
const MAX_INSPECT_CHARACTERS = 12_000;
const MAX_INSPECT_MESSAGES = 250;
const MAX_MILLIS = 5_000;
const CLAUDE_PREFLIGHT_BYTES = 64 * 1024;
const HARNESSES: Harness[] = ["claude-code", "codex", "opencode"];
const SAFE_SESSION_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

type TranscriptMessage = {
  locator: string;
  role: "user" | "assistant";
  text: string;
};

type SearchLimits = {
  maxBytes: number;
  maxFiles: number;
  maxMessages: number;
  maxMillis: number;
};

class InputError extends Error {}

class StoreEscapeError extends Error {}

class DiscoveryBoundError extends Error {}

class LiveSqliteSidecarError extends Error {}

class BlockedError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function elapsedSince(startedAt: number): number {
  return Math.max(0, Math.round((performance.now() - startedAt) * 100) / 100);
}

async function assertNativePath(home: string, path: string): Promise<string> {
  const relation = relative(home, path);
  if (relation.startsWith("..") || isAbsolute(relation)) {
    throw new StoreEscapeError("Native store path escapes the approved home");
  }
  const [resolvedHome, resolvedPath] = await Promise.all([realpath(home), realpath(path)]);
  const expectedPath = join(resolvedHome, relation);
  if (resolvedPath !== expectedPath) {
    throw new StoreEscapeError(
      "Native store path contains a symlink or escapes its expected location",
    );
  }
  return resolvedPath;
}

function claudeProjectDirectory(home: string, cwd: string): string {
  return join(home, ".claude", "projects", cwd.replace(/[\\/]/g, "-"));
}

async function listClaudeJsonl(
  home: string,
  cwdCandidates: readonly string[],
  maxFiles = MAX_FILES,
): Promise<string[]> {
  const files = new Set<string>();
  for (const cwd of new Set(cwdCandidates)) {
    const projectDirectory = claudeProjectDirectory(home, cwd);
    if (await pathExists(projectDirectory)) {
      await assertNativePath(home, projectDirectory);
    }
    for (const file of await listJsonl(
      projectDirectory,
      Math.max(0, maxFiles - files.size),
    )) {
      files.add(file);
      if (files.size >= maxFiles) break;
    }
    if (files.size >= maxFiles) break;
  }
  return Array.from(files).sort();
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function containsJsonl(directory: string): Promise<boolean> {
  if (!(await pathExists(directory))) {
    return false;
  }

  const pending = [directory];
  const startedAt = performance.now();
  let entriesSeen = 0;
  while (pending.length > 0) {
    if (entriesSeen >= 10_000 || elapsedSince(startedAt) >= 1_000) {
      throw new DiscoveryBoundError("Session-store discovery bound was exhausted");
    }
    const current = pending.pop()!;
    for await (const entry of await opendir(current)) {
      if (entriesSeen >= 10_000 || elapsedSince(startedAt) >= 1_000) {
        throw new DiscoveryBoundError("Session-store discovery bound was exhausted");
      }
      entriesSeen += 1;
      if (entry.isDirectory()) {
        pending.push(join(current, entry.name));
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        return true;
      }
    }
    if (elapsedSince(startedAt) >= 1_000) {
      throw new DiscoveryBoundError("Session-store discovery bound was exhausted");
    }
  }
  return false;
}

async function listJsonl(directory: string, maxFiles = MAX_FILES): Promise<string[]> {
  if (!(await pathExists(directory))) {
    return [];
  }

  const files: string[] = [];
  const pending = [directory];
  const startedAt = performance.now();
  let entriesSeen = 0;
  while (pending.length > 0 && files.length < maxFiles) {
    if (entriesSeen >= 20_000 || elapsedSince(startedAt) >= MAX_MILLIS) {
      throw new DiscoveryBoundError("Session-store enumeration bound was exhausted");
    }
    const current = pending.pop()!;
    const entries = [];
    for await (const entry of await opendir(current)) {
      if (entriesSeen >= 20_000 || elapsedSince(startedAt) >= MAX_MILLIS) {
        throw new DiscoveryBoundError("Session-store enumeration bound was exhausted");
      }
      entriesSeen += 1;
      entries.push(entry);
    }
    if (elapsedSince(startedAt) >= MAX_MILLIS) {
      throw new DiscoveryBoundError("Session-store enumeration bound was exhausted");
    }
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(path);
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        files.push(path);
        if (files.length >= maxFiles) {
          break;
        }
      }
    }
  }
  return files.sort();
}

function assertNoLiveSqliteSidecar(path: string): void {
  for (const suffix of ["-wal", "-journal"]) {
    try {
      if (statSync(`${path}${suffix}`).size > 0) {
        throw new LiveSqliteSidecarError(
          "A live SQLite sidecar cannot be included without touching native store state",
        );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

function openImmutableDatabase(path: string): Database {
  assertNoLiveSqliteSidecar(path);
  const separator = pathToFileURL(path).href.includes("?") ? "&" : "?";
  const database = new Database(
    `${pathToFileURL(path).href}${separator}mode=ro&immutable=1`,
    { readonly: true, strict: true },
  );
  database.exec("PRAGMA query_only = ON");
  database.exec("PRAGMA temp_store = MEMORY");
  return database;
}

function closeImmutableDatabase(database: Database, path: string): void {
  database.close(false);
  assertNoLiveSqliteSidecar(path);
}

function sqliteTables(path: string): Set<string> {
  const database = openImmutableDatabase(path);
  try {
    const rows = database
      .query<{ name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      )
      .all();
    return new Set(rows.map((row) => row.name));
  } finally {
    closeImmutableDatabase(database, path);
  }
}

function sqliteColumns(path: string, table: string): Set<string> {
  if (!/^[a-z0-9_]+$/i.test(table)) {
    throw new Error("Unsafe internal SQLite table name");
  }
  const database = openImmutableDatabase(path);
  try {
    const rows = database
      .query<{ name: string }, []>(`PRAGMA table_info(${table})`)
      .all();
    return new Set(rows.map((row) => row.name));
  } finally {
    closeImmutableDatabase(database, path);
  }
}

function sqlitePrimaryKeyColumns(path: string, table: string): Set<string> {
  if (!/^[a-z0-9_]+$/i.test(table)) {
    throw new Error("Unsafe internal SQLite table name");
  }
  const database = openImmutableDatabase(path);
  try {
    const rows = database
      .query<{ name: unknown; pk: unknown }, []>(`PRAGMA table_info(${table})`)
      .all();
    return new Set(
      rows
        .filter(
          (row): row is { name: string; pk: number } =>
            typeof row.name === "string" &&
            typeof row.pk === "number" &&
            Number.isSafeInteger(row.pk) &&
            row.pk > 0,
        )
        .sort((left, right) => left.pk - right.pk)
        .map((row) => row.name),
    );
  } finally {
    closeImmutableDatabase(database, path);
  }
}

function sqliteTableHasRows(path: string, table: string): boolean {
  if (!/^[a-z0-9_]+$/i.test(table)) {
    throw new Error("Unsafe internal SQLite table name");
  }
  const database = openImmutableDatabase(path);
  try {
    return database.query(`SELECT 1 FROM ${table} LIMIT 1`).get() !== null;
  } finally {
    closeImmutableDatabase(database, path);
  }
}

function hasColumns(actual: Set<string>, required: readonly string[]): boolean {
  return required.every((column) => actual.has(column));
}

function setsEqual<T>(left: Set<T>, right: Set<T>): boolean {
  return left.size === right.size && Array.from(left).every((value) => right.has(value));
}

function discoveryReason(error: unknown): string {
  if (error instanceof StoreEscapeError) return "store_root_escape";
  if (error instanceof DiscoveryBoundError) return "discovery_bound_exhausted";
  if (error instanceof LiveSqliteSidecarError) return "live_sqlite_sidecar_excluded";
  return "unreadable_store";
}

const CODEX_THREAD_COLUMNS = [
  "id",
  "cwd",
  "title",
  "first_user_message",
  "preview",
  "git_branch",
  "recency_at_ms",
  "history_mode",
  "rollout_path",
  "thread_source",
  "agent_path",
  "archived",
] as const;

const OPENCODE_SESSION_COLUMNS = [
  "id",
  "project_id",
  "workspace_id",
  "parent_id",
  "directory",
  "title",
  "time_created",
  "time_updated",
  "time_archived",
] as const;
const OPENCODE_PROJECT_COLUMNS = ["id"] as const;
const OPENCODE_MESSAGE_COLUMNS = ["id", "session_id", "time_created", "data"] as const;
const OPENCODE_PART_COLUMNS = ["id", "message_id", "time_created", "data"] as const;

async function detectClaude(home: string): Promise<HarnessCoverage> {
  try {
    const projects = join(home, ".claude", "projects");
    if (await pathExists(projects)) await assertNativePath(home, projects);
    if (await containsJsonl(projects)) {
      return {
        harness: "claude-code",
        schemaId: "claude-project-jsonl-v1",
        state: "supported",
      };
    }
    return { harness: "claude-code", state: "absent" };
  } catch (error) {
    return {
      harness: "claude-code",
      reasonCode: discoveryReason(error),
      state: "unreadable",
    };
  }
}

async function detectCodex(home: string): Promise<HarnessCoverage> {
  const codexHome = join(home, ".codex");
  const stateDatabase = join(codexHome, "state_5.sqlite");
  try {
    if (await pathExists(stateDatabase)) {
      await assertNativePath(home, stateDatabase);
      try {
        assertNoLiveSqliteSidecar(stateDatabase);
      } catch (error) {
        if (!(error instanceof LiveSqliteSidecarError)) throw error;
        const sessions = join(codexHome, "sessions");
        if (await pathExists(sessions)) await assertNativePath(home, sessions);
        if (await containsJsonl(sessions)) {
          return {
            harness: "codex",
            reasonCode: "live_sqlite_sidecar_excluded",
            schemaId: "codex-rollout-jsonl-v1",
            state: "supported",
          };
        }
        throw error;
      }
      const tables = sqliteTables(stateDatabase);
      if (
        tables.has("threads") &&
        hasColumns(sqliteColumns(stateDatabase, "threads"), CODEX_THREAD_COLUMNS) &&
        setsEqual(sqlitePrimaryKeyColumns(stateDatabase, "threads"), new Set(["id"]))
      ) {
        return {
          harness: "codex",
          schemaId: "codex-state-v5",
          state: "supported",
        };
      }
      const sessions = join(codexHome, "sessions");
      if (await pathExists(sessions)) await assertNativePath(home, sessions);
      if (await containsJsonl(sessions)) {
        return {
          harness: "codex",
          reasonCode: "unsupported_state_schema_excluded",
          schemaId: "codex-rollout-jsonl-v1",
          state: "supported",
        };
      }
      return {
        harness: "codex",
        reasonCode: "unsupported_schema",
        state: "unsupported-schema",
      };
    }

    const sessions = join(codexHome, "sessions");
    if (await pathExists(sessions)) await assertNativePath(home, sessions);
    if (await containsJsonl(sessions)) {
      return {
        harness: "codex",
        schemaId: "codex-rollout-jsonl-v1",
        state: "supported",
      };
    }
    return { harness: "codex", state: "absent" };
  } catch (error) {
    return {
      harness: "codex",
      reasonCode: discoveryReason(error),
      state: "unreadable",
    };
  }
}

async function detectOpenCode(home: string): Promise<HarnessCoverage> {
  const path = join(home, ".local", "share", "opencode", "opencode.db");
  try {
    if (!(await pathExists(path))) {
      return { harness: "opencode", state: "absent" };
    }

    await assertNativePath(home, path);

    const tables = sqliteTables(path);
    for (const candidate of ["session_message", "session_input"]) {
      if (tables.has(candidate) && sqliteTableHasRows(path, candidate)) {
        return {
          harness: "opencode",
          reasonCode: "untested_populated_schema",
          state: "unsupported-schema",
        };
      }
    }
    if (
      tables.has("session") &&
      tables.has("project") &&
      tables.has("message") &&
      tables.has("part") &&
      hasColumns(sqliteColumns(path, "session"), OPENCODE_SESSION_COLUMNS) &&
      hasColumns(sqliteColumns(path, "project"), OPENCODE_PROJECT_COLUMNS) &&
      hasColumns(sqliteColumns(path, "message"), OPENCODE_MESSAGE_COLUMNS) &&
      hasColumns(sqliteColumns(path, "part"), OPENCODE_PART_COLUMNS) &&
      setsEqual(sqlitePrimaryKeyColumns(path, "session"), new Set(["id"])) &&
      setsEqual(sqlitePrimaryKeyColumns(path, "project"), new Set(["id"])) &&
      setsEqual(sqlitePrimaryKeyColumns(path, "message"), new Set(["id"])) &&
      setsEqual(sqlitePrimaryKeyColumns(path, "part"), new Set(["id"]))
    ) {
      return {
        harness: "opencode",
        schemaId: "opencode-sqlite-session-message-part-v1",
        state: "supported",
      };
    }
    return {
      harness: "opencode",
      reasonCode: "unsupported_schema",
      state: "unsupported-schema",
    };
  } catch (error) {
    return {
      harness: "opencode",
      reasonCode: discoveryReason(error),
      state: "unreadable",
    };
  }
}

function parseHome(args: string[]): string {
  const homeIndex = args.indexOf("--home");
  const home = homeIndex === -1 ? process.env.HOME : args[homeIndex + 1];
  if (!home || !isAbsolute(home)) {
    throw new InputError("--home must resolve to an absolute path");
  }
  return home;
}

function requestedHarnesses(args: string[]): {
  harnesses: Harness[];
  required: boolean;
} {
  const values = flagValues(args, "--harness");
  if (values.length === 0) {
    return { harnesses: HARNESSES, required: false };
  }
  if (values.some((value) => !HARNESSES.includes(value as Harness))) {
    throw new InputError("--harness must be claude-code, codex, or opencode");
  }
  const selected = HARNESSES.filter((harness) => values.includes(harness));
  return { harnesses: selected, required: true };
}

async function coverage(
  home: string,
  selected: readonly Harness[] = HARNESSES,
): Promise<HarnessCoverage[]> {
  const detectors: Record<Harness, (home: string) => Promise<HarnessCoverage>> = {
    "claude-code": detectClaude,
    codex: detectCodex,
    opencode: detectOpenCode,
  };
  return Promise.all(selected.map((harness) => detectors[harness](home)));
}

function warningsFor(harnesses: HarnessCoverage[]) {
  const incomplete = harnesses.filter(
    (item) => item.state !== "supported" || item.reasonCode !== undefined,
  );
  if (incomplete.length === 0) {
    return [];
  }
  return [
    {
      code: "incomplete_coverage",
      message: `${incomplete
        .map((item) =>
          `${item.harness}=${item.state}${
            item.state === "supported" && item.reasonCode
              ? `(${item.reasonCode})`
              : ""
          }`,
        )
        .join("; ")}.`,
    },
  ];
}

function coverageIsComplete(harnesses: HarnessCoverage[]): boolean {
  return harnesses.every(
    (item) => item.state === "supported" && item.reasonCode === undefined,
  );
}

function requiredHarnessWarning(harnesses: HarnessCoverage[]) {
  const unavailable = harnesses.filter((item) => item.state !== "supported");
  return [
    {
      code: "required_harness_unavailable",
      message: `${unavailable
        .map((item) => `${item.harness}=${item.state}`)
        .join("; ")}.`,
    },
  ];
}

function markAdapterUnreadable(harnesses: HarnessCoverage[], harness: Harness): void {
  const item = harnesses.find((coverage) => coverage.harness === harness);
  if (!item) return;
  item.state = "unreadable";
  item.reasonCode = "adapter_read_failed";
  delete item.schemaId;
}

function recordsSkippedWarning(count: number) {
  if (count === 0) return [];
  return [
    {
      code: "records_skipped",
      message: `${count} malformed or untested ${count === 1 ? "record was" : "records were"} skipped.`,
    },
  ];
}

async function doctor(args: string[]): Promise<Envelope<null>> {
  validateOptions("doctor", args);
  const home = parseHome(args);
  const request = requestedHarnesses(args);
  const harnesses = await coverage(home, request.harnesses);
  const complete = coverageIsComplete(harnesses);
  const requiredUnavailable =
    request.required && harnesses.some((item) => item.state !== "supported");
  return {
    command: "doctor",
    contractVersion: 1,
    coverage: { complete, harnesses },
    data: null,
    status: complete ? "complete" : requiredUnavailable ? "blocked" : "partial",
    warnings: complete
      ? []
      : requiredUnavailable
        ? requiredHarnessWarning(harnesses)
        : warningsFor(harnesses),
  };
}

function flagValues(args: string[], flag: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flag && args[index + 1] !== undefined) {
      values.push(args[index + 1]);
      index += 1;
    }
  }
  return values;
}

function validateOptions(command: Command, args: string[]): void {
  const allowed: Record<Command, Set<string>> = {
    doctor: new Set(["--harness", "--home"]),
    inspect: new Set(["--cwd", "--harness", "--home", "--session"]),
    search: new Set(["--cwd", "--harness", "--home", "--max-results", "--query"]),
  };
  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];
    if (!allowed[command].has(option)) {
      throw new InputError(`Unknown ${command} option: ${option}`);
    }
    if (args[index + 1] === undefined) {
      throw new InputError(`${option} requires a value`);
    }
  }
  for (const single of ["--cwd", "--home", "--max-results", "--session"]) {
    if (flagValues(args, single).length > 1) {
      throw new InputError(`${single} may be provided only once`);
    }
  }
}

function requiredFlag(args: string[], flag: string): string {
  const values = flagValues(args, flag);
  if (values.length !== 1 || values[0].length === 0) {
    throw new InputError(`${flag} must be provided exactly once`);
  }
  return values[0];
}

function parseMaxResults(args: string[]): number {
  const values = flagValues(args, "--max-results");
  if (values.length === 0) {
    return 10;
  }
  if (values.length !== 1) {
    throw new InputError("--max-results may be provided only once");
  }
  const value = Number(values[0]);
  if (!Number.isInteger(value) || value < 1 || value > MAX_RESULTS) {
    throw new InputError(`--max-results must be an integer from 1 to ${MAX_RESULTS}`);
  }
  return value;
}

function extractText(content: unknown): { texts: string[]; unknownBlocks: number } {
  if (typeof content === "string") {
    return { texts: [content], unknownBlocks: 0 };
  }
  if (!Array.isArray(content)) {
    return { texts: [], unknownBlocks: 1 };
  }
  const texts: string[] = [];
  let unknownBlocks = 0;
  for (const block of content) {
    if (
      block &&
      typeof block === "object" &&
      !("schemaVersion" in block) &&
      (block as { type?: unknown }).type === "text" &&
      typeof (block as { text?: unknown }).text === "string"
    ) {
      texts.push((block as { text: string }).text);
      continue;
    }
    if (
      block &&
      typeof block === "object" &&
      !("schemaVersion" in block) &&
      ((block as { type?: unknown }).type === "thinking" ||
        (block as { type?: unknown }).type === "tool_use")
    ) {
      continue;
    }
    unknownBlocks += 1;
  }
  return { texts, unknownBlocks };
}

function codexProjectionText(
  itemType: string,
  item: { content?: unknown; schemaVersion?: unknown; text?: unknown },
): { role: "assistant" | "user"; texts: string[]; unknownBlocks: number } | undefined {
  if (item.schemaVersion !== undefined) return undefined;
  if (
    itemType === "userMessage" &&
    (typeof item.content === "string" || Array.isArray(item.content))
  ) {
    return { role: "user", ...extractText(item.content) };
  }
  if (itemType === "agentMessage" && typeof item.text === "string") {
    return { role: "assistant", texts: [item.text], unknownBlocks: 0 };
  }
  return undefined;
}

function openCodeProjection(
  message: { role?: unknown; schemaVersion?: unknown },
  part: { schemaVersion?: unknown; text?: unknown; type?: unknown },
): { role: "assistant" | "user"; text?: string } | undefined {
  if (
    message.schemaVersion !== undefined ||
    part.schemaVersion !== undefined ||
    (message.role !== "user" && message.role !== "assistant")
  ) {
    return undefined;
  }
  if (part.type === "tool") return { role: message.role };
  if (part.type === "text" && typeof part.text === "string") {
    return { role: message.role, text: part.text };
  }
  return undefined;
}

function redact(value: string): string {
  return value
    .replace(
      /-----BEGIN [^-\r\n]*PRIVATE KEY-----[\s\S]*?-----END [^-\r\n]*PRIVATE KEY-----/gi,
      "[REDACTED PRIVATE KEY]",
    )
    .replace(
      /(["']?(?:Set-)?Cookie["']?\s*:\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\r\n,}]+)/gi,
      "$1[REDACTED]",
    )
    .replace(
      /(["']?Authorization["']?\s*:\s*["']?(?:Bearer|Basic)\s+)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s"']+)/gi,
      "$1[REDACTED]",
    )
    .replace(
      /(\bBearer\s+)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s"']+)/gi,
      "$1[REDACTED]",
    )
    .replace(
      /\b(?:gh[pousr]_[A-Za-z0-9_]{16,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{16,})\b/g,
      "[REDACTED]",
    )
    .replace(/\b(?:xox[a-z]-|xapp-)[A-Za-z0-9-]{8,}\b/gi, "[REDACTED]")
    .replace(/\b(?:glpat-|npm_)[A-Za-z0-9_-]{16,}\b/gi, "[REDACTED]")
    .replace(/\bAIza[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]")
    .replace(/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g, "[REDACTED]")
    .replace(
      /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
      "[REDACTED]",
    )
    .replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, "[REDACTED]")
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/:@]+:[^\s/@]+@/gi, "$1[REDACTED]@")
    .replace(
      /\b([A-Z][A-Z0-9_]*(?:TOKEN|SECRET_ACCESS_KEY|SECRET_KEY|ACCESS_KEY|PRIVATE_KEY|SECRET|PASSWORD|PASSWD|API_KEY))\s*=\s*(["'])[^\r\n]*?\2/gi,
      "$1=[REDACTED]",
    )
    .replace(
      /(["'](?:[A-Za-z][A-Za-z0-9_-]*[_-])?(?:token|secret[_-](?:access[_-])?key|access[_-]?key|private[_-]?key|secret|password|passwd|api[_-]?key)["']\s*:\s*)(["'])[^\r\n]*?\2/gi,
      "$1[REDACTED]",
    )
    .replace(
      /\b([A-Z][A-Z0-9_]*(?:TOKEN|SECRET_ACCESS_KEY|SECRET_KEY|ACCESS_KEY|PRIVATE_KEY|SECRET|PASSWORD|PASSWD|API_KEY))\s*=\s*([^\s]+)/gi,
      "$1=[REDACTED]",
    )
    .replace(
      /(["']?(?:token|secret[_-](?:access[_-])?key|access[_-]?key|private[_-]?key|secret|password|passwd|api[_-]?key)["']?\s*[:=]\s*)["']?[^\s,"'}]+/gi,
      "$1[REDACTED]",
    )
    .replace(/(\/Users\/|\/home\/)[^/\s]+/g, "$1[REDACTED]")
    .replace(/([A-Za-z]:\\Users\\)[^\\\s]+/g, "$1[REDACTED]");
}

function redactWithState(value: string): { redacted: boolean; text: string } {
  const text = redact(value);
  return { redacted: text !== value, text };
}

function safeBranch(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return truncate(redact(value), 160);
}

function safeTimestamp(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString() : undefined;
}

function safeSessionId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    SAFE_SESSION_ID.test(value) &&
    redact(value) === value
  );
}

function materializedSqliteBytes(value: unknown): number {
  if (typeof value === "string") return Buffer.byteLength(value);
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
    return value.byteLength;
  }
  if (typeof value === "number" || typeof value === "bigint") return 8;
  return 0;
}

type SqliteTextProjection = {
  malformed: boolean;
  materializedBytes: number;
  text: string | null;
  truncated: boolean;
};

function sqliteTextProjection(
  value: unknown,
  originalBytes: unknown,
  storageType: unknown,
): SqliteTextProjection {
  const materializedBytes = materializedSqliteBytes(value);
  if (storageType === "null" && value === null && originalBytes === null) {
    return { malformed: false, materializedBytes, text: null, truncated: false };
  }
  if (
    typeof value === "string" &&
    storageType === "text" &&
    typeof originalBytes === "number" &&
    Number.isFinite(originalBytes) &&
    originalBytes >= 0
  ) {
    return {
      malformed: false,
      materializedBytes,
      text: value,
      truncated: originalBytes > materializedBytes,
    };
  }
  return { malformed: true, materializedBytes, text: null, truncated: false };
}

async function sqliteScopedPathProjection(
  value: unknown,
  originalBytes: unknown,
  storageType: unknown,
  requestedPath: string,
  canonicalScope: string,
): Promise<SqliteTextProjection & { canonical?: string }> {
  const projection = sqliteTextProjection(value, originalBytes, storageType);
  if (
    projection.malformed ||
    projection.truncated ||
    projection.text === null ||
    (projection.text !== requestedPath && projection.text !== canonicalScope)
  ) {
    return projection;
  }
  try {
    if ((await canonicalPath(projection.text)) === canonicalScope) {
      return { ...projection, canonical: canonicalScope };
    }
  } catch {
    // A state-store path never broadens the caller-authorized project scope.
  }
  return projection;
}

function sqliteExactTextProjection(
  value: unknown,
  originalBytes: unknown,
  storageType: unknown,
  expected: string,
): SqliteTextProjection & { matches: boolean } {
  const projection = sqliteTextProjection(value, originalBytes, storageType);
  return {
    ...projection,
    matches:
      !projection.malformed &&
      !projection.truncated &&
      projection.text === expected,
  };
}

function truncate(value: string, maximum: number): string {
  return value.length <= maximum ? value : `${value.slice(0, maximum - 1)}…`;
}

function truncateUtf8(value: string, maximumBytes: number): string {
  if (maximumBytes <= 0) return "";
  if (Buffer.byteLength(value) <= maximumBytes) return value;
  const bytes = Buffer.from(value);
  let end = Math.min(bytes.length, maximumBytes);
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end -= 1;
  return bytes.subarray(0, end).toString("utf8");
}

function issueReferences(query: string): string[] {
  return query.match(/(?:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+#\d+|#\d+)/g) ?? [];
}

function scoreContent(
  content: string,
  queries: string[],
  fields?: { branch?: string },
): { score: number; signals: SearchSignal[] } {
  const normalizedContent = content.toLocaleLowerCase();
  const contentIssues = new Set(
    issueReferences(content).map((issue) => issue.toLocaleLowerCase()),
  );
  const signals: SearchSignal[] = [];
  let score = 0;

  for (const query of queries) {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const safeQuery = redact(query);
    const branchMatches =
      fields?.branch?.trim().toLocaleLowerCase() === normalizedQuery &&
      normalizedQuery.length > 0;
    if (branchMatches) {
      score += 900;
      signals.push({ code: "exact_branch", query: safeQuery });
    }

    const queryIssues = issueReferences(query);
    let matchedIssue = false;
    for (const issue of queryIssues) {
      if (contentIssues.has(issue.toLocaleLowerCase())) {
        score += 1_000;
        signals.push({ code: "exact_issue", query: safeQuery });
        matchedIssue = true;
      }
    }

    if (queryIssues.length > 0 && !matchedIssue) continue;

    if (!matchedIssue && normalizedQuery && normalizedContent.includes(normalizedQuery)) {
      let code = "exact_phrase";
      let exactScore = 300;
      if (/^[0-9a-f]{7,40}$/i.test(query.trim())) {
        code = "exact_commit";
        exactScore = 850;
      } else if (
        /^(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.[A-Za-z0-9]+$/.test(
          query.trim(),
        )
      ) {
        code = "exact_file";
        exactScore = 800;
      } else if (
        /^[A-Za-z_$][A-Za-z0-9_$]*(?:(?:::|\.)[A-Za-z_$][A-Za-z0-9_$]*)*$/.test(
          query.trim(),
        ) && /[A-Z_$]|::|\./.test(query.trim())
      ) {
        code = "exact_symbol";
        exactScore = 700;
      } else if (/^[\p{L}\p{N}_-]{3,}$/u.test(query.trim())) {
        code = "exact_term";
        exactScore = 400;
      }
      score += exactScore;
      signals.push({ code, query: safeQuery });
    }

    const terms = Array.from(
      new Set(query.toLocaleLowerCase().match(/[\p{L}\p{N}_-]{3,}/gu) ?? []),
    );
    if (terms.length >= 2 && terms.every((term) => normalizedContent.includes(term))) {
      score += 100 + terms.length;
      signals.push({ code: "multi_term_content", query: safeQuery });
    }
  }
  return { score, signals };
}

async function canonicalPath(path: string): Promise<string> {
  if (!isAbsolute(path)) {
    throw new InputError("workspace paths must be absolute");
  }
  return realpath(path);
}

async function canonicalRequestedPath(path: string): Promise<string> {
  if (!isAbsolute(path)) {
    throw new InputError("workspace paths must be absolute");
  }
  try {
    return await realpath(path);
  } catch {
    throw new BlockedError(
      "approved_scope_unsatisfied",
      "The approved workspace path does not exist or cannot be resolved.",
    );
  }
}

type ClaudePreflight = {
  bytes: Buffer;
  sessionId: string;
};

function isObservedClaudeRecord(
  record: Record<string, unknown>,
): boolean {
  if (
    !safeSessionId(record.sessionId) ||
    typeof record.cwd !== "string" ||
    (record.type !== "user" && record.type !== "assistant") ||
    "schemaVersion" in record ||
    !record.message ||
    typeof record.message !== "object"
  ) {
    return false;
  }
  const message = record.message as { content?: unknown; role?: unknown };
  return (
    (message.role === "user" || message.role === "assistant") &&
    (typeof message.content === "string" || Array.isArray(message.content))
  );
}

async function preflightClaudeFile(
  file: string,
  fileSize: number,
  expectedCwd: string,
  maxBytes: number,
  expectedSessionId?: string,
): Promise<ClaudePreflight | undefined> {
  const prefixBytes = Math.min(fileSize, maxBytes, CLAUDE_PREFLIGHT_BYTES);
  if (prefixBytes <= 0) return undefined;
  const bytes = Buffer.from(
    await Bun.file(file).slice(0, prefixBytes).arrayBuffer(),
  );
  const text = bytes.toString("utf8");
  const lines = text.split("\n");
  if (bytes.length < fileSize && !text.endsWith("\n")) lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line) as Record<string, unknown>;
      if (
        !isObservedClaudeRecord(record) ||
        (expectedSessionId !== undefined && record.sessionId !== expectedSessionId)
      ) {
        continue;
      }
      if ((await canonicalPath(record.cwd)) !== expectedCwd) continue;
      return { bytes, sessionId: record.sessionId };
    } catch {
      // Only a complete, observed metadata record can authorize reading the body.
    }
  }
  return undefined;
}

async function searchClaude(
  home: string,
  requestedCwd: string,
  cwd: string,
  queries: string[],
  maxResults: number,
  limits: SearchLimits,
): Promise<SearchAdapterResult> {
  const startedAt = performance.now();
  if (
    limits.maxBytes <= 0 ||
    limits.maxFiles <= 0 ||
    limits.maxMessages <= 0 ||
    limits.maxMillis <= 0
  ) {
    const exhausted = [
      ...(limits.maxBytes <= 0 ? ["byte_limit"] : []),
      ...(limits.maxFiles <= 0 ? ["file_limit"] : []),
      ...(limits.maxMessages <= 0 ? ["message_limit"] : []),
      ...(limits.maxMillis <= 0 ? ["time_limit"] : []),
    ];
    return {
      bounds: { ...emptyBounds(maxResults), exhausted },
      matches: [],
    };
  }
  const discoveredFiles = await listClaudeJsonl(
    home,
    [requestedCwd, cwd],
    limits.maxFiles + 1,
  );
  const files = discoveredFiles.slice(0, limits.maxFiles);
  const matches: Array<SearchMatch & { updatedAtMs: number }> = [];
  let bytesRead = 0;
  let messagesRead = 0;
  let recordsSkipped = 0;
  let filesRead = 0;
  let schemaObserved = false;
  const sessionFileCounts = new Map<string, number>();
  const exhausted: string[] = discoveredFiles.length > limits.maxFiles ? ["file_limit"] : [];

  for (const file of files) {
    if (elapsedSince(startedAt) >= limits.maxMillis) {
      exhausted.push("time_limit");
      break;
    }
    const metadata = await stat(file);
    const remaining = limits.maxBytes - bytesRead;
    if (remaining <= 0) {
      exhausted.push("byte_limit");
      break;
    }
    const bytesToRead = Math.min(metadata.size, remaining);
    const preflight = await preflightClaudeFile(
      file,
      metadata.size,
      cwd,
      bytesToRead,
    );
    filesRead += 1;
    if (!preflight) {
      bytesRead += Math.min(bytesToRead, CLAUDE_PREFLIGHT_BYTES);
      recordsSkipped += 1;
      continue;
    }
    schemaObserved = true;
    const tail = Buffer.from(
      await Bun.file(file)
        .slice(preflight.bytes.length, bytesToRead)
        .arrayBuffer(),
    );
    const text = Buffer.concat([preflight.bytes, tail]).toString("utf8");
    bytesRead += preflight.bytes.length + tail.length;
    if (bytesToRead < metadata.size && !exhausted.includes("byte_limit")) {
      exhausted.push("byte_limit");
    }

    const sessionId = preflight.sessionId;
    sessionFileCounts.set(sessionId, (sessionFileCounts.get(sessionId) ?? 0) + 1);
    let branch: string | undefined;
    let firstUserMessage: string | undefined;
    let updatedAt: string | undefined;
    const searchableText: string[] = [];

    for (const line of text.split("\n")) {
      if (line.trim().length === 0) {
        continue;
      }
      try {
        const record = JSON.parse(line) as Record<string, unknown>;
        if (!isObservedClaudeRecord(record)) {
          recordsSkipped += 1;
          continue;
        }
        if (record.sessionId !== sessionId) continue;
        try {
          if ((await canonicalPath(record.cwd as string)) !== cwd) {
            recordsSkipped += 1;
            continue;
          }
        } catch {
          recordsSkipped += 1;
          continue;
        }
        if (typeof record.gitBranch === "string") branch ??= record.gitBranch;
        if (typeof record.timestamp === "string") updatedAt = record.timestamp;

        const message = record.message;
        if (!message || typeof message !== "object") {
          continue;
        }
        const role = (message as { role?: unknown }).role;
        if (role !== "user" && role !== "assistant") {
          continue;
        }
        const extracted = extractText((message as { content?: unknown }).content);
        recordsSkipped += extracted.unknownBlocks;
        if (extracted.texts.length === 0) {
          continue;
        }
        if (messagesRead >= limits.maxMessages) {
          if (!exhausted.includes("message_limit")) exhausted.push("message_limit");
          break;
        }
        messagesRead += 1;
        searchableText.push(...extracted.texts);
        if (role === "user" && firstUserMessage === undefined) {
          firstUserMessage = extracted.texts.join(" ");
        }
      } catch {
        // Malformed and concurrently truncated records are skipped.
        recordsSkipped += 1;
      }
    }

    const canonicalSessionCwd = cwd;

    const scored = scoreContent(searchableText.join("\n"), queries, { branch });
    if (scored.score <= 0) {
      continue;
    }
    matches.push({
      rank: 0,
      score: scored.score,
      session: {
        ...(safeBranch(branch) ? { branch: safeBranch(branch) } : {}),
        cwd: canonicalSessionCwd,
        harness: "claude-code",
        key: `claude-code:${sessionId}`,
        ...(firstUserMessage
          ? { preview: truncate(redact(firstUserMessage), 240) }
          : {}),
        sessionId,
        ...(safeTimestamp(updatedAt) ? { updatedAt: safeTimestamp(updatedAt) } : {}),
        sourceKind: "transcript",
      },
      signals: scored.signals,
      updatedAtMs: updatedAt ? Date.parse(updatedAt) : 0,
    });
  }

  matches.sort(
    (left, right) =>
      right.score - left.score || right.updatedAtMs - left.updatedAtMs ||
      left.session.key.localeCompare(right.session.key),
  );
  const ambiguousSessionIds = new Set(
    Array.from(sessionFileCounts)
      .filter(([, count]) => count > 1)
      .map(([sessionId]) => sessionId),
  );
  recordsSkipped += ambiguousSessionIds.size;
  const uniqueMatches = deduplicateMatches(
    matches.filter((match) => !ambiguousSessionIds.has(match.session.sessionId)),
  );
  const limited = uniqueMatches
    .slice(0, maxResults)
    .map(({ updatedAtMs: _, ...match }, index) => ({
      ...match,
      rank: index + 1,
    }));
  if (uniqueMatches.length > maxResults) {
    exhausted.push("result_limit");
  }

  return {
    ambiguousSessionCount: ambiguousSessionIds.size,
    bounds: {
      bytesRead,
      elapsedMs: elapsedSince(startedAt),
      exhausted,
      filesRead,
      maxBytes: MAX_BYTES,
      maxFiles: MAX_FILES,
      maxMillis: MAX_MILLIS,
      maxMessages: MAX_SEARCH_MESSAGES,
      maxResults,
      messagesRead,
      recordsSkipped,
    },
    matches: limited,
    ...(discoveredFiles.length > 0 ? { schemaObserved } : {}),
  };
}

function emptyBounds(maxResults: number): BoundsReport {
  return {
    bytesRead: 0,
    elapsedMs: 0,
    exhausted: [],
    filesRead: 0,
    maxBytes: MAX_BYTES,
    maxFiles: MAX_FILES,
    maxMillis: MAX_MILLIS,
    maxMessages: MAX_SEARCH_MESSAGES,
    maxResults,
    messagesRead: 0,
    recordsSkipped: 0,
  };
}

function combineBounds(reports: BoundsReport[], maxResults: number): BoundsReport {
  return {
    bytesRead: reports.reduce((total, report) => total + report.bytesRead, 0),
    elapsedMs: reports.reduce((total, report) => total + report.elapsedMs, 0),
    exhausted: Array.from(new Set(reports.flatMap((report) => report.exhausted))),
    filesRead: reports.reduce((total, report) => total + report.filesRead, 0),
    maxBytes: MAX_BYTES,
    maxFiles: MAX_FILES,
    maxMillis: MAX_MILLIS,
    maxMessages: MAX_SEARCH_MESSAGES,
    maxResults,
    messagesRead: reports.reduce((total, report) => total + report.messagesRead, 0),
    recordsSkipped: reports.reduce(
      (total, report) => total + report.recordsSkipped,
      0,
    ),
  };
}

function remainingSearchLimits(
  reports: BoundsReport[],
  startedAt: number,
): SearchLimits {
  return {
    maxBytes: Math.max(
      0,
      MAX_BYTES - reports.reduce((total, report) => total + report.bytesRead, 0),
    ),
    maxFiles: Math.max(
      0,
      MAX_FILES - reports.reduce((total, report) => total + report.filesRead, 0),
    ),
    maxMessages: Math.max(
      0,
      MAX_SEARCH_MESSAGES -
        reports.reduce((total, report) => total + report.messagesRead, 0),
    ),
    maxMillis: Math.max(0, MAX_MILLIS - elapsedSince(startedAt)),
  };
}

function codexSourceKind(threadSource: unknown, agentPath: unknown): string {
  if (threadSource === null || threadSource === undefined) {
    return typeof agentPath === "string" && agentPath.trim().length > 0
      ? "agent"
      : "unknown";
  }
  const source =
    typeof threadSource === "string" ? threadSource : JSON.stringify(threadSource);
  if (/subagent/i.test(source)) return "subagent";
  if (/worker/i.test(source)) return "worker";
  if (typeof agentPath === "string" && agentPath.trim().length > 0) return "agent";
  const safeToken = source.trim().toLocaleLowerCase().match(/^[a-z0-9_-]{1,40}$/)?.[0];
  return safeToken &&
    redact(safeToken) === safeToken &&
    ["api", "app-server", "cli", "exec", "unknown", "vscode"].includes(safeToken)
    ? safeToken
    : "other";
}

async function searchCodex(
  home: string,
  requestedCwd: string,
  canonicalCwd: string,
  queries: string[],
  maxResults: number,
  limits: SearchLimits,
): Promise<SearchAdapterResult> {
  const startedAt = performance.now();
  const path = join(home, ".codex", "state_5.sqlite");
  if (!(await pathExists(path))) {
    return { bounds: emptyBounds(maxResults), matches: [] };
  }
  await assertNativePath(home, path);
  if (
    limits.maxBytes <= 0 ||
    limits.maxFiles <= 0 ||
    limits.maxMessages <= 0 ||
    limits.maxMillis <= 0
  ) {
    return {
      bounds: {
        ...emptyBounds(maxResults),
        exhausted: [
          ...(limits.maxBytes <= 0 ? ["byte_limit"] : []),
          ...(limits.maxFiles <= 0 ? ["file_limit"] : []),
          ...(limits.maxMessages <= 0 ? ["message_limit"] : []),
          ...(limits.maxMillis <= 0 ? ["time_limit"] : []),
        ],
      },
      matches: [],
    };
  }

  const historyPath = join(home, ".codex", "thread_history_1.sqlite");
  let history: Database | undefined;
  let historySchemaUnavailable = false;
  if (limits.maxFiles > 1 && (await pathExists(historyPath))) {
    try {
      await assertNativePath(home, historyPath);
      history = openImmutableDatabase(historyPath);
      const columns = new Set(
        history
          .query<{ name: string }, []>("PRAGMA table_info(thread_items)")
          .all()
          .map((row) => row.name),
      );
      if (
        !hasColumns(columns, [
          "thread_id",
          "item_type",
          "item_json",
          "rollout_ordinal",
        ])
      ) {
        const unsupportedHistory = history;
        history = undefined;
        closeImmutableDatabase(unsupportedHistory, historyPath);
        historySchemaUnavailable = true;
      }
    } catch {
      history?.close(false);
      history = undefined;
      historySchemaUnavailable = true;
    }
  }

  const database = openImmutableDatabase(path);
  try {
    const rows = database
      .query<
        {
          agent_path_type: unknown;
          archived: unknown;
          archived_type: unknown;
          cwd: unknown;
          cwd_bytes: unknown;
          cwd_type: unknown;
          first_user_message: unknown;
          first_user_message_bytes: unknown;
          first_user_message_type: unknown;
          git_branch: unknown;
          git_branch_bytes: unknown;
          git_branch_type: unknown;
          history_mode: unknown;
          history_mode_bytes: unknown;
          history_mode_type: unknown;
          id: unknown;
          id_bytes: unknown;
          id_type: unknown;
          preview: unknown;
          preview_bytes: unknown;
          preview_type: unknown;
          recency_at_ms: unknown;
          recency_at_ms_type: unknown;
          rollout_path: unknown;
          rollout_path_bytes: unknown;
          rollout_path_type: unknown;
          thread_source: unknown;
          thread_source_bytes: unknown;
          thread_source_type: unknown;
          title: unknown;
          title_bytes: unknown;
          title_type: unknown;
        },
        [string, string, number]
      >(
        `SELECT substr(id, 1, 128) AS id,
                substr(cwd, 1, 4096) AS cwd,
                substr(title, 1, 512) AS title,
                substr(first_user_message, 1, 1024) AS first_user_message,
                substr(preview, 1, 512) AS preview,
                substr(git_branch, 1, 256) AS git_branch,
                recency_at_ms,
                substr(history_mode, 1, 64) AS history_mode,
                substr(rollout_path, 1, 4096) AS rollout_path,
                substr(thread_source, 1, 512) AS thread_source,
                typeof(agent_path) AS agent_path_type,
                typeof(archived) AS archived_type,
                typeof(cwd) AS cwd_type,
                typeof(recency_at_ms) AS recency_at_ms_type,
                typeof(id) AS id_type,
                typeof(title) AS title_type,
                typeof(first_user_message) AS first_user_message_type,
                typeof(preview) AS preview_type,
                typeof(git_branch) AS git_branch_type,
                typeof(history_mode) AS history_mode_type,
                typeof(rollout_path) AS rollout_path_type,
                typeof(thread_source) AS thread_source_type,
                length(CAST(id AS BLOB)) AS id_bytes,
                length(CAST(cwd AS BLOB)) AS cwd_bytes,
                length(CAST(title AS BLOB)) AS title_bytes,
                length(CAST(first_user_message AS BLOB)) AS first_user_message_bytes,
                length(CAST(preview AS BLOB)) AS preview_bytes,
                length(CAST(git_branch AS BLOB)) AS git_branch_bytes,
                length(CAST(history_mode AS BLOB)) AS history_mode_bytes,
                length(CAST(rollout_path AS BLOB)) AS rollout_path_bytes,
                length(CAST(thread_source AS BLOB)) AS thread_source_bytes,
                archived
           FROM threads
          WHERE cwd COLLATE BINARY = ? OR cwd COLLATE BINARY = ?
          ORDER BY recency_at_ms DESC
          LIMIT ?`,
      )
      .all(
        requestedCwd,
        canonicalCwd,
        Math.min(MAX_RECORDS, limits.maxMessages) + 1,
      );

    const matches: SearchMatch[] = [];
    let bytesRead = 0;
    const exhausted: string[] = [];
    let messagesRead = 0;
    let recordsSkipped = 0;
    let filesRead = 1;
    let historyRead = false;
    const sessionRowCounts = new Map<string, number>();
    const rowLimit = Math.min(MAX_RECORDS, limits.maxMessages);
    if (rows.length > rowLimit) exhausted.push("message_limit");
    for (const row of rows.slice(0, rowLimit)) {
      if (elapsedSince(startedAt) >= limits.maxMillis) {
        exhausted.push("time_limit");
        break;
      }
      if (!safeSessionId(row.id)) {
        recordsSkipped += 1;
        continue;
      }
      if (
        row.id_type !== "text" ||
        typeof row.id_bytes !== "number" ||
        row.id_bytes > Buffer.byteLength(row.id)
      ) {
        recordsSkipped += 1;
        continue;
      }
      const scope = await sqliteScopedPathProjection(
        row.cwd,
        row.cwd_bytes,
        row.cwd_type,
        requestedCwd,
        canonicalCwd,
      );
      if (!scope.canonical) {
        recordsSkipped += 1;
        continue;
      }
      const rowCwd = scope.canonical;
      sessionRowCounts.set(row.id, (sessionRowCounts.get(row.id) ?? 0) + 1);
      const metadata = {
        firstUserMessage: sqliteTextProjection(
          row.first_user_message,
          row.first_user_message_bytes,
          row.first_user_message_type,
        ),
        gitBranch: sqliteTextProjection(
          row.git_branch,
          row.git_branch_bytes,
          row.git_branch_type,
        ),
        historyMode: sqliteTextProjection(
          row.history_mode,
          row.history_mode_bytes,
          row.history_mode_type,
        ),
        preview: sqliteTextProjection(row.preview, row.preview_bytes, row.preview_type),
        rolloutPath: sqliteTextProjection(
          row.rollout_path,
          row.rollout_path_bytes,
          row.rollout_path_type,
        ),
        threadSource: sqliteTextProjection(
          row.thread_source,
          row.thread_source_bytes,
          row.thread_source_type,
        ),
        title: sqliteTextProjection(row.title, row.title_bytes, row.title_type),
      };
      const projectedFields = Object.values(metadata);
      recordsSkipped += projectedFields.filter((field) => field.malformed).length;
      const archived = row.archived_type === "integer" && row.archived === 0
        ? false
        : row.archived_type === "integer" && row.archived === 1
          ? true
          : undefined;
      if (archived === undefined) recordsSkipped += 1;
      const agentPathPresent = row.agent_path_type === "null"
        ? false
        : row.agent_path_type === "text"
          ? true
          : undefined;
      if (agentPathPresent === undefined) recordsSkipped += 1;
      const recency = sqliteTimestampProjection(
        row.recency_at_ms,
        row.recency_at_ms_type,
      );
      if (recency.malformed) recordsSkipped += 1;
      const materializedBytes =
        Buffer.byteLength(row.id) +
        scope.materializedBytes +
        projectedFields.reduce((total, field) => total + field.materializedBytes, 0);
      const remainingBytes = limits.maxBytes - bytesRead;
      if (remainingBytes < materializedBytes) {
        exhausted.push("byte_limit");
        break;
      }
      bytesRead += materializedBytes;
      messagesRead += 1;
      if (projectedFields.some((field) => field.truncated)) exhausted.push("byte_limit");
      const searchable = [
        metadata.title.text,
        metadata.firstUserMessage.text,
        metadata.preview.text,
        metadata.gitBranch.text,
      ].filter((value): value is string => typeof value === "string").join("\n");
      const rolloutPath =
        !metadata.rolloutPath.malformed && !metadata.rolloutPath.truncated
          ? metadata.rolloutPath.text
          : null;
      let scored = scoreContent(searchable, queries, {
        branch: metadata.gitBranch.text ?? undefined,
      });
      if (scored.signals.length < queries.length && history) {
        const remainingMessages = Math.max(0, limits.maxMessages - messagesRead);
        const remainingHistoryBytes = Math.max(0, limits.maxBytes - bytesRead);
        if (remainingMessages <= 0) {
          exhausted.push("message_limit");
        } else if (remainingHistoryBytes <= 0) {
          exhausted.push("byte_limit");
        } else if (elapsedSince(startedAt) >= limits.maxMillis) {
          exhausted.push("time_limit");
        } else {
          const rowLimit = Math.min(MAX_INSPECT_MESSAGES, remainingMessages);
          const charactersPerItem = Math.max(
            1,
            Math.min(
              16_384,
              Math.floor(
                remainingHistoryBytes / Math.max(1, (rowLimit + 1) * 4),
              ),
            ),
          );
          const items = history
            .query<
              {
                item_json: unknown;
                item_json_bytes: unknown;
                item_json_type: unknown;
                item_type: string;
                thread_id: unknown;
                thread_id_bytes: unknown;
                thread_id_type: unknown;
              },
              [number, string, number]
            >(
              `SELECT item_type,
                      substr(item_json, 1, ?) AS item_json,
                      substr(thread_id, 1, 128) AS thread_id,
                      typeof(item_json) AS item_json_type,
                      typeof(thread_id) AS thread_id_type,
                      length(CAST(item_json AS BLOB)) AS item_json_bytes,
                      length(CAST(thread_id AS BLOB)) AS thread_id_bytes
                 FROM thread_items
                WHERE thread_id COLLATE BINARY = ?
                  AND item_type IN ('userMessage', 'agentMessage')
                ORDER BY rollout_ordinal
                LIMIT ?`,
            )
            .all(charactersPerItem, row.id, rowLimit + 1);
          historyRead = true;
          const projected: string[] = [];
          for (const itemRow of items.slice(0, rowLimit)) {
            if (elapsedSince(startedAt) >= limits.maxMillis) {
              exhausted.push("time_limit");
              break;
            }
            const key = sqliteExactTextProjection(
              itemRow.thread_id,
              itemRow.thread_id_bytes,
              itemRow.thread_id_type,
              row.id,
            );
            const itemBytes =
              materializedSqliteBytes(itemRow.item_json) + key.materializedBytes;
            if (bytesRead + itemBytes > limits.maxBytes) {
              exhausted.push("byte_limit");
              break;
            }
            bytesRead += itemBytes;
            messagesRead += 1;
            if (
              typeof itemRow.item_json !== "string" ||
              itemRow.item_json_type !== "text" ||
              !key.matches ||
              typeof itemRow.item_json_bytes !== "number"
            ) {
              recordsSkipped += 1;
              continue;
            }
            if (itemRow.item_json_bytes > itemBytes) {
              exhausted.push("byte_limit");
            }
            try {
              const item = JSON.parse(itemRow.item_json) as {
                content?: unknown;
                schemaVersion?: unknown;
                text?: unknown;
              };
              const projection = codexProjectionText(itemRow.item_type, item);
              if (!projection) recordsSkipped += 1;
              else {
                recordsSkipped += projection.unknownBlocks;
                projected.push(...projection.texts);
              }
            } catch {
              recordsSkipped += 1;
            }
          }
          if (items.length > rowLimit) exhausted.push("message_limit");
          scored = scoreContent(
            `${searchable}\n${projected.join("\n")}`,
            queries,
            { branch: metadata.gitBranch.text ?? undefined },
          );
        }
      } else if (scored.signals.length < queries.length && historySchemaUnavailable) {
        recordsSkipped += 1;
        historySchemaUnavailable = false;
      }
      if (
        scored.signals.length < queries.length &&
        !history &&
        rolloutPath &&
        filesRead < limits.maxFiles
      ) {
        const rollout = await readCodexRollout(
          join(home, ".codex"),
          rolloutPath,
          row.id,
          rowCwd,
          startedAt,
          Math.max(0, limits.maxBytes - bytesRead),
        );
        if (rollout?.matched) {
          const availableMessages = Math.max(0, limits.maxMessages - messagesRead);
          const rolloutMessages = rollout.messages.slice(0, availableMessages);
          if (rollout.messages.length > availableMessages) {
            exhausted.push("message_limit");
          }
          filesRead += 1;
          bytesRead += rollout.bytesRead;
          messagesRead += rolloutMessages.length;
          recordsSkipped += rollout.recordsSkipped;
          exhausted.push(...rollout.exhausted);
          scored = scoreContent(
            `${searchable}\n${rolloutMessages
              .map((message) => message.text)
              .join("\n")}`,
            queries,
            { branch: metadata.gitBranch.text ?? rollout.branch },
          );
        } else {
          recordsSkipped += rollout?.recordsSkipped ?? 1;
        }
      } else if (
        scored.signals.length < queries.length &&
        !history &&
        !rolloutPath
      ) {
        recordsSkipped += 1;
      }
      if (scored.score <= 0) {
        continue;
      }
      const updatedAt = recency.timestamp;
      matches.push({
        rank: 0,
        score: scored.score,
        session: {
          ...(archived !== undefined ? { archived } : {}),
          ...(safeBranch(metadata.gitBranch.text)
            ? { branch: safeBranch(metadata.gitBranch.text) }
            : {}),
          cwd: rowCwd,
          harness: "codex",
          key: `codex:${row.id}`,
          ...(metadata.firstUserMessage.text || metadata.title.text
            ? {
                preview: truncate(
                  redact(metadata.firstUserMessage.text ?? metadata.title.text ?? ""),
                  240,
                ),
              }
            : {}),
          sessionId: row.id,
          sourceKind: codexSourceKind(
            metadata.threadSource.text,
            agentPathPresent ? "present" : null,
          ),
          ...(updatedAt ? { updatedAt } : {}),
        },
        signals: scored.signals,
      });
    }

    matches.sort(
      (left, right) =>
        right.score - left.score ||
        Date.parse(right.session.updatedAt ?? "1970-01-01") -
          Date.parse(left.session.updatedAt ?? "1970-01-01") ||
        left.session.key.localeCompare(right.session.key),
    );
    const ambiguousSessionIds = new Set(
      Array.from(sessionRowCounts)
        .filter(([, count]) => count > 1)
        .map(([sessionId]) => sessionId),
    );
    recordsSkipped += ambiguousSessionIds.size;
    const uniqueMatches = deduplicateMatches(
      matches.filter((match) => !ambiguousSessionIds.has(match.session.sessionId)),
    );
    if (uniqueMatches.length > maxResults) exhausted.push("result_limit");
    return {
      ambiguousSessionCount: ambiguousSessionIds.size,
      bounds: {
        ...emptyBounds(maxResults),
        bytesRead,
        elapsedMs: elapsedSince(startedAt),
        exhausted: uniqueSorted(exhausted),
        filesRead: filesRead + (historyRead ? 1 : 0),
        messagesRead,
        recordsSkipped,
      },
      matches: uniqueMatches.slice(0, maxResults).map((match, index) => ({
        ...match,
        rank: index + 1,
      })),
    };
  } finally {
    database.close(false);
    history?.close(false);
    assertNoLiveSqliteSidecar(path);
    if (history) assertNoLiveSqliteSidecar(historyPath);
  }
}

function sqliteTimestampProjection(
  value: unknown,
  storageType: unknown,
): { malformed: boolean; timestamp?: string } {
  if (storageType === "null" && value === null) return { malformed: false };
  if (
    (storageType !== "integer" && storageType !== "real") ||
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) return { malformed: true };
  const milliseconds = value < 10_000_000_000 ? value * 1_000 : value;
  const date = new Date(milliseconds);
  return Number.isFinite(date.getTime())
    ? { malformed: false, timestamp: date.toISOString() }
    : { malformed: true };
}

function safeRolloutOrdinal(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : undefined;
}

async function searchOpenCode(
  home: string,
  requestedCwd: string,
  canonicalCwd: string,
  queries: string[],
  maxResults: number,
  limits: SearchLimits,
): Promise<SearchAdapterResult> {
  const startedAt = performance.now();
  const path = join(home, ".local", "share", "opencode", "opencode.db");
  if (!(await pathExists(path))) {
    return { bounds: emptyBounds(maxResults), matches: [] };
  }
  await assertNativePath(home, path);
  if (
    limits.maxBytes <= 0 ||
    limits.maxFiles <= 0 ||
    limits.maxMessages <= 0 ||
    limits.maxMillis <= 0
  ) {
    return {
      bounds: {
        ...emptyBounds(maxResults),
        exhausted: [
          ...(limits.maxBytes <= 0 ? ["byte_limit"] : []),
          ...(limits.maxFiles <= 0 ? ["file_limit"] : []),
          ...(limits.maxMessages <= 0 ? ["message_limit"] : []),
          ...(limits.maxMillis <= 0 ? ["time_limit"] : []),
        ],
      },
      matches: [],
    };
  }

  const database = openImmutableDatabase(path);
  try {
    const sessions = database
      .query<
        {
          directory: unknown;
          directory_bytes: unknown;
          directory_type: unknown;
          id: unknown;
          id_bytes: unknown;
          id_type: unknown;
          parent_id_type: unknown;
          time_archived: unknown;
          time_archived_type: unknown;
          time_updated: unknown;
          time_updated_type: unknown;
          title: unknown;
          title_bytes: unknown;
          title_type: unknown;
        },
        [string, string, number]
      >(
        `SELECT substr(id, 1, 128) AS id,
                substr(directory, 1, 4096) AS directory,
                substr(title, 1, 512) AS title,
                typeof(directory) AS directory_type,
                typeof(id) AS id_type,
                typeof(parent_id) AS parent_id_type,
                typeof(title) AS title_type,
                typeof(time_updated) AS time_updated_type,
                typeof(time_archived) AS time_archived_type,
                length(CAST(id AS BLOB)) AS id_bytes,
                length(CAST(directory AS BLOB)) AS directory_bytes,
                length(CAST(title AS BLOB)) AS title_bytes,
                time_updated, time_archived
           FROM session
          WHERE directory COLLATE BINARY = ? OR directory COLLATE BINARY = ?
          ORDER BY time_updated DESC
          LIMIT ?`,
      )
      .all(
        requestedCwd,
        canonicalCwd,
        Math.min(MAX_RECORDS, limits.maxMessages) + 1,
      );

    const readParts = database.query<
      {
        message_bytes: unknown;
        message_data: unknown;
        message_id: unknown;
        message_id_bytes: unknown;
        message_id_type: unknown;
        message_session_id: unknown;
        message_session_id_bytes: unknown;
        message_session_id_type: unknown;
        message_type: unknown;
        part_bytes: unknown;
        part_data: unknown;
        part_message_id: unknown;
        part_message_id_bytes: unknown;
        part_message_id_type: unknown;
        part_type: unknown;
      },
      [number, number, string, number]
    >(
      `SELECT substr(m.data, 1, ?) AS message_data,
              substr(p.data, 1, ?) AS part_data,
              substr(m.id, 1, 128) AS message_id,
              substr(m.session_id, 1, 128) AS message_session_id,
              substr(p.message_id, 1, 128) AS part_message_id,
              typeof(m.data) AS message_type,
              typeof(p.data) AS part_type,
              typeof(m.id) AS message_id_type,
              typeof(m.session_id) AS message_session_id_type,
              typeof(p.message_id) AS part_message_id_type,
              length(CAST(m.data AS BLOB)) AS message_bytes,
              length(CAST(p.data AS BLOB)) AS part_bytes,
              length(CAST(m.id AS BLOB)) AS message_id_bytes,
              length(CAST(m.session_id AS BLOB)) AS message_session_id_bytes,
              length(CAST(p.message_id AS BLOB)) AS part_message_id_bytes
         FROM message AS m
         JOIN part AS p ON p.message_id COLLATE BINARY = m.id COLLATE BINARY
        WHERE m.session_id COLLATE BINARY = ?
        ORDER BY p.time_created
        LIMIT ?`,
    );

    const matches: SearchMatch[] = [];
    let bytesRead = 0;
    let messagesRead = 0;
    let recordsSkipped = 0;
    const sessionRowCounts = new Map<string, number>();
    const exhausted: string[] = [];
    const sessionLimit = Math.min(MAX_RECORDS, limits.maxMessages);
    if (sessions.length > sessionLimit) exhausted.push("message_limit");
    for (const session of sessions.slice(0, sessionLimit)) {
      if (elapsedSince(startedAt) >= limits.maxMillis) {
        exhausted.push("time_limit");
        break;
      }
      if (messagesRead >= limits.maxMessages) {
        exhausted.push("message_limit");
        break;
      }
      if (!safeSessionId(session.id)) {
        recordsSkipped += 1;
        continue;
      }
      if (
        session.id_type !== "text" ||
        typeof session.id_bytes !== "number" ||
        session.id_bytes > Buffer.byteLength(session.id)
      ) {
        recordsSkipped += 1;
        continue;
      }
      const scope = await sqliteScopedPathProjection(
        session.directory,
        session.directory_bytes,
        session.directory_type,
        requestedCwd,
        canonicalCwd,
      );
      if (!scope.canonical) {
        recordsSkipped += 1;
        continue;
      }
      sessionRowCounts.set(session.id, (sessionRowCounts.get(session.id) ?? 0) + 1);
      const sessionCwd = scope.canonical;
      const title = sqliteTextProjection(
        session.title,
        session.title_bytes,
        session.title_type,
      );
      if (title.malformed) recordsSkipped += 1;
      const hasParent = session.parent_id_type === "null"
        ? false
        : session.parent_id_type === "text"
          ? true
        : undefined;
      if (hasParent === undefined) recordsSkipped += 1;
      const archivedAt = sqliteTimestampProjection(
        session.time_archived,
        session.time_archived_type,
      );
      if (archivedAt.malformed) recordsSkipped += 1;
      const archived = archivedAt.malformed
        ? undefined
        : session.time_archived_type === "null"
          ? false
          : true;
      const updated = sqliteTimestampProjection(
        session.time_updated,
        session.time_updated_type,
      );
      if (updated.malformed) recordsSkipped += 1;

      const text: string[] = [];
      const sessionMetadataBytes =
        Buffer.byteLength(session.id) +
        scope.materializedBytes +
        title.materializedBytes;
      if (bytesRead + sessionMetadataBytes > limits.maxBytes) {
        exhausted.push("byte_limit");
        break;
      }
      bytesRead += sessionMetadataBytes;
      messagesRead += 1;
      if (title.text) {
        text.push(title.text);
      }
      if (title.truncated) exhausted.push("byte_limit");
      let firstUserMessage: string | undefined;
      const partLimit = limits.maxMessages - messagesRead;
      const remainingPartBytes = Math.max(0, limits.maxBytes - bytesRead);
      if (remainingPartBytes <= 0) {
        exhausted.push("byte_limit");
        break;
      }
      if (partLimit <= 0) {
        exhausted.push("message_limit");
        break;
      }
      const charactersPerPart = Math.max(
        1,
        Math.min(
          8_192,
          Math.floor(
            remainingPartBytes / Math.max(1, (partLimit + 1) * 2 * 4),
          ),
        ),
      );
      const parts = readParts.all(
        charactersPerPart,
        charactersPerPart,
        session.id,
        partLimit + 1,
      );
      if (parts.length > partLimit) exhausted.push("message_limit");
      for (const row of parts.slice(0, partLimit)) {
        if (elapsedSince(startedAt) >= limits.maxMillis) {
          exhausted.push("time_limit");
          break;
        }
        const messageId = sqliteTextProjection(
          row.message_id,
          row.message_id_bytes,
          row.message_id_type,
        );
        const messageSessionId = sqliteExactTextProjection(
          row.message_session_id,
          row.message_session_id_bytes,
          row.message_session_id_type,
          session.id,
        );
        const partMessageId = sqliteTextProjection(
          row.part_message_id,
          row.part_message_id_bytes,
          row.part_message_id_type,
        );
        const rowBytes =
          materializedSqliteBytes(row.message_data) +
          materializedSqliteBytes(row.part_data) +
          messageId.materializedBytes +
          messageSessionId.materializedBytes +
          partMessageId.materializedBytes;
        if (bytesRead + rowBytes > limits.maxBytes) {
          exhausted.push("byte_limit");
          break;
        }
        bytesRead += rowBytes;
        messagesRead += 1;
        if (
          typeof row.message_data !== "string" ||
          typeof row.part_data !== "string" ||
          row.message_type !== "text" ||
          row.part_type !== "text" ||
          messageId.malformed ||
          messageId.truncated ||
          messageId.text === null ||
          !messageSessionId.matches ||
          partMessageId.malformed ||
          partMessageId.truncated ||
          partMessageId.text !== messageId.text ||
          typeof row.message_bytes !== "number" ||
          typeof row.part_bytes !== "number"
        ) {
          recordsSkipped += 1;
          continue;
        }
        if (
          row.message_bytes > Buffer.byteLength(row.message_data) ||
          row.part_bytes > Buffer.byteLength(row.part_data)
        ) {
          exhausted.push("byte_limit");
        }
        try {
          const message = JSON.parse(row.message_data) as {
            role?: unknown;
            schemaVersion?: unknown;
          };
          const part = JSON.parse(row.part_data) as {
            schemaVersion?: unknown;
            text?: unknown;
            type?: unknown;
          };
          const projection = openCodeProjection(message, part);
          if (!projection) {
            recordsSkipped += 1;
            continue;
          }
          if (projection.text !== undefined) text.push(projection.text);
          if (
            projection.role === "user" &&
            projection.text !== undefined &&
            firstUserMessage === undefined
          ) {
            firstUserMessage = projection.text;
          }
        } catch {
          // Unknown or malformed message/part records do not invalidate other sessions.
          recordsSkipped += 1;
        }
      }
      const searchable = text.join("\n");
      const scored = scoreContent(searchable, queries);
      if (scored.score <= 0) {
        continue;
      }
      const updatedAt = updated.timestamp;
      matches.push({
        rank: 0,
        score: scored.score,
        session: {
          ...(archived !== undefined ? { archived } : {}),
          cwd: sessionCwd,
          harness: "opencode",
          key: `opencode:${session.id}`,
          ...(firstUserMessage || title.text
            ? { preview: truncate(redact(firstUserMessage ?? title.text ?? ""), 240) }
            : {}),
          sessionId: session.id,
          sourceKind: hasParent === undefined ? "unknown" : hasParent ? "child" : "root",
          ...(updatedAt ? { updatedAt } : {}),
        },
        signals: scored.signals,
      });
    }

    matches.sort(
      (left, right) =>
        right.score - left.score ||
        Date.parse(right.session.updatedAt ?? "1970-01-01") -
          Date.parse(left.session.updatedAt ?? "1970-01-01") ||
        left.session.key.localeCompare(right.session.key),
    );
    const ambiguousSessionIds = new Set(
      Array.from(sessionRowCounts)
        .filter(([, count]) => count > 1)
        .map(([sessionId]) => sessionId),
    );
    recordsSkipped += ambiguousSessionIds.size;
    const uniqueMatches = deduplicateMatches(
      matches.filter((match) => !ambiguousSessionIds.has(match.session.sessionId)),
    );
    if (uniqueMatches.length > maxResults) exhausted.push("result_limit");
    return {
      ambiguousSessionCount: ambiguousSessionIds.size,
      bounds: {
        ...emptyBounds(maxResults),
        bytesRead,
        elapsedMs: elapsedSince(startedAt),
        exhausted: uniqueSorted(exhausted),
        filesRead: 1,
        messagesRead,
        recordsSkipped,
      },
      matches: uniqueMatches.slice(0, maxResults).map((match, index) => ({
        ...match,
        rank: index + 1,
      })),
    };
  } finally {
    closeImmutableDatabase(database, path);
  }
}

async function searchCodexRollouts(
  home: string,
  canonicalCwd: string,
  queries: string[],
  maxResults: number,
  limits: SearchLimits,
): Promise<SearchAdapterResult> {
  const startedAt = performance.now();
  if (
    limits.maxBytes <= 0 ||
    limits.maxFiles <= 0 ||
    limits.maxMessages <= 0 ||
    limits.maxMillis <= 0
  ) {
    return {
      bounds: {
        ...emptyBounds(maxResults),
        exhausted: [
          ...(limits.maxBytes <= 0 ? ["byte_limit"] : []),
          ...(limits.maxFiles <= 0 ? ["file_limit"] : []),
          ...(limits.maxMessages <= 0 ? ["message_limit"] : []),
          ...(limits.maxMillis <= 0 ? ["time_limit"] : []),
        ],
      },
      matches: [],
    };
  }

  const sessionsDirectory = join(home, ".codex", "sessions");
  if (await pathExists(sessionsDirectory)) {
    await assertNativePath(home, sessionsDirectory);
  }
  const discoveredFiles = await listJsonl(
    sessionsDirectory,
    limits.maxFiles + 1,
  );
  const files = discoveredFiles.slice(0, limits.maxFiles);
  const matches: Array<SearchMatch & { updatedAtMs: number }> = [];
  const exhausted: string[] = discoveredFiles.length > limits.maxFiles ? ["file_limit"] : [];
  let bytesRead = 0;
  let filesRead = 0;
  let recordsSkipped = 0;
  let messagesRead = 0;
  const sessionFileCounts = new Map<string, number>();

  for (const file of files) {
    if (elapsedSince(startedAt) >= limits.maxMillis) {
      exhausted.push("time_limit");
      break;
    }
    if (messagesRead >= limits.maxMessages) {
      exhausted.push("message_limit");
      break;
    }
    const metadata = await stat(file);
    const remainingBytes = limits.maxBytes - bytesRead;
    if (remainingBytes <= 0) {
      exhausted.push("byte_limit");
      break;
    }
    const prefixBytes = Math.min(metadata.size, remainingBytes, 65_536);
    const prefix = await Bun.file(file).slice(0, prefixBytes).text();
    bytesRead += Buffer.byteLength(prefix);
    filesRead += 1;
    let preflightId: string | undefined;
    let preflightCwd: string | undefined;
    for (const line of prefix.split("\n")) {
      if (!line.trim()) continue;
      try {
        const record = JSON.parse(line) as {
          payload?: { cwd?: unknown; id?: unknown; schemaVersion?: unknown };
          schemaVersion?: unknown;
          type?: unknown;
        };
        if (
          record.schemaVersion !== undefined ||
          record.payload?.schemaVersion !== undefined
        ) continue;
        if (record.type !== "session_meta") continue;
        if (typeof record.payload?.id === "string") preflightId = record.payload.id;
        if (typeof record.payload?.cwd === "string") preflightCwd = record.payload.cwd;
        break;
      } catch {
        // Continue through a bounded prefix; the full parser reports malformed records.
      }
    }
    if (!safeSessionId(preflightId) || !preflightCwd) {
      recordsSkipped += 1;
      continue;
    }
    try {
      if ((await canonicalPath(preflightCwd)) !== canonicalCwd) continue;
    } catch {
      continue;
    }
    const remainingAfterPrefix = limits.maxBytes - bytesRead;
    const additionalBytes = Math.min(
      Math.max(0, metadata.size - prefixBytes),
      remainingAfterPrefix,
    );
    const additional =
      additionalBytes > 0
        ? await Bun.file(file)
            .slice(prefixBytes, prefixBytes + additionalBytes)
            .text()
        : "";
    bytesRead += Buffer.byteLength(additional);
    const text = `${prefix}${additional}`;
    if (prefixBytes + additionalBytes < metadata.size) exhausted.push("byte_limit");

    let branch: string | undefined;
    let sourceKind = "unknown";
    let firstUserMessage: string | undefined;
    let sessionCwd: string | undefined;
    let sessionId: string | undefined;
    let sessionMetaCount = 0;
    let updatedAt: string | undefined;
    const searchable: string[] = [];
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      if (elapsedSince(startedAt) >= limits.maxMillis) {
        exhausted.push("time_limit");
        break;
      }
      try {
        const record = JSON.parse(line) as {
          payload?: {
            content?: unknown;
            cwd?: unknown;
            git?: { branch?: unknown };
            id?: unknown;
            role?: unknown;
            schemaVersion?: unknown;
            source?: unknown;
            type?: unknown;
          };
          schemaVersion?: unknown;
          timestamp?: unknown;
          type?: unknown;
        };
        if (
          record.schemaVersion !== undefined ||
          record.payload?.schemaVersion !== undefined
        ) {
          recordsSkipped += 1;
          continue;
        }
        if (typeof record.timestamp === "string") updatedAt = record.timestamp;
        if (record.type === "session_meta") {
          sessionMetaCount += 1;
          if (sessionMetaCount > 1) {
            recordsSkipped += 1;
            continue;
          }
          if (typeof record.payload?.id === "string") sessionId = record.payload.id;
          if (typeof record.payload?.cwd === "string") sessionCwd = record.payload.cwd;
          if (typeof record.payload?.git?.branch === "string") {
            branch = record.payload.git.branch;
          }
          sourceKind = codexSourceKind(record.payload?.source, null);
          continue;
        }
        if (CODEX_IGNORED_ROLLOUT_RECORD_TYPES.has(String(record.type))) {
          continue;
        }
        if (record.type !== "response_item") {
          recordsSkipped += 1;
          continue;
        }
        const message = codexRolloutMessage(record.payload);
        if (!message) {
          recordsSkipped += 1;
          continue;
        }
        if (message.kind === "ignored") continue;
        if (messagesRead >= limits.maxMessages) {
          exhausted.push("message_limit");
          break;
        }
        for (const fragment of message.texts) {
          searchable.push(fragment);
          if (message.role === "user" && firstUserMessage === undefined) {
            firstUserMessage = fragment;
          }
        }
        messagesRead += 1;
      } catch {
        // Unknown or concurrently truncated rollout records are isolated.
        recordsSkipped += 1;
      }
    }

    if (sessionMetaCount !== 1 || !safeSessionId(sessionId) || !sessionCwd) {
      recordsSkipped += 1;
      continue;
    }
    let resolvedCwd: string;
    try {
      resolvedCwd = await canonicalPath(sessionCwd);
    } catch {
      continue;
    }
    if (resolvedCwd !== canonicalCwd) continue;
    sessionFileCounts.set(sessionId, (sessionFileCounts.get(sessionId) ?? 0) + 1);
    const scored = scoreContent(searchable.join("\n"), queries, { branch });
    if (scored.score <= 0) continue;
    matches.push({
      rank: 0,
      score: scored.score,
      session: {
        ...(safeBranch(branch) ? { branch: safeBranch(branch) } : {}),
        cwd: resolvedCwd,
        harness: "codex",
        key: `codex:${sessionId}`,
        ...(firstUserMessage
          ? { preview: truncate(redact(firstUserMessage), 240) }
          : {}),
        sessionId,
        sourceKind,
        ...(safeTimestamp(updatedAt) ? { updatedAt: safeTimestamp(updatedAt) } : {}),
      },
      signals: scored.signals,
      updatedAtMs: safeTimestamp(updatedAt) ? Date.parse(safeTimestamp(updatedAt)!) : 0,
    });
  }

  matches.sort(
    (left, right) =>
      right.score - left.score ||
      right.updatedAtMs - left.updatedAtMs ||
      left.session.key.localeCompare(right.session.key),
  );
  const ambiguousSessionIds = new Set(
    Array.from(sessionFileCounts)
      .filter(([, count]) => count > 1)
      .map(([sessionId]) => sessionId),
  );
  recordsSkipped += ambiguousSessionIds.size;
  const uniqueMatches = deduplicateMatches(
    matches.filter((match) => !ambiguousSessionIds.has(match.session.sessionId)),
  );
  if (uniqueMatches.length > maxResults) exhausted.push("result_limit");
  return {
    ambiguousSessionCount: ambiguousSessionIds.size,
    bounds: {
      ...emptyBounds(maxResults),
      bytesRead,
      elapsedMs: elapsedSince(startedAt),
      exhausted: uniqueSorted(exhausted),
      filesRead,
      messagesRead,
      recordsSkipped,
    },
    matches: uniqueMatches
      .slice(0, maxResults)
      .map(({ updatedAtMs: _, ...match }, index) => ({
        ...match,
        rank: index + 1,
      })),
  };
}

async function search(args: string[]): Promise<Envelope<SearchData>> {
  validateOptions("search", args);
  const home = parseHome(args);
  const request = requestedHarnesses(args);
  const requestedCwd = requiredFlag(args, "--cwd");
  const cwd = await canonicalRequestedPath(requestedCwd);
  const queries = flagValues(args, "--query");
  if (queries.length === 0 || queries.length > MAX_QUERIES || queries.some((query) => !query)) {
    throw new InputError(`--query must be provided from 1 to ${MAX_QUERIES} times`);
  }
  if (
    queries.some((query) => Buffer.byteLength(query) > MAX_QUERY_BYTES) ||
    queries.reduce((total, query) => total + Buffer.byteLength(query), 0) >
      MAX_TOTAL_QUERY_BYTES
  ) {
    throw new InputError("--query values exceed the bounded lexical query size");
  }
  const maxResults = parseMaxResults(args);
  const harnesses = await coverage(home, request.harnesses);
  if (request.required && harnesses.some((item) => item.state !== "supported")) {
    return {
      command: "search",
      contractVersion: 1,
      coverage: { complete: false, harnesses },
      data: null,
      status: "blocked",
      warnings: requiredHarnessWarning(harnesses),
    };
  }
  const searchStartedAt = performance.now();
  const claudeCoverage = harnesses.find((item) => item.harness === "claude-code");
  const codexCoverage = harnesses.find((item) => item.harness === "codex");
  const openCodeCoverage = harnesses.find((item) => item.harness === "opencode");
  const reports: BoundsReport[] = [];
  const emptyResult = () => ({ bounds: emptyBounds(maxResults), matches: [] as SearchMatch[] });

  let codex: SearchAdapterResult = emptyResult();
  if (codexCoverage?.state === "supported") {
    try {
      const limits = remainingSearchLimits(reports, searchStartedAt);
      codex =
        codexCoverage.schemaId === "codex-state-v5"
          ? await searchCodex(home, requestedCwd, cwd, queries, maxResults, limits)
          : codexCoverage.schemaId === "codex-rollout-jsonl-v1"
            ? await searchCodexRollouts(home, cwd, queries, maxResults, limits)
            : emptyResult();
    } catch {
      markAdapterUnreadable(harnesses, "codex");
      codex = emptyResult();
    }
    reports.push(codex.bounds);
  }

  let openCode: SearchAdapterResult = emptyResult();
  if (
    openCodeCoverage?.state === "supported" &&
    openCodeCoverage.schemaId === "opencode-sqlite-session-message-part-v1"
  ) {
    try {
      openCode = await searchOpenCode(
        home,
        requestedCwd,
        cwd,
        queries,
        maxResults,
        remainingSearchLimits(reports, searchStartedAt),
      );
    } catch {
      markAdapterUnreadable(harnesses, "opencode");
      openCode = emptyResult();
    }
    reports.push(openCode.bounds);
  }

  let claude: SearchAdapterResult = emptyResult();
  if (claudeCoverage?.state === "supported") {
    try {
      claude = await searchClaude(
        home,
        requestedCwd,
        cwd,
        queries,
        maxResults,
        remainingSearchLimits(reports, searchStartedAt),
      );
    } catch {
      markAdapterUnreadable(harnesses, "claude-code");
      claude = emptyResult();
    }
    if (claude.schemaObserved === false) {
      const item = harnesses.find(
        (coverage) => coverage.harness === "claude-code",
      );
      if (item) {
        item.state = "unsupported-schema";
        item.reasonCode = "unsupported_schema";
        delete item.schemaId;
      }
      claude.matches = [];
    }
    reports.push(claude.bounds);
  }
  if (request.required && harnesses.some((item) => item.state !== "supported")) {
    return {
      command: "search",
      contractVersion: 1,
      coverage: { complete: false, harnesses },
      data: null,
      status: "blocked",
      warnings: requiredHarnessWarning(harnesses),
    };
  }
  const sortedMatches = [...claude.matches, ...codex.matches, ...openCode.matches].sort(
    (left, right) =>
      right.score - left.score ||
      Date.parse(right.session.updatedAt ?? "1970-01-01") -
        Date.parse(left.session.updatedAt ?? "1970-01-01") ||
      left.session.key.localeCompare(right.session.key),
  );
  const uniqueMatches = deduplicateMatches(sortedMatches);
  const combinedMatches = uniqueMatches
    .slice(0, maxResults)
    .map((match, index) => ({ ...match, rank: index + 1 }));
  const bounds = combineBounds(reports, maxResults);
  const ambiguousSessionCount =
    (claude.ambiguousSessionCount ?? 0) +
    (codex.ambiguousSessionCount ?? 0) +
    (openCode.ambiguousSessionCount ?? 0);
  bounds.elapsedMs = elapsedSince(searchStartedAt);
  if (uniqueMatches.length > maxResults) {
    bounds.exhausted.push("result_limit");
  }
  bounds.exhausted = uniqueSorted(bounds.exhausted);
  const coverageComplete = coverageIsComplete(harnesses);
  const complete =
    coverageComplete &&
    bounds.exhausted.length === 0 &&
    bounds.recordsSkipped === 0;
  return {
    command: "search",
    contractVersion: 1,
    coverage: { complete: coverageComplete, harnesses },
    data: {
      bounds,
      contentTrust: "untrusted-transcript",
      matches: combinedMatches,
      queries: queries.map(redact),
      scope: { cwd, kind: "project" },
    },
    status: complete ? "complete" : "partial",
    warnings: [
      ...warningsFor(harnesses),
      ...(bounds.exhausted.length > 0
        ? [
            {
              code: "bounds_exhausted",
              message: `${uniqueSorted(bounds.exhausted).join(", ")}.`,
            },
          ]
        : []),
      ...(ambiguousSessionCount > 0
        ? [
            {
              code: "ambiguous_session",
              message: `${ambiguousSessionCount} ambiguous session identit${
                ambiguousSessionCount === 1 ? "y was" : "ies were"
              } omitted.`,
            },
          ]
        : []),
      ...recordsSkippedWarning(bounds.recordsSkipped),
    ],
  };
}

function parseSessionKey(value: string): { harness: Harness; sessionId: string } {
  const match = /^(claude-code|codex|opencode):(.+)$/.exec(value);
  if (!match || !safeSessionId(match[2])) {
    throw new InputError("--session must be a safe <harness>:<session-id> key");
  }
  return { harness: match[1] as Harness, sessionId: match[2] };
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function deduplicateMatches<T extends SearchMatch>(matches: readonly T[]): T[] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    if (seen.has(match.session.key)) return false;
    seen.add(match.session.key);
    return true;
  });
}

function extractReferences(text: string): {
  commits: string[];
  files: string[];
  issues: string[];
} {
  const issues = text.match(/(?:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+#\d+|#\d+)/g) ?? [];
  const commits = text.match(/\b[0-9a-f]{7,40}\b/g) ?? [];
  const files = Array.from(
    text.matchAll(/\b((?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.[A-Za-z0-9]+)\b/g),
    (match) => match[1],
  );
  return {
    commits: uniqueSorted(commits),
    files: uniqueSorted(files),
    issues: uniqueSorted(issues),
  };
}

function boundedExcerpts(
  messages: TranscriptMessage[],
  sourceBounds: {
    bytesRead: number;
    elapsedMs: number;
    filesRead: number;
    recordsSkipped: number;
  },
): { bounds: InspectBounds; excerpts: RedactedExcerpt[] } {
  const excerpts: RedactedExcerpt[] = [];
  let charactersReturned = 0;
  const exhausted: string[] = [];

  for (let index = 0; index < messages.length; index += 1) {
    if (excerpts.length >= MAX_INSPECT_MESSAGES) {
      exhausted.push("message_limit");
      break;
    }
    const message = messages[index];
    const remaining = MAX_INSPECT_CHARACTERS - charactersReturned;
    if (remaining <= 0) {
      exhausted.push("character_limit");
      break;
    }
    const redaction = redactWithState(message.text);
    const text = truncate(redaction.text, remaining);
    excerpts.push({
      locator: message.locator,
      ordinal: index + 1,
      redacted: redaction.redacted,
      role: message.role,
      text,
      truncated: redaction.text.length > text.length,
    });
    charactersReturned += text.length;
    if (redaction.text.length > text.length) {
      exhausted.push("character_limit");
      break;
    }
  }

  return {
    bounds: {
      bytesRead: sourceBounds.bytesRead,
      charactersReturned,
      elapsedMs: sourceBounds.elapsedMs,
      exhausted: uniqueSorted(exhausted),
      filesRead: sourceBounds.filesRead,
      maxBytes: MAX_BYTES,
      maxCharacters: MAX_INSPECT_CHARACTERS,
      maxFiles: MAX_FILES,
      maxMillis: MAX_MILLIS,
      maxMessages: MAX_INSPECT_MESSAGES,
      messagesRead: messages.length,
      recordsSkipped: sourceBounds.recordsSkipped,
    },
    excerpts,
  };
}

async function inspectClaude(
  home: string,
  requestedCwd: string,
  cwd: string,
  sessionId: string,
): Promise<InspectData | undefined> {
  const startedAt = performance.now();
  const discoveredFiles = await listClaudeJsonl(
    home,
    [requestedCwd, cwd],
    MAX_FILES + 1,
  );
  const files = discoveredFiles.slice(0, MAX_FILES);
  let bytesRead = 0;
  let filesRead = 0;
  let recordsSkipped = 0;
  let identityUnverified = false;
  const exhausted: string[] = discoveredFiles.length > MAX_FILES ? ["file_limit"] : [];
  const candidates: Array<{
    file: string;
    fileSize: number;
    preflight: ClaudePreflight;
  }> = [];

  for (const file of files) {
    if (elapsedSince(startedAt) >= MAX_MILLIS) {
      exhausted.push("time_limit");
      break;
    }
    const metadata = await stat(file);
    const remaining = MAX_BYTES - bytesRead;
    if (remaining <= 0) {
      exhausted.push("byte_limit");
      break;
    }
    const bytesToRead = Math.min(metadata.size, remaining);
    const preflight = await preflightClaudeFile(
      file,
      metadata.size,
      cwd,
      bytesToRead,
      sessionId,
    );
    filesRead += 1;
    bytesRead += preflight?.bytes.length ?? Math.min(bytesToRead, CLAUDE_PREFLIGHT_BYTES);
    if (!preflight) {
      if (Math.min(bytesToRead, CLAUDE_PREFLIGHT_BYTES) < metadata.size) {
        identityUnverified = true;
      }
      recordsSkipped += 1;
      continue;
    }
    candidates.push({ file, fileSize: metadata.size, preflight });
    if (candidates.length > 1) {
      throw new BlockedError(
        "ambiguous_session",
        "Multiple Claude transcript files use the requested session ID.",
      );
    }
  }

  const candidate = candidates[0];
  if (!candidate) return undefined;
  if (identityUnverified || exhausted.length > 0) {
    throw new BlockedError(
      "session_identity_unverified",
      "The bounded scan could not prove that the requested Claude session ID is unique.",
    );
  }

  const remaining = Math.max(0, MAX_BYTES - bytesRead);
  const availableTail = Math.max(
    0,
    candidate.fileSize - candidate.preflight.bytes.length,
  );
  const tailBytes = Math.min(availableTail, remaining);
  const tail = Buffer.from(
    await Bun.file(candidate.file)
      .slice(
        candidate.preflight.bytes.length,
        candidate.preflight.bytes.length + tailBytes,
      )
      .arrayBuffer(),
  );
  bytesRead += tail.length;
  if (tailBytes < availableTail) exhausted.push("byte_limit");
  const text = Buffer.concat([candidate.preflight.bytes, tail]).toString("utf8");
  const messages: TranscriptMessage[] = [];
  let branch: string | undefined;
  let updatedAt: string | undefined;

  for (const [lineIndex, line] of text.split("\n").entries()) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line) as Record<string, unknown>;
      if (!isObservedClaudeRecord(record)) {
        recordsSkipped += 1;
        continue;
      }
      if (record.sessionId !== sessionId) {
        continue;
      }
      try {
        if ((await canonicalPath(record.cwd as string)) !== cwd) {
          recordsSkipped += 1;
          continue;
        }
      } catch {
        recordsSkipped += 1;
        continue;
      }
      if (typeof record.gitBranch === "string") branch ??= record.gitBranch;
      if (typeof record.timestamp === "string") updatedAt = record.timestamp;
      const message = record.message;
      if (!message || typeof message !== "object") continue;
      const role = (message as { role?: unknown }).role;
      if (role !== "user" && role !== "assistant") continue;
      const extracted = extractText((message as { content?: unknown }).content);
      recordsSkipped += extracted.unknownBlocks;
      for (const fragment of extracted.texts) {
        if (messages.length >= MAX_INSPECT_MESSAGES + 1) break;
        messages.push({ locator: `record:${lineIndex + 1}`, role, text: fragment });
      }
      if (messages.length >= MAX_INSPECT_MESSAGES + 1) break;
    } catch {
      // A malformed record cannot authorize reading outside this enumerated file.
      recordsSkipped += 1;
    }
  }

  if (elapsedSince(startedAt) >= MAX_MILLIS) exhausted.push("time_limit");
  const bounded = boundedExcerpts(messages, {
    bytesRead,
    elapsedMs: elapsedSince(startedAt),
    filesRead,
    recordsSkipped,
  });
  bounded.bounds.exhausted = uniqueSorted([
    ...bounded.bounds.exhausted,
    ...exhausted,
  ]);
  const plainText = bounded.excerpts.map((excerpt) => excerpt.text).join("\n");
  const firstUser = messages.find((message) => message.role === "user")?.text;
  return {
    bounds: bounded.bounds,
    contentTrust: "untrusted-transcript",
    excerpts: bounded.excerpts,
    references: extractReferences(redact(plainText)),
    session: {
      ...(safeBranch(branch) ? { branch: safeBranch(branch) } : {}),
      cwd,
      harness: "claude-code",
      key: `claude-code:${sessionId}`,
      ...(firstUser ? { preview: truncate(redact(firstUser), 240) } : {}),
      sessionId,
      ...(safeTimestamp(updatedAt) ? { updatedAt: safeTimestamp(updatedAt) } : {}),
      sourceKind: "transcript",
    },
  };
}

async function inspectCodex(
  home: string,
  requestedCwd: string,
  cwd: string,
  sessionId: string,
): Promise<InspectData | undefined> {
  const startedAt = performance.now();
  const codexHome = join(home, ".codex");
  const statePath = join(codexHome, "state_5.sqlite");
  const historyPath = join(codexHome, "thread_history_1.sqlite");
  if (!(await pathExists(statePath))) {
    return inspectCodexRolloutOnly(codexHome, cwd, sessionId, startedAt);
  }
  await assertNativePath(home, statePath);

  const state = openImmutableDatabase(statePath);
  let thread:
    | {
        agent_path_type: unknown;
        archived: unknown;
        archived_type: unknown;
        cwd: unknown;
        cwd_bytes: unknown;
        cwd_type: unknown;
        first_user_message: unknown;
        first_user_message_bytes: unknown;
        first_user_message_type: unknown;
        git_branch: unknown;
        git_branch_bytes: unknown;
        git_branch_type: unknown;
        history_mode: unknown;
        history_mode_bytes: unknown;
        history_mode_type: unknown;
        id: unknown;
        id_bytes: unknown;
        id_type: unknown;
        recency_at_ms: unknown;
        recency_at_ms_type: unknown;
        rollout_path: unknown;
        rollout_path_bytes: unknown;
        rollout_path_type: unknown;
        thread_source: unknown;
        thread_source_bytes: unknown;
        thread_source_type: unknown;
        title: unknown;
        title_bytes: unknown;
        title_type: unknown;
      }
    | null;
  let stateRowsSkipped = 0;
  try {
    const threadRows = state
      .query<
        NonNullable<typeof thread>,
        [string, string, string]
      >(
        `SELECT substr(id, 1, 128) AS id,
                substr(cwd, 1, 4096) AS cwd,
                substr(title, 1, 512) AS title,
                substr(first_user_message, 1, 1024) AS first_user_message,
                substr(git_branch, 1, 256) AS git_branch,
                recency_at_ms,
                substr(history_mode, 1, 64) AS history_mode,
                substr(rollout_path, 1, 4096) AS rollout_path,
                substr(thread_source, 1, 512) AS thread_source,
                typeof(agent_path) AS agent_path_type,
                typeof(archived) AS archived_type,
                typeof(cwd) AS cwd_type,
                typeof(recency_at_ms) AS recency_at_ms_type,
                typeof(id) AS id_type,
                typeof(title) AS title_type,
                typeof(first_user_message) AS first_user_message_type,
                typeof(git_branch) AS git_branch_type,
                typeof(history_mode) AS history_mode_type,
                typeof(rollout_path) AS rollout_path_type,
                typeof(thread_source) AS thread_source_type,
                length(CAST(id AS BLOB)) AS id_bytes,
                length(CAST(cwd AS BLOB)) AS cwd_bytes,
                length(CAST(title AS BLOB)) AS title_bytes,
                length(CAST(first_user_message AS BLOB)) AS first_user_message_bytes,
                length(CAST(git_branch AS BLOB)) AS git_branch_bytes,
                length(CAST(history_mode AS BLOB)) AS history_mode_bytes,
                length(CAST(rollout_path AS BLOB)) AS rollout_path_bytes,
                length(CAST(thread_source AS BLOB)) AS thread_source_bytes,
                archived
          FROM threads
          WHERE id COLLATE BINARY = ?
            AND (cwd COLLATE BINARY = ? OR cwd COLLATE BINARY = ?)
          LIMIT 2`,
      )
      .all(sessionId, requestedCwd, cwd);
    const validatedRows: NonNullable<typeof thread>[] = [];
    for (const row of threadRows) {
      const id = sqliteExactTextProjection(
        row.id,
        row.id_bytes,
        row.id_type,
        sessionId,
      );
      const scope = await sqliteScopedPathProjection(
        row.cwd,
        row.cwd_bytes,
        row.cwd_type,
        requestedCwd,
        cwd,
      );
      if (!id.matches || !scope.canonical) {
        stateRowsSkipped += 1;
        continue;
      }
      validatedRows.push(row);
    }
    if (validatedRows.length > 1) {
      throw new BlockedError(
        "ambiguous_session",
        "Multiple Codex state rows use the requested session ID.",
      );
    }
    thread = validatedRows[0] ?? null;
  } finally {
    closeImmutableDatabase(state, statePath);
  }
  if (!thread || thread.id_type !== "text") {
    return undefined;
  }
  const canonicalThreadCwd = cwd;

  const messages: TranscriptMessage[] = [];
  const metadata = {
    firstUserMessage: sqliteTextProjection(
      thread.first_user_message,
      thread.first_user_message_bytes,
      thread.first_user_message_type,
    ),
    gitBranch: sqliteTextProjection(
      thread.git_branch,
      thread.git_branch_bytes,
      thread.git_branch_type,
    ),
    historyMode: sqliteTextProjection(
      thread.history_mode,
      thread.history_mode_bytes,
      thread.history_mode_type,
    ),
    rolloutPath: sqliteTextProjection(
      thread.rollout_path,
      thread.rollout_path_bytes,
      thread.rollout_path_type,
    ),
    threadSource: sqliteTextProjection(
      thread.thread_source,
      thread.thread_source_bytes,
      thread.thread_source_type,
    ),
    title: sqliteTextProjection(thread.title, thread.title_bytes, thread.title_type),
  };
  const projectedFields = Object.values(metadata);
  let bytesRead =
    materializedSqliteBytes(thread.id) +
    materializedSqliteBytes(thread.cwd) +
    projectedFields.reduce((total, field) => total + field.materializedBytes, 0);
  let filesRead = 0;
  let recordsSkipped =
    stateRowsSkipped + projectedFields.filter((field) => field.malformed).length;
  const exhausted: string[] = [];
  if (projectedFields.some((field) => field.truncated)) exhausted.push("byte_limit");
  const archived = thread.archived_type === "integer" && thread.archived === 0
    ? false
    : thread.archived_type === "integer" && thread.archived === 1
      ? true
      : undefined;
  if (archived === undefined) recordsSkipped += 1;
  const agentPathPresent = thread.agent_path_type === "null"
    ? false
    : thread.agent_path_type === "text"
      ? true
      : undefined;
  if (agentPathPresent === undefined) recordsSkipped += 1;
  const recency = sqliteTimestampProjection(
    thread.recency_at_ms,
    thread.recency_at_ms_type,
  );
  if (recency.malformed) recordsSkipped += 1;
  const rolloutPath =
    !metadata.rolloutPath.malformed && !metadata.rolloutPath.truncated
      ? metadata.rolloutPath.text
      : null;

  let historyUsable =
    metadata.historyMode.text === "paginated" && (await pathExists(historyPath));
  if (historyUsable) {
    try {
      await assertNativePath(home, historyPath);
      assertNoLiveSqliteSidecar(historyPath);
    } catch {
      historyUsable = false;
      recordsSkipped += 1;
    }
  }
  if (historyUsable) {
    const history = openImmutableDatabase(historyPath);
    try {
      const tables = history
        .query<{ name: string }, []>(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'thread_items'",
        )
        .all();
      if (tables.length === 1) {
        const columns = new Set(
          history
            .query<{ name: string }, []>("PRAGMA table_info(thread_items)")
            .all()
            .map((row) => row.name),
        );
        if (
          hasColumns(columns, [
            "thread_id",
            "item_type",
            "item_json",
            "rollout_ordinal",
          ])
        ) {
          const charactersPerItem = Math.max(
            1,
            Math.floor(
              Math.max(0, MAX_BYTES - bytesRead) /
                ((MAX_INSPECT_MESSAGES + 1) * 4),
            ),
          );
          const rows = history
            .query<
              {
                item_json: unknown;
                item_json_bytes: unknown;
                item_json_type: unknown;
                item_type: string;
                rollout_ordinal: unknown;
                thread_id: unknown;
                thread_id_bytes: unknown;
                thread_id_type: unknown;
              },
              [number, string, number]
            >(
              `SELECT item_type,
                      substr(item_json, 1, ?) AS item_json,
                      substr(thread_id, 1, 128) AS thread_id,
                      typeof(item_json) AS item_json_type,
                      typeof(thread_id) AS thread_id_type,
                      length(CAST(item_json AS BLOB)) AS item_json_bytes,
                      length(CAST(thread_id AS BLOB)) AS thread_id_bytes,
                      rollout_ordinal
                 FROM thread_items
                WHERE thread_id COLLATE BINARY = ?
                  AND item_type IN ('userMessage', 'agentMessage')
                ORDER BY rollout_ordinal
                LIMIT ?`,
            )
            .all(charactersPerItem, sessionId, MAX_INSPECT_MESSAGES + 1);
          filesRead = 1;
          for (const [rowIndex, row] of rows
            .slice(0, MAX_INSPECT_MESSAGES)
            .entries()) {
            const key = sqliteExactTextProjection(
              row.thread_id,
              row.thread_id_bytes,
              row.thread_id_type,
              sessionId,
            );
            const rowBytes =
              materializedSqliteBytes(row.item_json) + key.materializedBytes;
            if (bytesRead + rowBytes > MAX_BYTES) {
              exhausted.push("byte_limit");
              break;
            }
            if (elapsedSince(startedAt) >= MAX_MILLIS) {
              exhausted.push("time_limit");
              break;
            }
            bytesRead += rowBytes;
            if (
              typeof row.item_json !== "string" ||
              row.item_json_type !== "text" ||
              !key.matches ||
              typeof row.item_json_bytes !== "number"
            ) {
              recordsSkipped += 1;
              continue;
            }
            if (row.item_json_bytes > rowBytes) exhausted.push("byte_limit");
            try {
              const item = JSON.parse(row.item_json) as {
                content?: unknown;
                schemaVersion?: unknown;
                text?: unknown;
              };
              const projection = codexProjectionText(row.item_type, item);
              const rolloutOrdinal = safeRolloutOrdinal(row.rollout_ordinal);
              if (rolloutOrdinal === undefined) recordsSkipped += 1;
              if (!projection) {
                recordsSkipped += 1;
              } else {
                recordsSkipped += projection.unknownBlocks;
                for (const text of projection.texts) {
                  messages.push({
                    locator: `item:${rolloutOrdinal ?? rowIndex + 1}`,
                    role: projection.role,
                    text,
                  });
                }
              }
            } catch {
              // Unknown projection items are excluded without invalidating known text.
              recordsSkipped += 1;
            }
          }
          if (rows.length > MAX_INSPECT_MESSAGES) exhausted.push("message_limit");
        } else {
          recordsSkipped += 1;
        }
      } else {
        recordsSkipped += 1;
      }
    } finally {
      closeImmutableDatabase(history, historyPath);
    }
  }

  if (messages.length === 0 && rolloutPath) {
    const rollout = await readCodexRollout(
      codexHome,
      rolloutPath,
      sessionId,
      canonicalThreadCwd,
      startedAt,
      Math.max(0, MAX_BYTES - bytesRead),
    );
    if (rollout?.matched) {
      messages.push(...rollout.messages);
      bytesRead += rollout.bytesRead;
      filesRead = 1;
      recordsSkipped += rollout.recordsSkipped;
      exhausted.push(...rollout.exhausted);
    } else {
      recordsSkipped += rollout?.recordsSkipped ?? 1;
    }
  }
  const bounded = boundedExcerpts(messages, {
    bytesRead,
    elapsedMs: elapsedSince(startedAt),
    filesRead,
    recordsSkipped,
  });
  bounded.bounds.exhausted = uniqueSorted([
    ...bounded.bounds.exhausted,
    ...exhausted,
  ]);
  const plainText = bounded.excerpts.map((excerpt) => excerpt.text).join("\n");
  const firstUser = messages.find((message) => message.role === "user")?.text;
  const updatedAt = recency.timestamp;
  return {
    bounds: bounded.bounds,
    contentTrust: "untrusted-transcript",
    excerpts: bounded.excerpts,
    references: extractReferences(redact(plainText)),
    session: {
      ...(archived !== undefined ? { archived } : {}),
      ...(safeBranch(metadata.gitBranch.text)
        ? { branch: safeBranch(metadata.gitBranch.text) }
        : {}),
      cwd: canonicalThreadCwd,
      harness: "codex",
      key: `codex:${sessionId}`,
      ...(firstUser || metadata.firstUserMessage.text || metadata.title.text
        ? {
            preview: truncate(
              redact(
                firstUser ??
                  metadata.firstUserMessage.text ??
                  metadata.title.text ??
                  "",
              ),
              240,
            ),
          }
        : {}),
      sessionId,
      sourceKind: codexSourceKind(
        metadata.threadSource.text,
        agentPathPresent ? "present" : null,
      ),
      ...(updatedAt ? { updatedAt } : {}),
    },
  };
}

function codexRolloutText(content: unknown): string[] | undefined {
  if (!Array.isArray(content)) return undefined;
  const result: string[] = [];
  for (const block of content) {
    if (!block || typeof block !== "object") return undefined;
    const type = (block as { type?: unknown }).type;
    const text = (block as { text?: unknown }).text;
    if (
      (type !== "input_text" && type !== "output_text") ||
      typeof text !== "string"
    ) return undefined;
    result.push(text);
  }
  return result;
}

const CODEX_IGNORED_ROLLOUT_RECORD_TYPES = new Set(["event_msg", "turn_context"]);
const CODEX_IGNORED_RESPONSE_ITEM_TYPES = new Set([
  "computer_initialize_state",
  "computer_screenshot",
  "custom_tool_call",
  "custom_tool_call_output",
  "file_search_call",
  "function_call",
  "function_call_output",
  "image_generation_call",
  "local_shell_call",
  "mcp_tool_call",
  "mcp_tool_call_output",
  "reasoning",
  "web_search_call",
]);

function codexRolloutMessage(
  payload: {
    content?: unknown;
    role?: unknown;
    type?: unknown;
  } | undefined,
):
  | { kind: "ignored" }
  | { kind: "message"; role: "assistant" | "user"; texts: string[] }
  | undefined {
  if (!payload || typeof payload.type !== "string") return undefined;
  if (payload.type !== "message") {
    return CODEX_IGNORED_RESPONSE_ITEM_TYPES.has(payload.type)
      ? { kind: "ignored" }
      : undefined;
  }
  if (payload.role === "developer" || payload.role === "system") {
    return { kind: "ignored" };
  }
  if (payload.role !== "user" && payload.role !== "assistant") return undefined;
  const texts = codexRolloutText(payload.content);
  return texts ? { kind: "message", role: payload.role, texts } : undefined;
}

function pathIsWithin(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith("..") && !isAbsolute(relation));
}

async function readCodexRollout(
  codexHome: string,
  rolloutPath: string,
  expectedSessionId: string,
  expectedCwd: string,
  startedAt: number,
  maxBytes: number,
): Promise<
  | {
      branch?: string;
      bytesRead: number;
      exhausted: string[];
      matched: boolean;
      messages: TranscriptMessage[];
      recordsSkipped: number;
      sourceKind: string;
      updatedAt?: string;
    }
  | undefined
> {
  if (!isAbsolute(rolloutPath)) return undefined;
  let sessionsRoot: string;
  let resolvedRollout: string;
  try {
    sessionsRoot = await assertNativePath(codexHome, join(codexHome, "sessions"));
    resolvedRollout = await assertNativePath(codexHome, rolloutPath);
  } catch {
    return undefined;
  }
  if (!pathIsWithin(sessionsRoot, resolvedRollout)) return undefined;

  const metadata = await stat(resolvedRollout);
  const prefixBytes = Math.min(metadata.size, maxBytes, 65_536);
  const prefix = await Bun.file(resolvedRollout).slice(0, prefixBytes).text();
  let prefixMatches = false;
  for (const line of prefix.split("\n")) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line) as {
        payload?: { cwd?: unknown; id?: unknown; schemaVersion?: unknown };
        schemaVersion?: unknown;
        type?: unknown;
      };
      if (
        record.schemaVersion !== undefined ||
        record.payload?.schemaVersion !== undefined
      ) continue;
      if (record.type !== "session_meta") continue;
      if (
        record.payload?.id === expectedSessionId &&
        typeof record.payload.cwd === "string"
      ) {
        try {
          prefixMatches = (await canonicalPath(record.payload.cwd)) === expectedCwd;
        } catch {
          prefixMatches = false;
        }
        if (prefixMatches) break;
      }
    } catch {
      // Continue through the bounded metadata prefix.
    }
  }
  if (!prefixMatches) {
    return {
      bytesRead: Buffer.byteLength(prefix),
      exhausted: prefixBytes < metadata.size ? ["byte_limit"] : [],
      matched: false,
      messages: [],
      recordsSkipped: 0,
      sourceKind: "unknown",
    };
  }
  const additionalBytes = Math.min(
    Math.max(0, metadata.size - prefixBytes),
    Math.max(0, maxBytes - Buffer.byteLength(prefix)),
  );
  const additional =
    additionalBytes > 0
      ? await Bun.file(resolvedRollout)
          .slice(prefixBytes, prefixBytes + additionalBytes)
          .text()
      : "";
  const text = `${prefix}${additional}`;
  const messages: TranscriptMessage[] = [];
  let branch: string | undefined;
  let metaMatches = false;
  let sessionMetaCount = 0;
  let recordsSkipped = 0;
  let sourceKind = "unknown";
  let updatedAt: string | undefined;
  for (const [lineIndex, line] of text.split("\n").entries()) {
    if (!line.trim()) continue;
    if (elapsedSince(startedAt) >= MAX_MILLIS) break;
    try {
      const record = JSON.parse(line) as {
        payload?: {
          content?: unknown;
          cwd?: unknown;
          git?: { branch?: unknown };
          id?: unknown;
          role?: unknown;
          schemaVersion?: unknown;
          source?: unknown;
          type?: unknown;
        };
        schemaVersion?: unknown;
        timestamp?: unknown;
        type?: unknown;
      };
      if (
        record.schemaVersion !== undefined ||
        record.payload?.schemaVersion !== undefined
      ) {
        recordsSkipped += 1;
        continue;
      }
      if (typeof record.timestamp === "string") updatedAt = record.timestamp;
      if (record.type === "session_meta") {
        sessionMetaCount += 1;
        if (sessionMetaCount > 1) {
          recordsSkipped += 1;
          continue;
        }
        if (
          record.payload?.id === expectedSessionId &&
          typeof record.payload.cwd === "string"
        ) {
          try {
            metaMatches = (await canonicalPath(record.payload.cwd)) === expectedCwd;
          } catch {
            metaMatches = false;
          }
        }
        if (typeof record.payload?.git?.branch === "string") {
          branch = record.payload.git.branch;
        }
        sourceKind = codexSourceKind(record.payload?.source, null);
        continue;
      }
      if (CODEX_IGNORED_ROLLOUT_RECORD_TYPES.has(String(record.type))) {
        continue;
      }
      if (record.type !== "response_item") {
        recordsSkipped += 1;
        continue;
      }
      const message = codexRolloutMessage(record.payload);
      if (!message) {
        recordsSkipped += 1;
        continue;
      }
      if (message.kind === "ignored") continue;
      for (const fragment of message.texts) {
        if (messages.length >= MAX_INSPECT_MESSAGES + 1) break;
        messages.push({
          locator: `record:${lineIndex + 1}`,
          role: message.role,
          text: fragment,
        });
      }
      if (messages.length >= MAX_INSPECT_MESSAGES + 1) break;
    } catch {
      // Malformed rollout records never broaden the validated file or schema.
      recordsSkipped += 1;
    }
  }
  const exhausted: string[] = [];
  if (prefixBytes + additionalBytes < metadata.size) exhausted.push("byte_limit");
  if (elapsedSince(startedAt) >= MAX_MILLIS) exhausted.push("time_limit");
  if (messages.length > MAX_INSPECT_MESSAGES) exhausted.push("message_limit");
  return {
    ...(branch ? { branch } : {}),
    bytesRead: Buffer.byteLength(text),
    exhausted,
    matched: metaMatches && sessionMetaCount === 1,
    messages: metaMatches && sessionMetaCount === 1 ? messages : [],
    recordsSkipped,
    sourceKind,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

async function inspectCodexRolloutOnly(
  codexHome: string,
  cwd: string,
  sessionId: string,
  startedAt: number,
): Promise<InspectData | undefined> {
  const sessionsDirectory = join(codexHome, "sessions");
  if (await pathExists(sessionsDirectory)) {
    await assertNativePath(codexHome, sessionsDirectory);
  }
  const discoveredFiles = await listJsonl(sessionsDirectory, MAX_FILES + 1);
  const files = discoveredFiles.slice(0, MAX_FILES);
  let bytesRead = 0;
  let filesRead = 0;
  let recordsSkipped = 0;
  let identityUnverified = false;
  let matchedRollout:
    | NonNullable<Awaited<ReturnType<typeof readCodexRollout>>>
    | undefined;
  const exhausted: string[] = discoveredFiles.length > MAX_FILES ? ["file_limit"] : [];
  for (const file of files) {
    const remainingBytes = MAX_BYTES - bytesRead;
    if (remainingBytes <= 0) {
      exhausted.push("byte_limit");
      break;
    }
    if (elapsedSince(startedAt) >= MAX_MILLIS) {
      exhausted.push("time_limit");
      break;
    }
    const rollout = await readCodexRollout(
      codexHome,
      file,
      sessionId,
      cwd,
      startedAt,
      remainingBytes,
    );
    filesRead += 1;
    if (!rollout) {
      identityUnverified = true;
      recordsSkipped += 1;
      continue;
    }
    bytesRead += rollout.bytesRead;
    recordsSkipped += rollout.recordsSkipped;
    exhausted.push(...rollout.exhausted);
    if (!rollout.matched && rollout.exhausted.length > 0) {
      identityUnverified = true;
    }
    if (!rollout.matched) continue;
    if (matchedRollout) {
      throw new BlockedError(
        "ambiguous_session",
        "Multiple Codex rollout files use the requested session ID.",
      );
    }
    matchedRollout = rollout;
  }
  if (!matchedRollout) return undefined;
  if (
    identityUnverified ||
    discoveredFiles.length > MAX_FILES ||
    filesRead < files.length ||
    matchedRollout.exhausted.length > 0
  ) {
    throw new BlockedError(
      "session_identity_unverified",
      "The bounded scan could not prove that the requested Codex session ID is unique.",
    );
  }

  const bounded = boundedExcerpts(matchedRollout.messages, {
    bytesRead,
    elapsedMs: elapsedSince(startedAt),
    filesRead,
    recordsSkipped,
  });
  bounded.bounds.exhausted = uniqueSorted([
    ...bounded.bounds.exhausted,
    ...exhausted,
  ]);
  const plainText = bounded.excerpts.map((excerpt) => excerpt.text).join("\n");
  const firstUser = matchedRollout.messages.find(
    (message) => message.role === "user",
  )?.text;
  return {
    bounds: bounded.bounds,
    contentTrust: "untrusted-transcript",
    excerpts: bounded.excerpts,
    references: extractReferences(redact(plainText)),
    session: {
      ...(matchedRollout.branch
        ? { branch: truncate(redact(matchedRollout.branch), 160) }
        : {}),
      cwd,
      harness: "codex",
      key: `codex:${sessionId}`,
      ...(firstUser ? { preview: truncate(redact(firstUser), 240) } : {}),
      sessionId,
      sourceKind: matchedRollout.sourceKind,
      ...(safeTimestamp(matchedRollout.updatedAt)
        ? { updatedAt: safeTimestamp(matchedRollout.updatedAt) }
        : {}),
    },
  };
}

async function inspectOpenCode(
  home: string,
  requestedCwd: string,
  cwd: string,
  sessionId: string,
): Promise<InspectData | undefined> {
  const startedAt = performance.now();
  const path = join(home, ".local", "share", "opencode", "opencode.db");
  if (!(await pathExists(path))) {
    return undefined;
  }
  await assertNativePath(home, path);

  const database = openImmutableDatabase(path);
  try {
    const sessionRows = database
      .query<
        {
          directory: unknown;
          directory_bytes: unknown;
          directory_type: unknown;
          id: unknown;
          id_bytes: unknown;
          id_type: unknown;
          parent_id_type: unknown;
          time_archived: unknown;
          time_archived_type: unknown;
          time_updated: unknown;
          time_updated_type: unknown;
          title: unknown;
          title_bytes: unknown;
          title_type: unknown;
        },
        [string, string, string]
      >(
        `SELECT substr(id, 1, 128) AS id,
                substr(directory, 1, 4096) AS directory,
                substr(title, 1, 512) AS title,
                typeof(directory) AS directory_type,
                typeof(id) AS id_type,
                typeof(parent_id) AS parent_id_type,
                typeof(title) AS title_type,
                typeof(time_updated) AS time_updated_type,
                typeof(time_archived) AS time_archived_type,
                length(CAST(id AS BLOB)) AS id_bytes,
                length(CAST(directory AS BLOB)) AS directory_bytes,
                length(CAST(title AS BLOB)) AS title_bytes,
                time_updated, time_archived
          FROM session
          WHERE id COLLATE BINARY = ?
            AND (directory COLLATE BINARY = ? OR directory COLLATE BINARY = ?)
          LIMIT 2`,
      )
      .all(sessionId, requestedCwd, cwd);
    const validatedSessions: typeof sessionRows = [];
    let stateRowsSkipped = 0;
    for (const row of sessionRows) {
      const id = sqliteExactTextProjection(
        row.id,
        row.id_bytes,
        row.id_type,
        sessionId,
      );
      const scope = await sqliteScopedPathProjection(
        row.directory,
        row.directory_bytes,
        row.directory_type,
        requestedCwd,
        cwd,
      );
      if (!id.matches || !scope.canonical) {
        stateRowsSkipped += 1;
        continue;
      }
      validatedSessions.push(row);
    }
    if (validatedSessions.length > 1) {
      throw new BlockedError(
        "ambiguous_session",
        "Multiple OpenCode state rows use the requested session ID.",
      );
    }
    const session = validatedSessions[0];
    if (!session || session.id_type !== "text") {
      return undefined;
    }
    const canonicalSessionCwd = cwd;
    let recordsSkipped = stateRowsSkipped;
    const title = sqliteTextProjection(
      session.title,
      session.title_bytes,
      session.title_type,
    );
    if (title.malformed) recordsSkipped += 1;
    const hasParent = session.parent_id_type === "null"
      ? false
      : session.parent_id_type === "text"
        ? true
        : undefined;
    if (hasParent === undefined) recordsSkipped += 1;
    const archivedAt = sqliteTimestampProjection(
      session.time_archived,
      session.time_archived_type,
    );
    if (archivedAt.malformed) recordsSkipped += 1;
    const archived = archivedAt.malformed
      ? undefined
      : session.time_archived_type === "null"
        ? false
        : true;
    const updated = sqliteTimestampProjection(
      session.time_updated,
      session.time_updated_type,
    );
    if (updated.malformed) recordsSkipped += 1;

    const titleProjectionBytes =
      title.materializedBytes +
      materializedSqliteBytes(session.id) +
      materializedSqliteBytes(session.directory);
    const charactersPerProjection = Math.max(
      1,
      Math.floor(
        Math.max(0, MAX_BYTES - titleProjectionBytes) /
          ((MAX_INSPECT_MESSAGES + 1) * 2 * 4),
      ),
    );
    const rows = database
      .query<
        {
          message_bytes: unknown;
          message_data: unknown;
          message_id: unknown;
          message_id_bytes: unknown;
          message_id_type: unknown;
          message_session_id: unknown;
          message_session_id_bytes: unknown;
          message_session_id_type: unknown;
          message_type: unknown;
          part_bytes: unknown;
          part_data: unknown;
          part_id: unknown;
          part_id_type: unknown;
          part_message_id: unknown;
          part_message_id_bytes: unknown;
          part_message_id_type: unknown;
          part_type: unknown;
        },
        [number, number, string, number]
      >(
        `SELECT substr(m.data, 1, ?) AS message_data,
                substr(p.data, 1, ?) AS part_data,
                substr(p.id, 1, 128) AS part_id,
                substr(m.id, 1, 128) AS message_id,
                substr(m.session_id, 1, 128) AS message_session_id,
                substr(p.message_id, 1, 128) AS part_message_id,
                typeof(m.data) AS message_type,
                typeof(p.data) AS part_type,
                typeof(p.id) AS part_id_type,
                typeof(m.id) AS message_id_type,
                typeof(m.session_id) AS message_session_id_type,
                typeof(p.message_id) AS part_message_id_type,
                length(CAST(m.data AS BLOB)) AS message_bytes,
                length(CAST(p.data AS BLOB)) AS part_bytes,
                length(CAST(m.id AS BLOB)) AS message_id_bytes,
                length(CAST(m.session_id AS BLOB)) AS message_session_id_bytes,
                length(CAST(p.message_id AS BLOB)) AS part_message_id_bytes
           FROM message AS m
           JOIN part AS p ON p.message_id COLLATE BINARY = m.id COLLATE BINARY
          WHERE m.session_id COLLATE BINARY = ?
          ORDER BY p.time_created
          LIMIT ?`,
      )
      .all(
        charactersPerProjection,
        charactersPerProjection,
        sessionId,
        MAX_INSPECT_MESSAGES + 1,
      );
    const messages: TranscriptMessage[] = [];
    let bytesRead = titleProjectionBytes;
    const exhausted: string[] = [];
    if (title.truncated) exhausted.push("byte_limit");
    for (const [rowIndex, row] of rows.slice(0, MAX_INSPECT_MESSAGES).entries()) {
      const messageId = sqliteTextProjection(
        row.message_id,
        row.message_id_bytes,
        row.message_id_type,
      );
      const messageSessionId = sqliteExactTextProjection(
        row.message_session_id,
        row.message_session_id_bytes,
        row.message_session_id_type,
        sessionId,
      );
      const partMessageId = sqliteTextProjection(
        row.part_message_id,
        row.part_message_id_bytes,
        row.part_message_id_type,
      );
      const rowBytes =
        materializedSqliteBytes(row.message_data) +
        materializedSqliteBytes(row.part_data) +
        materializedSqliteBytes(row.part_id) +
        messageId.materializedBytes +
        messageSessionId.materializedBytes +
        partMessageId.materializedBytes;
      if (bytesRead + rowBytes > MAX_BYTES) {
        exhausted.push("byte_limit");
        break;
      }
      if (elapsedSince(startedAt) >= MAX_MILLIS) {
        exhausted.push("time_limit");
        break;
      }
      bytesRead += rowBytes;
      if (
        typeof row.message_data !== "string" ||
        typeof row.part_data !== "string" ||
        row.message_type !== "text" ||
        row.part_type !== "text" ||
        messageId.malformed ||
        messageId.truncated ||
        messageId.text === null ||
        !messageSessionId.matches ||
        partMessageId.malformed ||
        partMessageId.truncated ||
        partMessageId.text !== messageId.text ||
        typeof row.message_bytes !== "number" ||
        typeof row.part_bytes !== "number"
      ) {
        recordsSkipped += 1;
        continue;
      }
      if (
        row.message_bytes > Buffer.byteLength(row.message_data) ||
        row.part_bytes > Buffer.byteLength(row.part_data)
      ) {
        exhausted.push("byte_limit");
      }
      try {
        const message = JSON.parse(row.message_data) as {
          role?: unknown;
          schemaVersion?: unknown;
        };
        const part = JSON.parse(row.part_data) as {
          schemaVersion?: unknown;
          text?: unknown;
          type?: unknown;
        };
        const projection = openCodeProjection(message, part);
        if (!projection) {
          recordsSkipped += 1;
          continue;
        }
        if (projection.text !== undefined) {
          const safePartId =
            row.part_id_type === "text" && safeSessionId(row.part_id);
          if (!safePartId) recordsSkipped += 1;
          messages.push({
            locator: `part:${safePartId ? row.part_id : rowIndex + 1}`,
            role: projection.role,
            text: projection.text,
          });
        }
      } catch {
        // Unknown records remain excluded.
        recordsSkipped += 1;
      }
    }
    const bounded = boundedExcerpts(messages, {
      bytesRead,
      elapsedMs: elapsedSince(startedAt),
      filesRead: 1,
      recordsSkipped,
    });
    if (rows.length > MAX_INSPECT_MESSAGES) exhausted.push("message_limit");
    bounded.bounds.exhausted = uniqueSorted([
      ...bounded.bounds.exhausted,
      ...exhausted,
    ]);
    const plainText = bounded.excerpts.map((excerpt) => excerpt.text).join("\n");
    const firstUser = messages.find((message) => message.role === "user")?.text;
    const updatedAt = updated.timestamp;
    return {
      bounds: bounded.bounds,
      contentTrust: "untrusted-transcript",
      excerpts: bounded.excerpts,
      references: extractReferences(redact(plainText)),
      session: {
        ...(archived !== undefined ? { archived } : {}),
        cwd: canonicalSessionCwd,
        harness: "opencode",
        key: `opencode:${sessionId}`,
        ...(firstUser || title.text
          ? { preview: truncate(redact(firstUser ?? title.text ?? ""), 240) }
          : {}),
        sessionId,
        sourceKind: hasParent === undefined ? "unknown" : hasParent ? "child" : "root",
        ...(updatedAt ? { updatedAt } : {}),
      },
    };
  } finally {
    closeImmutableDatabase(database, path);
  }
}

async function inspect(args: string[]): Promise<Envelope<InspectData>> {
  validateOptions("inspect", args);
  const home = parseHome(args);
  const requestedCwd = requiredFlag(args, "--cwd");
  const cwd = await canonicalRequestedPath(requestedCwd);
  const key = parseSessionKey(requiredFlag(args, "--session"));
  const request = requestedHarnesses(args);
  if (
    request.required &&
    (request.harnesses.length !== 1 || request.harnesses[0] !== key.harness)
  ) {
    throw new InputError("--harness must appear once and match the --session prefix");
  }
  const harnesses = await coverage(home, request.harnesses);
  if (request.required && harnesses.some((item) => item.state !== "supported")) {
    return {
      command: "inspect",
      contractVersion: 1,
      coverage: { complete: false, harnesses },
      data: null,
      status: "blocked",
      warnings: requiredHarnessWarning(harnesses),
    };
  }
  const keyCoverage = harnesses.find((item) => item.harness === key.harness);
  if (keyCoverage?.state !== "supported") {
    return {
      command: "inspect",
      contractVersion: 1,
      coverage: { complete: false, harnesses },
      data: null,
      status: "blocked",
      warnings: [
        {
          code: "requested_harness_unavailable",
          message: `${key.harness}=${keyCoverage?.state ?? "not-selected"}.`,
        },
      ],
    };
  }
  let data: InspectData | undefined;
  try {
    data =
      key.harness === "claude-code"
        ? await inspectClaude(home, requestedCwd, cwd, key.sessionId)
        : key.harness === "codex"
          ? keyCoverage.schemaId === "codex-rollout-jsonl-v1"
            ? await inspectCodexRolloutOnly(
                join(home, ".codex"),
                cwd,
                key.sessionId,
                performance.now(),
              )
            : await inspectCodex(home, requestedCwd, cwd, key.sessionId)
          : key.harness === "opencode"
            ? await inspectOpenCode(home, requestedCwd, cwd, key.sessionId)
            : undefined;
  } catch (error) {
    if (error instanceof BlockedError) {
      return {
        command: "inspect",
        contractVersion: 1,
        coverage: { complete: false, harnesses },
        data: null,
        status: "blocked",
        warnings: [{ code: error.code, message: redact(error.message) }],
      };
    }
    markAdapterUnreadable(harnesses, key.harness);
    return {
      command: "inspect",
      contractVersion: 1,
      coverage: { complete: false, harnesses },
      data: null,
      status: "blocked",
      warnings: [
        {
          code: "adapter_read_failed",
          message: `${key.harness}=unreadable.`,
        },
      ],
    };
  }
  if (!data) {
    return {
      command: "inspect",
      contractVersion: 1,
      coverage: { complete: false, harnesses },
      data: null,
      status: "blocked",
      warnings: [
        {
          code: "approved_scope_unsatisfied",
          message: "The requested session was not found in the approved workspace.",
        },
      ],
    };
  }
  const coverageComplete = coverageIsComplete(harnesses);
  const complete =
    coverageComplete &&
    data.bounds.exhausted.length === 0 &&
    data.bounds.recordsSkipped === 0;
  return {
    command: "inspect",
    contractVersion: 1,
    coverage: { complete: coverageComplete, harnesses },
    data,
    status: complete ? "complete" : "partial",
    warnings: [
      ...warningsFor(harnesses),
      ...(data.bounds.exhausted.length > 0
        ? [
            {
              code: "bounds_exhausted",
              message: `${uniqueSorted(data.bounds.exhausted).join(", ")}.`,
            },
          ]
        : []),
      ...recordsSkippedWarning(data.bounds.recordsSkipped),
    ],
  };
}

const [command, ...args] = process.argv.slice(2);
try {
  const output =
    command === "doctor"
      ? await doctor(args)
      : command === "search"
        ? await search(args)
        : command === "inspect"
          ? await inspect(args)
        : undefined;
  if (!output) {
    throw new InputError("Usage: kickoff-helper.ts doctor|search|inspect");
  }
  process.stdout.write(`${JSON.stringify(output)}\n`);
  if (output.status === "blocked") {
    process.exit(3);
  }
} catch (error) {
  const inputError = error instanceof InputError;
  const blockedError = error instanceof BlockedError;
  const output: Envelope<null> = {
    command:
      command === "doctor" || command === "search" || command === "inspect"
        ? command
        : null,
    contractVersion: 1,
    coverage: { complete: false, harnesses: [] },
    data: null,
    status: blockedError ? "blocked" : "error",
    warnings: [
      {
        code: inputError
          ? "invalid_input"
          : blockedError
            ? error.code
            : "internal_error",
        message:
          inputError || blockedError
            ? redact((error as Error).message)
            : "The helper could not safely complete the request.",
      },
    ],
  };
  process.stdout.write(`${JSON.stringify(output)}\n`);
  process.exit(inputError ? 2 : blockedError ? 3 : 1);
}
