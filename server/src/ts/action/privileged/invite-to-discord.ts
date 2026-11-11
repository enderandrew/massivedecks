import * as Discord from "../../discord.js";
import { InvalidActionError } from "../../errors/validation.js";
import * as Event from "../../event.js";
import * as DiscordInviteSent from "../../events/lobby-event/discord-invite-sent.js";
import type * as Lobby from "../../lobby.js";
import type * as Handler from "../handler.js";
import type { Privileged } from "../privileged.js";
import * as Actions from "./../actions.js";

/**
 * Post an invite to this game to the server's Discord channel (if the server has one set up).
 */
export interface InviteToDiscord {
  action: "InviteToDiscord";
}

class InviteToDiscordActions extends Actions.Implementation<
  Privileged,
  InviteToDiscord,
  "InviteToDiscord",
  Lobby.Lobby
> {
  protected readonly name = "InviteToDiscord";

  protected handle: Handler.Custom<InviteToDiscord, Lobby.Lobby> = (
    auth,
    lobby,
    action,
    server,
  ) => {
    const config = server.config.discord;
    if (config === undefined) {
      throw new InvalidActionError("This server isn't linked to Discord.");
    }
    const user = lobby.users[auth.uid];
    if (user === undefined) {
      throw new InvalidActionError("Only people in the game can invite.");
    }
    const now = Date.now();
    if (
      lobby.lastDiscordInvite !== undefined &&
      now - lobby.lastDiscordInvite < Discord.inviteCooldown
    ) {
      throw new InvalidActionError(
        "An invite was posted to Discord a moment ago. Try again in a minute.",
      );
    }
    lobby.lastDiscordInvite = now;
    Discord.postInvite(config, auth.gc, lobby, user);
    return {
      lobby,
      events: [Event.targetAll(DiscordInviteSent.of(auth.uid))],
    };
  };
}

export const actions = new InviteToDiscordActions();
