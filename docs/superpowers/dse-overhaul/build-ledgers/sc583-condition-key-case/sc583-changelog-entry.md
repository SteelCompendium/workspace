- **DSE plugin: a hand-written condition key in capitals, such as `key: Dazed`, is now the standard condition (SC-583).**
  Condition keys used to match only in lowercase, so `Dazed` showed as a custom condition, and picking Dazed in the Conditions
  window added a second, lowercase `dazed`. A standard condition key now matches whatever its capitals: `Dazed` shows Dazed's
  name and icon, and picking Dazed again adds nothing. The key keeps the spelling you wrote; the plugin never rewrites it.
  Custom condition keys match the same way, so adding a custom "hexed" next to a hand-written `Hexed` does not add a second one.

