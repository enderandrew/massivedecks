module MassiveDecks.Pages.Lobby.Configure.Rules.HouseRules.SingleAnswer exposing (all)

import MassiveDecks.Components.Form.Message as Message
import MassiveDecks.Game.Rules as Rules
import MassiveDecks.Pages.Lobby.Configure.Configurable as Configurable
import MassiveDecks.Pages.Lobby.Configure.Configurable.Editor as Editor
import MassiveDecks.Pages.Lobby.Configure.Configurable.Model exposing (Configurable)
import MassiveDecks.Pages.Lobby.Configure.Configurable.Validator as Validator
import MassiveDecks.Pages.Lobby.Configure.Rules.HouseRules.SingleAnswer.Model exposing (..)
import MassiveDecks.Strings as Strings


all : Configurable Id (Maybe Rules.SingleAnswer) model msg
all =
    Configurable.group
        { id = All
        , editor = Editor.group "single-answer" Nothing False False
        , children =
            [ enabled |> Configurable.wrapAsToggle {}
            ]
        }


enabled : Configurable Id Bool model msg
enabled =
    Configurable.value
        { id = Enabled
        , editor = Editor.bool Strings.HouseRuleSingleAnswer
        , validator = Validator.none
        , messages = always [ Message.info Strings.HouseRuleSingleAnswerDescription ]
        }
