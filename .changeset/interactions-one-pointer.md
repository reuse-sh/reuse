---
"@reuse-sh/interactions": patch
---

A floating tooltip follows only the pointer that opened it, and hold to confirm lets go only on the holding pointer's release. Another pointer on the page, such as a scripted demo cursor or a second touch, no longer moves or closes an open tooltip or cancels a hold in progress. A scripted pointer cannot take over a tooltip the visitor's pointer opened, while the visitor's pointer still takes over by entering another trigger.
