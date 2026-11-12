import { RefusedError } from "../../errors/validation.js";
import * as Event from "../../event.js";
import * as ChatMessageDeleted from "../../events/lobby-event/chat-message-deleted.js";
import type * as Lobby from "../../lobby.js";
import type * as Handler from "../handler.js";
import type { Privileged } from "../privileged.js";
import * as Actions from "./../actions.js";

/**
 * A privileged user removes a message from the chat.
 */
export interface DeleteChatMessage {
  action: "DeleteChatMessage";
  /**
   * The id of the message.
   */
  id: number;
}

class DeleteChatMessageActions extends Actions.Implementation<
  Privileged,
  DeleteChatMessage,
  "DeleteChatMessage",
  Lobby.Lobby
> {
  protected readonly name = "DeleteChatMessage";

  protected handle: Handler.Custom<DeleteChatMessage, Lobby.Lobby> = (
    auth,
    lobby,
    action,
  ) => {
    const messages = lobby.messages ?? [];
    const remaining = messages.filter((m) => m.id !== action.id);
    if (remaining.length === messages.length) {
      // Already gone (two hosts deleting at once, or it scrolled out of the history).
      throw new RefusedError("That message has already been removed.");
    }
    lobby.messages = remaining;
    return {
      lobby,
      events: [Event.targetAll(ChatMessageDeleted.of(action.id))],
    };
  };
}

export const actions = new DeleteChatMessageActions();
