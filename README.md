# ood-proteindesign

Unified Open OnDemand app for protein design.

## Workflows

- ProteinDJ (`proteindj`)
- BindFlow (`bindflow`)

## Notes

- Select workflow from the form dropdown.
- JavaScript hides irrelevant fields and updates required validation dynamically.
- Submission script dispatches to the matching Nextflow pipeline.

## Licensing and Compliance

- This wrapper app is licensed under MIT. See `LICENSE`.
- Third-party workflow/license notices are documented in `THIRD_PARTY_NOTICES.md`.
- Runtime workflows (BindFlow and ProteinDJ) have their own license and citation requirements.
- Upstream documentation indicates PyRosetta licensing obligations may apply, especially for commercial usage.

## Environment overrides

- `PROTEINDESIGN_CLUSTER`
- `PROTEINDESIGN_QUEUE`
- `PROTEINDESIGN_NATIVE_DEFAULT`
- `PROTEINDESIGN_EMAIL`
- `PROTEINDESIGN_EMAIL_DOMAIN`
- `PROTEINDESIGN_BIND_OUT_DIR`
- `PROTEINDESIGN_PDJ_OUT_DIR`
- `PROTEINDESIGN_RESULTS_URL_BASE`
