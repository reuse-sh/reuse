---
"@reuse-sh/interactions": patch
---

A floating tooltip keeps rich content in place when `content` returns the node it already shows. Before, any scroll or page change re-inserted that node, which reset scroll positions and restarted animations inside live content.
