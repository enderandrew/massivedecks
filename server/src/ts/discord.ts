import { default as Axios } from "axios";

import type * as Config from "./config.js";
import type { Lobby } from "./lobby.js";
import type { GameCode } from "./lobby/game-code.js";
import * as Logging from "./logging.js";
import type * as User from "./user.js";

/**
 * At most one invite per lobby in this many milliseconds, so the channel can't be flooded.
 */
export const inviteCooldown = 60 * 1000;

/**
 * The address people join the given game at.
 */
export const joinUrl = (config: Config.Discord, gameCode: GameCode): string =>
  `${config.siteUrl.replace(/\/+$/, "")}/games/${gameCode}`;

// Names come from users: stop them being read as Discord formatting or links.
const plain = (text: string): string =>
  text.replace(/([\\*_~`|>[\]()#@:])/g, "\\$1").slice(0, 100);

/**
 * Post an invite to the game to the configured Discord channel. Doesn't wait for it: failures are only logged.
 */
export const postInvite = (
  config: Config.Discord,
  gameCode: GameCode,
  lobby: Lobby,
  from: User.User,
): void => {
  const url = joinUrl(config, gameCode);
  const players = Object.values(lobby.users).filter(
    (u) => u.presence === "Joined" && u.role === "Player",
  ).length;
  const body = {
    // Nothing a user typed can ping anyone.
    allowed_mentions: { parse: [] },
    content: `**${plain(from.name)}** is starting a game. Come and play!`,
    embeds: [
      {
        title: plain(lobby.config.name),
        url,
        description: `[Click here to join](${url}) or enter the game code **${gameCode}**.`,
        color: 0xe91e63,
        fields: [
          { name: "Game code", value: gameCode, inline: true },
          { name: "Players", value: players.toString(), inline: true },
          ...(lobby.config.password !== undefined
            ? [{ name: "Password", value: "Ask the host", inline: true }]
            : []),
        ],
      },
    ],
  };
  Axios.post(config.webhookUrl, body, { timeout: 10000 }).catch((error) => {
    Logging.logger.warn(
      `Couldn't post the invite for ${gameCode} to Discord: ${
        (error as Error).message
      }`,
    );
  });
};
