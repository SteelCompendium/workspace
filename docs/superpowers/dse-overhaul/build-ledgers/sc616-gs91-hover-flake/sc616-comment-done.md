Landed: the lifecycle check G-S91 no longer fails at random. A G-S91 failure now means the hover-preview window behaviour is actually broken. Only the test changed; the plugin is untouched.

+++ Agent notes

- dse develop `1cc54eac`; workspace main `eef07402`; the dse-verify SKILL text (G-S91 flake note, G-S83 footgun 12, CURRENT block) applied in `6c9af039`.
- Ledger preserved to `docs/superpowers/dse-overhaul/build-ledgers/` at landing.
- SC-598's documented residual (a press queued within ~10 ms of the opening click's dispatch) remains as designed; no follow-up ticket filed.

+++
