/**
 * A message was removed from the lobby's chat by a host.
 */
export interface ChatMessageDeleted {
  event: "ChatMessageDeleted";
  id: number;
}

export const of = (id: number): ChatMessageDeleted => ({
  event: "ChatMessageDeleted",
  id,
});
