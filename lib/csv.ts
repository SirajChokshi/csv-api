import * as Papa from "papaparse";
import { CsvFromUrlResponse } from "./response";
import {
  InternalErrorCodes,
  ENTRY_HIDDEN_FIELD_PREFIXES,
  INDEX_HIDDEN_FIELD_PREFIXES,
  RESERVED_PREFIXES,
} from "./const";

type Row = {
  // reserved keys
  $http?: string;
} & Record<string, string>;

type CsvFromUrlOptions = {
  url: string;
  query?: {
    field: string;
    value: string;
  };
};

type columnFilterMode = "index" | "entry";

/**
 * Filters a given row based on the provided mode.
 * If the mode is "index", it removes unique identifiers (starting with "@") and hidden fields (starting with "$" or "!").
 * If the mode is "entry", it removes unique identifiers, hidden fields (starting with "$"), and shallow ids on entries (starting with "!").
 * The function returns the filtered row.
 */
function processRow(row: any, mode: columnFilterMode) {
  const hiddenFieldPrefixes =
    mode === "index"
      ? INDEX_HIDDEN_FIELD_PREFIXES
      : ENTRY_HIDDEN_FIELD_PREFIXES;

  Object.keys(row).forEach((key) => {
    if (hiddenFieldPrefixes.some((prefix) => key.startsWith(prefix))) {
      // delete hidden fields
      delete row[key];
    }

    RESERVED_PREFIXES.some((prefix) => {
      if (key.startsWith(prefix)) {
        const newKey = key.slice(1);
        const value = row[key];

        delete row[key];

        row[newKey] = value;
      }
    });
  });

  return row;
}

export async function processCsvFromUrl(
  options: CsvFromUrlOptions
): Promise<CsvFromUrlResponse> {
  try {
    const res = await fetch(options.url);

    if (res.status !== 200) {
      return {
        type: "internal-error",
        code: InternalErrorCodes.CSV_NOT_FOUND,
        message: "CSV could not be found.",
      };
    }

    const raw = await res.text();

    const parsed = Papa.parse(raw, { header: true });

    if (parsed.data.length > 50) {
      return {
        type: "internal-error",
        message: "CSV must contain 50 rows or less.",
        code: InternalErrorCodes.REQUEST_TOO_BIG,
      };
    }

    if (options.query !== undefined) {
      const entryRow = parsed.data.find(
        (row: any) => row[`@${options.query!.field}`] === options.query!.value
      ) as Row;

      if (!entryRow) {
        return {
          type: "external-error",
          status: 404,
          message: `Entry with '${options.query.field}' of '${options.query.value}' not found.`,
        };
      }

      if (
        entryRow.$http &&
        !isNaN(Number(entryRow.$http)) &&
        Number(entryRow.$http) !== 200
      ) {
        return {
          type: "external-error",
          status: Number(entryRow.$http),
          message: "HTTP Error",
        };
      }

      return {
        type: "response",
        status: 200,
        data: processRow(entryRow, "entry"),
      };
    }

    const processedRows = parsed.data.map((row) => processRow(row, "index"));

    return {
      type: "response",
      status: res.status,
      data: processedRows,
    };
  } catch (e) {
    console.error(e);

    return {
      type: "internal-error",
      message: "Internal Servor Error",
      code: InternalErrorCodes.UNKNOWN,
    };
  }
}
