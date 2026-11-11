module MassiveDecks.BasePath exposing (segments, strip)

{-| The path the client is served from, for hosting somewhere other than the root of a site (e.g. `/CAH/`).

`segments` is replaced at build time from the `MD_BASE_PATH` environment variable (see webpack.config.js), the
same way `Version.elm` is. Empty means the root of the site.

-}


{-| The base path, split into segments: `/CAH/` is `[ "CAH" ]`.
-}
segments : List String
segments =
    []


{-| Remove the base path from the front of a URL's path segments, if it is there.
-}
strip : List String -> List String
strip parts =
    if List.take (List.length segments) parts == segments then
        List.drop (List.length segments) parts

    else
        parts
