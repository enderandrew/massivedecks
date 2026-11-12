import type { ChatMessage } from "./lobby-event/chat-message.js";
import type { ChatMessageDeleted } from "./lobby-event/chat-message-deleted.js";
import type { ChatMuteChanged } from "./lobby-event/chat-mute-changed.js";
import type { Configured } from "./lobby-event/configured.js";
import type { ConnectionChanged } from "./lobby-event/connection-changed.js";
import type { DiscordInviteSent } from "./lobby-event/discord-invite-sent.js";
import type { ErrorEncountered } from "./lobby-event/error-encountered.js";
import type { PresenceChanged } from "./lobby-event/presence-changed.js";
import type { PrivilegeChanged } from "./lobby-event/privilege-changed.js";
import type { UserRoleChanged } from "./lobby-event/user-role-changed.js";

export type LobbyEvent =
  | Configured
  | ConnectionChanged
  | PresenceChanged
  | PrivilegeChanged
  | UserRoleChanged
  | ErrorEncountered
  | ChatMessage
  | ChatMessageDeleted
  | ChatMuteChanged
  | DiscordInviteSent;
