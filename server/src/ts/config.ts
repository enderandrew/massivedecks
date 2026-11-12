import Moment from "moment";

import type * as LobbyConfig from "./lobby/config.js";
import * as Util from "./util.js";

type Duration = UnparsedDuration | ParsedDuration;
type UnparsedDuration = string;
type ParsedDuration = number;

const environmental: (keyof EnvironmentalConfig)[] = [
  "secret",
  "listenOn",
  "basePath",
  "version",
  "touchOnStart",
];

export interface EnvironmentalConfig {
  secret: string;
  listenOn: number | string; // Port or unix socket path.
  basePath: string;
  version: string;
  touchOnStart: string;
}

export interface Config<D extends Duration> extends EnvironmentalConfig {
  sources: BaseSources<D>;
  timeouts: Timeouts<D>;
  tasks: Tasks<D>;
  storage: BaseStorage<D>;
  cache: BaseCache<D>;
  defaults: LobbyConfig.Defaults;
  adverts?: Adverts;
  discord?: Discord;
}

/**
 * Lets the host of a game post an invite to it in a Discord channel.
 */
export interface Discord {
  /**
   * The webhook for the channel invites go to (in Discord: Edit Channel > Integrations > Webhooks).
   * Keep it secret: anyone with it can post to the channel.
   */
  webhookUrl: string;
  /**
   * The public address of this site, including any path it is served under, e.g. "https://example.com/CAH/".
   * Links in invites are built from it.
   */
  siteUrl: string;
}

export type Parsed = Config<ParsedDuration>;
export type Unparsed = Config<UnparsedDuration>;

type Timeouts<D extends Duration> = {
  timeoutCheckFrequency: D;
  disconnectionGracePeriod: D;
} & { [key: string]: D };

type Tasks<D extends Duration> = {
  rateLimit: number;
  processTickFrequency: D;
};

export interface BuiltIn {
  basePath: string;
  decks: string[];
}

interface BaseManyDecks<D extends Duration> {
  baseUrl: string;
  timeout: D;
  simultaneousConnections: number;
}
export type ManyDecks = BaseManyDecks<ParsedDuration>;

export interface JsonAgainstHumanity {
  aboutUrl: string;
  /**
   * A file on this server, in the "compact" JSON Against Humanity format. Used instead of the URL if given.
   */
  file?: string;
  /**
   * Where to fetch the "compact" JSON Against Humanity file from, if no file is given.
   */
  url?: string;
}

interface BaseSources<D extends Duration> {
  builtIn?: BuiltIn;
  manyDecks?: BaseManyDecks<D>;
  jsonAgainstHumanity?: JsonAgainstHumanity;
}
export type Sources = BaseSources<ParsedDuration>;

type BaseStorage<D extends Duration> = BaseInMemory<D> | BasePostgreSQL<D>;
export type Storage = BaseStorage<ParsedDuration>;

export interface PostgreSqlConnection {
  host?: string;
  port?: number;
  user?: string;
  database?: string;
  password?: string;
  keepAlive?: boolean;
}

interface StorageBase<D extends Duration> {
  type: string;
  abandonedTime: D;
  garbageCollectionFrequency: D;
}

interface BaseInMemory<D extends Duration> extends StorageBase<D> {
  type: "InMemory";
}
export type InMemory = BaseInMemory<ParsedDuration>;

interface BasePostgreSQL<D extends Duration> extends StorageBase<D> {
  type: "PostgreSQL";
  connection: PostgreSqlConnection;
}
export type PostgreSQL = BasePostgreSQL<ParsedDuration>;

type BaseCache<D extends Duration> =
  | BaseInMemoryCache<D>
  | BasePostgreSQLCache<D>;
export type Cache = BaseCache<ParsedDuration>;

interface CacheBase<D extends Duration> {
  type: string;
  checkAfter: D;
}

interface BaseInMemoryCache<D extends Duration> extends CacheBase<D> {
  type: "InMemory";
}
export type InMemoryCache = BaseInMemoryCache<ParsedDuration>;

interface BasePostgreSQLCache<D extends Duration> extends CacheBase<D> {
  type: "PostgreSQL";
  connection: PostgreSqlConnection;
}
export type PostgreSQLCache = BasePostgreSQLCache<ParsedDuration>;

const parseDuration = (unparsed: UnparsedDuration): ParsedDuration =>
  Moment.duration(unparsed).asMilliseconds();

interface Adverts {
  manyDecks?: boolean;
  atTheParty?: boolean;
}

export const parseStorage = (
  storage: BaseStorage<UnparsedDuration>,
): BaseStorage<ParsedDuration> => ({
  ...storage,
  abandonedTime: parseDuration(storage.abandonedTime),
  garbageCollectionFrequency: parseDuration(storage.garbageCollectionFrequency),
});

export const parseCache = (
  cache: BaseCache<UnparsedDuration>,
): BaseCache<ParsedDuration> => ({
  ...cache,
  checkAfter: parseDuration(cache.checkAfter),
});

export const parseTimeouts = (
  timeouts: Timeouts<UnparsedDuration>,
): Timeouts<ParsedDuration> =>
  Util.mapObjectValues(timeouts, (key: string, value: UnparsedDuration) =>
    parseDuration(value),
  );

export const parseTasks = (
  tasks: Tasks<UnparsedDuration>,
): Tasks<ParsedDuration> => ({
  ...tasks,
  processTickFrequency: parseDuration(tasks.processTickFrequency),
});

const parseManyDecks = (
  manyDecks: BaseManyDecks<UnparsedDuration>,
): ManyDecks => ({
  ...manyDecks,
  baseUrl: manyDecks.baseUrl.endsWith("/")
    ? manyDecks.baseUrl
    : manyDecks.baseUrl + "/",
  timeout: parseDuration(manyDecks.timeout),
});

const parseSources = (sources: BaseSources<UnparsedDuration>): Sources => ({
  ...(sources.builtIn !== undefined ? { builtIn: sources.builtIn } : {}),
  ...(sources.manyDecks !== undefined
    ? { manyDecks: parseManyDecks(sources.manyDecks) }
    : {}),
  ...(sources.jsonAgainstHumanity !== undefined
    ? { jsonAgainstHumanity: sources.jsonAgainstHumanity }
    : {}),
});

export const pullFromEnvironment = (config: Parsed): Parsed => {
  for (const name of environmental) {
    const envName = `MD_${name
      .split(/(?=[A-Z])/)
      .join("_")
      .toUpperCase()}`;
    const value = process.env[envName];
    if (value !== undefined) {
      config[name] = value;
    }
  }
  // The Discord webhook is a secret, so it can be kept out of the config file.
  const webhookUrl = process.env["MD_DISCORD_WEBHOOK_URL"];
  const siteUrl = process.env["MD_DISCORD_SITE_URL"];
  if (webhookUrl !== undefined || siteUrl !== undefined) {
    const merged = {
      ...config.discord,
      ...(webhookUrl !== undefined ? { webhookUrl } : {}),
      ...(siteUrl !== undefined ? { siteUrl } : {}),
    };
    if (merged.webhookUrl !== undefined && merged.siteUrl !== undefined) {
      config.discord = merged as Discord;
    }
  }
  if (
    config.discord !== undefined &&
    (!config.discord.webhookUrl || !config.discord.siteUrl)
  ) {
    // Half set up is not set up.
    delete config.discord;
  }
  // Keep games (and the deck cache) in PostgreSQL, so they survive a restart. By default this connects over the
  // local socket as the user the server runs as, so no password is needed.
  const database = process.env["MD_POSTGRES_DATABASE"];
  if (database) {
    const user = process.env["MD_POSTGRES_USER"];
    const password = process.env["MD_POSTGRES_PASSWORD"];
    const connection: PostgreSqlConnection = {
      host: process.env["MD_POSTGRES_HOST"] || "/var/run/postgresql",
      database,
      ...(user ? { user } : {}),
      ...(password ? { password } : {}),
    };
    config.storage = {
      type: "PostgreSQL",
      abandonedTime: config.storage.abandonedTime,
      garbageCollectionFrequency: config.storage.garbageCollectionFrequency,
      connection,
    };
    config.cache = {
      type: "PostgreSQL",
      checkAfter: config.cache.checkAfter,
      connection,
    };
  }
  return config;
};

export const parse = (config: Unparsed): Parsed =>
  pullFromEnvironment({
    ...config,
    sources: parseSources(config.sources),
    timeouts: parseTimeouts(config.timeouts),
    tasks: parseTasks(config.tasks),
    storage: parseStorage(config.storage),
    cache: parseCache(config.cache),
  });
