# API

This app has **no backend**. Everything is browser-side JavaScript.

If we ever add a backend, endpoints will be documented here.

## Module map (internal "API")

| File              | What it exports                                |
|-------------------|------------------------------------------------|
| `script.js`       | `init()`, `selectStudent()`, `awardPoints()`, `markSad()`, `endClass()` |
| `students.js`     | `STUDENTS` (default roster)                     |
| `style.css`       | Layout, theme variables, animations            |

See comments at the top of each file for the full public surface.
