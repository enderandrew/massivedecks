import type * as User from "./user.js";

/**
 * A message someone sent to everyone in the lobby.
 */
export interface Message {
  /**
   * Unique within the lobby, increasing.
   */
  id: number;
  user: User.Id;
  text: string;
  /**
   * When the server received it, in milliseconds since the unix epoch.
   */
  time: number;
}

/**
 * How many messages a lobby keeps, so people who join or reconnect see the recent conversation.
 */
export const historyLimit = 100;

/**
 * No more than this many messages from one user...
 */
export const floodMessages = 5;
/**
 * ...in this many milliseconds.
 */
export const floodWindow = 5000;

/**
 * Tidy up a message as typed: no control characters or line breaks, no runs of whitespace.
 * Returns undefined if nothing is left.
 */
export const clean = (text: string): string | undefined => {
  const cleaned = text
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f\u200b\u2028\u2029]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
};
