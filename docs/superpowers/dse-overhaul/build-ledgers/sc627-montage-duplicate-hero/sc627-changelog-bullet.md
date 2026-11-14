- **DSE plugin: in a Montage, Add a hero refuses a name already on the board (SC-627).**
  Adding "Kira" to a board that already had Kira used to write a second Kira. The board then showed two Kira rows
  that mirrored each other: a logged action or a quick Success on either row filled both, and the second row could
  never be logged on its own. Now Add stays disabled and the window says "Kira is already on the board", and nothing
  is written. The check ignores case and spaces at the start or end, so "kira" and " KIRA " are refused too. A note
  you wrote by hand that already has two heroes with the same name is drawn as before.

