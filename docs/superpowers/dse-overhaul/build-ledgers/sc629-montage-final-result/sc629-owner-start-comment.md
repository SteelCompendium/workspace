A montage that ran out of rounds with nothing logged will say "Total Failure", not "Not started". The rules text decides this, so I'm not asking you anything.

The book (Draw Steel Heroes, Montage Test Outcomes): "If the heroes hit the failure limit or time runs out, and if they don't have at least two more successes than failures, they suffer total failure." Zero successes and zero failures when time runs out is a total failure.

After the fix, the result band on that board reads: heading "Final result", verdict "Total Failure" with the skull crest, the rule line "Total Failure — no Victories awarded.", and "2 rounds used". A montage that is still running with nothing logged keeps "This montage / Not started".

Work is under way: the fix goes in `montageOutcome` (`src/elements/montage/model.ts`), and the SC-438 e2e marker MONT-W03 becomes a plain test.
