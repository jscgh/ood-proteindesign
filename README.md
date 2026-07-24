# ood-proteindesign

Open OnDemand app for launching protein design workflows through a researcher-friendly web interface backed by Nextflow pipelines and institution-specific HPC configuration.

## Maintainer

For questions about this app or its deployment, contact @jscgh.

## What This App Does

- Launches protein design workflows from a web UI
- Hides workflow complexity behind structured form inputs
- Dispatches jobs to different Nextflow pipelines based on workflow selection
- Separates site-specific configuration from app logic for easier portability

## Why It Exists

This app was built to make advanced protein design workflows easier to use for researchers who should not need to work directly with pipeline internals, scheduler settings, or environment-specific runtime details.

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
- `DEBUGGROUP`: group applied recursively to failed-run captures
- `BASE_DEBUGDIR`: parent directory for captures named `proteindesign_<workflow>_<timestamp>_<user>`
- `ENABLE_METRICS`: set to `false` to disable launch-metadata records
- `METRICS_DIRECTORY`: parent directory for monthly launch-metadata JSON files

On failure, the job captures session files and the configured Nextflow work
directory under `BASE_DEBUGDIR`. Each capture includes `debug-metadata.txt`
with the job ID, host, selected workflow, session/work paths, and exit code.

When enabled, metrics are written before the workflow starts. Each record is
identified as `app: ood-proteindesign`, includes the selected `workflow`, and
records the resolved repository, revision, config, common design inputs, and
the backend-specific Nextflow arguments. Metrics collection is best-effort and
does not fail a design job if the metrics directory is unavailable.
