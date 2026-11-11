module MassiveDecks.Pages.Lobby.Configure.Privacy.Model exposing (Config, Id(..))


type Id
    = All
    | Password
    | Public
    | AudienceMode
    | Chat


type alias Config =
    { password : Maybe String
    , public : Bool
    , audienceMode : Bool
    , chat : Bool
    }
