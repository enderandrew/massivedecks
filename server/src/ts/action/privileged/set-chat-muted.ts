import { InvalidActionError } from "../../errors/validation.js";
import * as Event from "../../event.js";
import * as ChatMuteChanged from "../../events/lobby-event/chat-mute-changed.js";
import type * as Lobby from "../../lobby.js";
import type * as User from "../../user.js";
import type * as Handler from "../handler.js";
import type { Privileged } from "../privileged.js";
import * as Actions from "./../actions.js";

/**
 * A privileged user stops (or lets again) someone sending messages in the chat.
 */
export interface SetChatMuted {
  action: "SetChatMuted";
  user: User.Id;
  muted: boolean;
}

class SetChatMutedActions extends Actions.Implementation<
  Privileged,
  SetChatMuted,
  "SetChatMuted",
  Lobby.Lobby
> {
  protected readonly name = "SetChatMuted";

  protected handle: Handler.Custom<SetChatMuted, Lobby.Lobby> = (
    auth,
    lobby,
    action,
  ) => {
    if (lobby.users[action.user] === undefined) {
      throw new InvalidActionError("No such user.");
    }
    if (action.user === auth.uid) {
      throw new InvalidActionError("You can't mute yourself.");
    }
    const muted = new Set(lobby.chatMuted ?? []);
    if (muted.has(action.user) === action.muted) {
      return {};
    }
    if (action.muted) {
      muted.add(action.user);
    } else {
      muted.delete(action.user);
    }
    lobby.chatMuted = [...muted];
    return {
      lobby,
      events: [Event.targetAll(ChatMuteChanged.of(action.user, action.muted))],
    };
  };
}

export const actions = new SetChatMutedActions();
