import type * as User from "../../user.js";

/**
 * An invite to this game was posted to the server's Discord channel.
 */
export interface DiscordInviteSent {
  event: "DiscordInviteSent";
  user: User.Id;
}

export const of = (user: User.Id): DiscordInviteSent => ({
  event: "DiscordInviteSent",
  user,
});
