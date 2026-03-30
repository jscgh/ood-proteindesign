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

## Configuration

To adapt the app for another institution:

1. Copy `.env.example` to `template/.env`.
2. Set the runtime variables in `template/.env` for results URLs, caches, and workflow-specific pipeline locations.
3. Adjust the portal-side defaults at the top of the ERB files for cluster, queue, and other pre-submit settings.
4. Prefer updating `template/.env` over editing the app templates directly so local site customisations stay isolated from upstream logic.

Portal rendering and job runtime are configured differently:
- portal-side defaults live at the top of `form.yml.erb`, `submit.yml.erb`, `info.html.erb`, `completed.html.erb`, and `view.html.erb`
- runtime config lives in `template/.env`, which is intentionally gitignored

For CI/CD, prefer generating `template/.env` during deployment from site-managed config or secrets rather than committing a real site config file to the repository.

Core overrides:

- `PROTEINDESIGN_NATIVE_DEFAULT`
- `OOD_RESULTS_URL_BASE`
- `PROTEINDESIGN_MOLSTAR_URL_TEMPLATE`
- `PROTEINDESIGN_BIND_BASEDIR`
- `PROTEINDESIGN_BIND_OUT_DIR`
- `PROTEINDESIGN_BIND_WORK_DIR`
- `PROTEINDESIGN_BIND_REPOSITORY`
- `PROTEINDESIGN_BIND_REVISION`
- `PROTEINDESIGN_BIND_NEXTFLOW_CONFIG`
- `PROTEINDESIGN_PDJ_BASEDIR`
- `PROTEINDESIGN_PDJ_OUT_DIR`
- `PROTEINDESIGN_PDJ_WORK_DIR`
- `PROTEINDESIGN_PDJ_REPOSITORY`
- `PROTEINDESIGN_PDJ_REVISION`
- `PROTEINDESIGN_PDJ_NEXTFLOW_CONFIG`
