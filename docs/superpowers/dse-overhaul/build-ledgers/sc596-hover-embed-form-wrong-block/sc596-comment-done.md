Landed: the edit form opened from an embed or a hover preview of part of a note no longer saves into an identical counter elsewhere in the note. The fix ships with the next plugin release; nothing is deployed.

<details><summary>Mechanics</summary>

- dse develop `c6077860` (8 commits on `7866426e`). Workspace main `91e55314`, with the CHANGELOG bullet in `dbe7b9b7` and the pointer bump in `b6a0c6f8`.
- dse-verify updated: the new lifecycle scenario G-S96 runs in part 6 (`G-S92 G-S96`, 59 scenarios), plus a new CURRENT at `c6077860`.
- Build ledger: `docs/superpowers/dse-overhaul/build-ledgers/sc596-hover-embed-form-wrong-block/`.
- Still open, not covered: SC-607 (a still-open preview follows what its link names now; forms share that limit with + / -).

</details>
