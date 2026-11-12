import type * as User from "../../user.js";

/**
 * A host muted (or unmuted) a user in the lobby's chat.
 */
export interface ChatMuteChanged {
  event: "ChatMuteChanged";
  user: User.Id;
  muted: boolean;
}

export const of = (user: User.Id, muted: boolean): ChatMuteChanged => ({
  event: "ChatMuteChanged",
  user,
  muted,
});
