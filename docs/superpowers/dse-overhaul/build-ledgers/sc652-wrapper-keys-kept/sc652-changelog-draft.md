- **DSE plugin: a click that saves a block no longer deletes a `prefs:` line or a `collapsed:` line the plugin cannot use (SC-652).**
  Any write to a block (a button in the block, the block edit form's Save, a write from the sidebar) used to delete
  two kinds of hand-written line without a warning: a `prefs:` map whose keys the plugin does not use (for example
  `prefs: {boardDensity: compact}`, or a misspelled preference name), and a `collapsed:` line that is not `true` or
  `false` (for example `collapsed: yes`). Both are now written back with the same values. They still do nothing on
  screen: the console warning is the same, and `collapsed: yes` still leaves the block's collapse state to the
  global setting. The same goes for `collapsible:` and `collapse_default:`.
