# TBG School OS — Module 01 (MVP)

A running Vite + React app built from the two Day 1 artefacts in the folder above:

- **`School Dashboard.dc.html`** — the approved look: black command bar, KPI strip, class table,
  right rail, "needs a decision" block, class × metric matrix.
- **`Build Spec - MVP & Roadmap.dc.html`** + **`Spec v1 - Module 01.dc.html`** — the screens,
  the flows, the permissions and the nine calculation rules.

JavaScript only, no TypeScript. React 18, React Router 6, no UI framework — the design system
tokens from `_ds/` are the styling layer.

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>. `npm run build` produces a production bundle in `dist/`.

## Screens

| Spec | Route | Who | What |
|---|---|---|---|
| S1 | `/import` | ธุรการ | Excel import with a row-level check before commit |
| S2 | `/` | ผอ. / ธุรการ | Dashboard — 4 KPIs, class table, matrix, action items |
| S3 | `/class/:id` | ผอ. / ครูของห้องนั้น | Class detail — trends, students to watch, behaviour log, assign task |
| S4 | `/record/assessment` | ครู (ธุรการกรอกแทนได้) | Whole-class scores for one checkpoint |
| S5 | `/record/behaviour`, `/record/observation`, `/record/parent` | ครู · หัวหน้ากลุ่มสาระ · ธุรการ | The three short forms |
| S6 | `/tasks` | ผอ. มอบหมาย · ครูปิดงาน | Teacher tasks with derived status |

Use the role picker in the top right to switch between ผู้อำนวยการ, ธุรการ and ครู. Permissions
follow the spec: a teacher sees only their own class, only the director closes action items and
assigns tasks, only office staff imports master data.

## How the data is arranged

```
src/data/schema.js      record shapes + the conventions that make the M7 swap cheap
src/data/constants.js   targets, weights, enums — every tunable number in one place
src/data/mockData.js    the seeded generator; the ONLY file that invents data
src/lib/rules.js        R1–R9 and the selectors the screens consume
src/store/AppContext.jsx  one reducer; every write is a named action
```

### R3 differs from the written spec

Spec v1 says the observation score is the mean of the latest round only. This build averages
the five topics across **both** rounds. A single round of five integer scores can only average
onto a 0.2 step, which made the design's 4.3 unreachable; ten scores across two rounds move in
0.1 steps. It also stops one weak round from erasing a term of evidence. Confirm this with the
school before the rule goes live — it changes who crosses the 3.5 coaching threshold.

Nothing on screen is a stored metric. The generator emits flat rows — assessments, incidents,
observations, parent-engagement entries — and `rules.js` recomputes every figure from them on
each render. Two consequences worth keeping:

- Change a rule or a target and every screen moves together.
- **For M7**, replacing `mockData.js` with API calls that return the same shapes is the whole
  migration. Each record already carries `schoolId` and `semesterId`, ids are strings, dates are
  ISO strings, and submissions record both `teacherId` (whose record it is) and `recordedBy`
  (who typed it) so "staff filled in on behalf of a teacher" survives the move.

## Where the app departs from the mockup, and why

- **Sparklines have four bars, not ten.** A2 puts four assessment checkpoints in a semester, and
  the bars are the real series rather than an invented one.
- **The school-wide observation KPI reads 3.8, not the mockup's 3.9.** It is the mean across the
  classes currently in view, so it responds to the level filter the way the other three KPIs do.
  Averaged across all 42 teaching staff instead it would be 4.0. Neither basis produces 3.9; the
  per-class basis was kept because it is the one the filter can act on.
- **Student and teacher totals are computed.** 314 students across the nine classes, not the
  612 in the mockup's headline, because the roster is what the class rows are built from.
- **Row status follows assessment.** R6 defines the bands; the dashboard's Status column applies
  them to the headline metric, matching how the design reads. Per-metric colour in the matrix
  uses each metric's own band.
- **Status compares the displayed value.** A class at 76.97% shows as 77% against an 82% target,
  and is coloured Watch, not At risk — otherwise the badge would contradict the number beside it.
- **The Excel import does not parse .xlsx.** It validates the envelope and produces a row report
  so the confirm-then-commit flow is real; swap `inspect()` in `ImportData.jsx` for a parser (or
  the SGS/DMC connector in Wave 2).

## Not in this build

Modules 03–05 are greyed out in the nav — they are Wave 2–4 in the build spec. Login (S0) is
stood in for by the role picker; there is no auth, no persistence, and a reload returns to the
seeded dataset.
