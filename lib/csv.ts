import * as Papa from "papaparse";
import { InternalErrorCodes } from "./error";

type Row = {
  $http?: string;
} & Record<string, string>;

type InternalError = {
  type: "internal-error";
  message: string;
  code: InternalErrorCodes;
};

type ExternalError = {
  type: "external-error";
  status: number;
  message: string;
};

type FulfilledResponse = {
  type: "response";
  status: number;
  data?: unknown;
};

type CsvFromUrlResponse = InternalError | ExternalError | FulfilledResponse;

type CsvFromUrlOptions = {
  url: string;
  query?: {
    field: string;
    value: string;
  };
};

type columnFilterMode = "index" | "entry";

function filterColumn(row: any, mode: columnFilterMode) {
  const prefixes = mode === "index" ? ["$", "!"] : ["$"];

  Object.keys(row).forEach((key) => {
    if (key.startsWith("@")) {
      // remove unique ids
      const newKey = key.slice(1);
      const value = row[key];

      delete row[key];

      row[newKey] = value;
    }

    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      // delete hidden fields
      delete row[key];
    }

    if (mode === "entry") {
      if (key.startsWith("!")) {
        // remove shallow ids on entries

        const newKey = key.slice(1);
        const value = row[key];

        delete row[key];

        row[newKey] = value;
      }
    }
  });

  return row;
}

export async function csvFromUrl(
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
          message: `Entry with ${options.query.field} of ${options.query.value} not found.`,
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
        data: filterColumn(entryRow, "entry"),
      };
    }

    const finalIndex = parsed.data.map((row) => filterColumn(row, "index"));

    return {
      type: "response",
      status: res.status,
      data: finalIndex,
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
