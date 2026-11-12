import type * as Action from "../action.js";
import * as Chat from "../chat.js";
import { RefusedError } from "../errors/validation.js";
import * as Event from "../event.js";
import * as ChatMessage from "../events/lobby-event/chat-message.js";
import type * as Lobby from "../lobby.js";
import * as Actions from "./actions.js";
import type * as Handler from "./handler.js";

/**
 * A user says something to everyone in the lobby.
 */
export interface SendChat {
  action: "SendChat";
  /**
   * @minLength 1
   * @maxLength 300
   */
  message: string;
}

class SendChatActions extends Actions.Implementation<
  Action.Action,
  SendChat,
  "SendChat",
  Lobby.Lobby
> {
  protected readonly name = "SendChat";

  protected handle: Handler.Custom<SendChat, Lobby.Lobby> = (
    auth,
    lobby,
    action,
  ) => {
    if (!lobby.config.chat) {
      throw new RefusedError("Chat is turned off for this game.");
    }
    const user = lobby.users[auth.uid];
    if (user === undefined || user.presence !== "Joined") {
      throw new RefusedError("Only people in the game can chat.");
    }
    const text = Chat.clean(action.message);
    if (text === undefined) {
      // Nothing but whitespace: nothing to say.
      return {};
    }
    const now = Date.now();
    const messages = lobby.messages ?? [];
    const recent = messages.filter(
      (m) => m.user === auth.uid && now - m.time < Chat.floodWindow,
    );
    if (recent.length >= Chat.floodMessages) {
      throw new RefusedError("Slow down: too many messages at once.");
    }
    const last = messages[messages.length - 1];
    const message: Chat.Message = {
      id: last === undefined ? 0 : last.id + 1,
      user: auth.uid,
      text,
      time: now,
    };
    lobby.messages = [...messages, message].slice(-Chat.historyLimit);
    return {
      lobby,
      events: [Event.targetAll(ChatMessage.of(message))],
    };
  };
}

export const actions = new SendChatActions();
