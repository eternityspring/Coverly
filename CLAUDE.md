# Coverly

A DOM-native cover & card editor. See `README.md` for the product overview.

## 行为规则

### The editor must work with zero backend configuration

Coverly is a frontend-first project. With no `DATABASE_URL` set — a fresh clone, a
fork, an offline machine — every editing feature still works: canvas, elements,
pages, template picker, import/export. What is missing in that state is only:

- the user system (no sign-in, no per-user templates)
- the extra preset templates that live in the database

Concretely, this rules out:

- Any code path that throws, blocks, or hangs at startup when the database is
  absent or unreachable. The database client is initialised lazily — no
  connection is opened at boot.
- Server routes reading the database returning 5xx when it is not configured.
  They degrade to an empty result instead, and the client treats that as "no
  extra templates", not as an error to surface.
- Blocking the first paint on a network request. The template picker opens with
  what is available locally and fills in remote templates when they arrive.
- `BASE_TEMPLATES` (the blank canvas) depending on anything but code. It ships in
  the bundle and is always present.

When adding a backend-dependent feature, the default is: the feature disappears
quietly, the editor does not.
