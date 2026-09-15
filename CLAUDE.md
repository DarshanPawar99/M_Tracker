# Code style

Code style for this project comes from the `ponytail` plugin, enabled in
`.claude/settings.json`. Do not restate its rules here.

## Project-specific

This app stores personal health data. The ponytail rungs do not apply to the
cycle-data schema, its storage layer, or any code that reads or writes it.
Use the explicit, well-tested, boring approach there even when a shorter
one exists.

Applies to:

- Database schema and migrations for cycle, symptom, and user data
- Any read or write path touching that data
- Authentication and session handling
- Local storage, sync, and backup logic

Everywhere else — UI, layout, charts, formatting, utilities, build config —
ponytail applies normally.
