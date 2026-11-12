import HttpStatus from "http-status-codes";

import * as Errors from "../errors.js";

export interface Details extends Errors.Details {
  reason: string;
}

export class InvalidActionError extends Errors.MassiveDecksError<Details> {
  public readonly status = HttpStatus.BAD_REQUEST;
  public readonly reason: string;

  public constructor(reason: string) {
    super(`Bad request: ${reason}`);
    this.reason = reason;
    Error.captureStackTrace(this, InvalidActionError);
  }

  public details: () => Details = () => ({
    error: "InvalidAction",
    reason: this.reason,
  });
}

/**
 * The request was fine, but the server won't do it right now (sending chat too quickly, chat turned off, posting to
 * Discord again too soon). The reason is shown to the user as it is, so it should be written for them.
 */
export class RefusedError extends Errors.MassiveDecksError<Details> {
  public readonly status = HttpStatus.TOO_MANY_REQUESTS;
  public readonly reason: string;

  public constructor(reason: string) {
    super(`Refused: ${reason}`);
    this.reason = reason;
    Error.captureStackTrace(this, RefusedError);
  }

  public details: () => Details = () => ({
    error: "Refused",
    reason: this.reason,
  });
}
