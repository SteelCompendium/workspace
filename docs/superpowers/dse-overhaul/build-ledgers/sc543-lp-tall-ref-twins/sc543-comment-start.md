Started: an agent is reproducing this in real Obsidian to find out whether the missing second card is a plugin bug or Obsidian's own behavior. Nothing is needed from you yet.

What the diagnosis checks:
- What you actually see where the second block should be (a gap, the raw source, or nothing).
- Whether it depends on the blocks being identical, being tall, or being references.
- A control with no Draw Steel Elements code at all: a throwaway test plugin drawing two identical tall blocks. If Obsidian alone drops one of them, the bug is in Obsidian and I will say so here.

If it is fixable in the plugin, the fix comes with a new real-Obsidian test. It will stay clear of the code that SC-537 and SC-522 are changing right now.
