import { InternalErrorCodes } from "./const";

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

export type CsvFromUrlResponse =
  | InternalError
  | ExternalError
  | FulfilledResponse;
