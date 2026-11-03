Started: lifecycle will get its CDP port from its own Obsidian, so two runs can no longer end up talking to the same Obsidian. Nothing is needed from you yet.

The plan:

- By default lifecycle will start Obsidian with port 0 (the system picks a free port) and read the port number back from that Obsidian. Two runs then cannot get the same port.
- `DSE_LIFECYCLE_PORT` keeps working. If someone else holds that port, the run checks that the port really belongs to its own Obsidian before it sends Obsidian any command. If it does not, the run stops with exit 2 and a "port busy" message, instead of failing every scenario.
- A second worker is checking whether e2e, docs-shots and obsidian-shots have the same problem. I will decide what to fix there once it reports.

Reproduction runs use private ports (47000+) and private screens (:5400+), well away from the ones the other sessions on this machine use.
