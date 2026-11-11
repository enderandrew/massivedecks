import type * as Chat from "../../chat.js";

/**
 * Someone said something in the lobby's chat.
 */
export interface ChatMessage {
  event: "ChatMessage";
  message: Chat.Message;
}

export const of = (message: Chat.Message): ChatMessage => ({
  event: "ChatMessage",
  message,
});
