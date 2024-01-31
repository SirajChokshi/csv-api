export const RESERVED_PREFIXES = ["!", "@"];
export const INDEX_HIDDEN_FIELD_PREFIXES = ["$", "!"];
export const ENTRY_HIDDEN_FIELD_PREFIXES = ["$"];

export enum InternalErrorCodes {
  REQUEST_TOO_BIG = "REQUEST_TOO_BIG",
  CSV_NOT_FOUND = "CSV_NOT_FOUND",
  UNKNOWN = "UNKNOWN",
}
