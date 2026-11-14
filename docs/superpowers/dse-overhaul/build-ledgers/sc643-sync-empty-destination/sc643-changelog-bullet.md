- **DSE plugin: Sync no longer offers to move your whole vault to the trash when the Destination folder is empty
  (SC-643).** With the Destination folder field cleared (or set to `/`), Sync treated the vault root as an old
  compendium folder and opened the "Existing compendium folder found" window, whose "Move old compendium to
  trash" button would have trashed every file in the vault. Now an empty or spaces-only Destination folder means
  the default folder, `DS Compendium` (the folder the field's placeholder shows), for Sync and for compendium
  links alike. A Destination that points at the vault root (`/`, `.`, `./`) or outside the vault (`..`) is
  refused: Sync and Migrate do nothing and show a Notice asking you to choose a folder. Spaces at the start or end
  of the folder name are ignored. The vault root is never offered for the trash, however it is reached.
