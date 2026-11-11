import type * as Source from "../games/cards/source.js";
import * as Rules from "../games/rules.js";

/**
 * Configuration for a lobby.
 */
export interface Config {
  version: Version;
  name: string;
  rules: Rules.Rules;
  public: boolean;
  password?: string;
  audienceMode: boolean;
  /**
   * If people in the lobby can chat with each other.
   */
  chat: boolean;
  decks: ConfiguredSource[];
}

export type Version = number;

export interface Public {
  version: string;
  /**
   * The name of the lobby.
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  rules: Rules.Public;
  public?: boolean;
  /**
   * The password for the lobby.
   * @maxLength 100
   */
  password?: string;
  audienceMode?: boolean;
  chat?: boolean;
  decks: ConfiguredSource[];
}

/**
 * Default configuration values for new lobbies.
 */
export interface Defaults {
  rules: Rules.Public;
  public: boolean;
  audienceMode: boolean;
  /**
   * If chat is on in new lobbies. On if not given.
   */
  chat?: boolean;
  decks: Source.External[];
}

/**
 * A deck source in the configuration.
 */
export type ConfiguredSource = SummarisedSource | FailedSource;

/**
 * A deck source that is loading or has loaded.
 */
export interface SummarisedSource {
  source: Source.External;
  summary?: Source.Summary;
}

/**
 * The reason a deck could not be loaded.
 */
export type FailReason = "SourceFailure" | "NotFound";

/**
 * A deck source that has failed to load.
 */
export interface FailedSource {
  source: Source.External;
  failure: FailReason;
}

export const isFailed = (source: ConfiguredSource): source is FailedSource =>
  Object.hasOwn(source, "failure");

export const censor = (config: Config): Public => ({
  version: config.version.toString(),
  name: config.name,
  rules: Rules.censor(config.rules),
  decks: config.decks,
  ...(config.public ? { public: true } : {}),
  ...(config.audienceMode ? { audienceMode: true } : {}),
  ...(config.chat ? { chat: true } : {}),
  ...(config.password !== undefined ? { password: config.password } : {}),
});
