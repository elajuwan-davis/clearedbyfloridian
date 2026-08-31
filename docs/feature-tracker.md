# Feature tracker

The roadmap's build state lives in the **Features** tab of the _Cleard Feature Build_
spreadsheet, not in chat history:

<https://docs.google.com/spreadsheets/d/1mq9Xyk_rHylcsNw50QRq36lX97mUT1kLeHxmUrV3OMc/edit>

One row per item from `Cleard-AI-Feature-Roadmap-Brainstorm` (90 rows), followed by shipped
platform work that has no clean roadmap category, tagged
`Unmapped — shipped platform work`. Columns:

| Column                    | Meaning                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Feature Name              | The roadmap's wording. Do not rename an existing row.                                                                    |
| Category                  | The roadmap section header the item sits under.                                                                          |
| Status                    | `Not Started`, `In Progress`, `Complete`, `Killed`.                                                                      |
| Agent/Owner               | Agent id of whoever is doing the work (e.g. `devin-…`).                                                                  |
| Started At / Completed At | `YYYY-MM-DD`.                                                                                                            |
| Source                    | `Roadmap Brainstorm`, `Decisions Log`, both, or `Session/build record`.                                                  |
| Notes                     | Evidence (PR numbers, file paths) and decision labels — `CONFIRMED DIRECTION`, `CONFIRMED STRONG`, `DEFERRED`, `KILLED`. |

## Rules

- **Status is evidence-backed.** `Complete` needs a merged PR / commit / file to point at in
  Notes; `In Progress` needs work actually happening now. When in doubt it stays `Not Started`
  with the groundwork described in Notes — an idea existing is not progress.
- A partially-built item stays `In Progress` and Notes says exactly what is missing.
- `Killed` rows are kept, never deleted, so rejected ideas stay on the record.
- The _Master Contractor Outbound_ spreadsheet is permit data only — this task never writes there.
- The `Sheet1` tab of Cleard Feature Build is left alone.

## Updating a row

When you start or finish real work on a feature, update its row in the same session:

```bash
# needs GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON (devin-sheets@permit-data-scraping.iam.gserviceaccount.com,
# which already has edit access)
bun run feature-tracker -- --feature="Voice-to-form fill" --status="In Progress" --owner=devin-abc123
bun run feature-tracker -- --feature="Voice-to-form fill" --status=Complete --owner=devin-abc123 \
  --notes="Victoria voice-fill on /join and New Permit (PR #50, #51)"
```

`Started At` / `Completed At` default to today for `In Progress` / `Complete`; pass `--started=`
or `--completed=` to backdate. Rows are matched on the exact feature name, so a typo fails loudly
rather than writing a new row.
