# ood-proteindesign

Open OnDemand app for launching protein design workflows through a researcher-friendly web interface backed by Nextflow pipelines and institution-specific HPC configuration.

## Maintainer

For questions about this app or its deployment, contact @jscgh.

## What This App Does

- Launches protein design workflows from a web UI
- Hides workflow complexity behind structured form inputs
- Dispatches jobs to the ProteinDJ Nextflow pipeline
- Separates site-specific configuration from app logic for easier portability

## Why It Exists

This app was built to make advanced protein design workflows easier to use for researchers who should not need to work directly with pipeline internals, scheduler settings, or environment-specific runtime details.

## Notes

- JavaScript hides irrelevant fields and updates required validation dynamically.
- Submission script launches the ProteinDJ pipeline.
- The form supports RFdiffusion and ProteinDJ's FreeBindCraft-backed
  `bindcraft_denovo` mode, plus Boltz-2, AlphaFold2 Initial Guess, or serial
  AlphaFold2-to-Boltz-2 structure prediction.
- Advanced controls are grouped into backbone, sequence-design, folding, and
  filtering sections. ProteinMPNN uses the v3 SolubleMPNN/OpenMMRelax path.
- The target preview supports bidirectional hotspot selection: clicking
  residues updates the hotspot field, while editing the field selects the
  corresponding residues in Mol*.
- Loaded target structures are checked for valid hotspot chains/residue numbers
  and a suggestion is shown when the target exceeds 300 standard amino-acid
  residues; larger targets remain allowed but may be less efficient. Targets
  below 50 residues are rejected, matching SBP.

## Licensing and Compliance

- This wrapper app is licensed under MIT. See `LICENSE`.
- Third-party workflow/license notices are documented in `THIRD_PARTY_NOTICES.md`.
- The ProteinDJ runtime workflow has its own license and citation requirements.
- Users must review the licensing and citation guidance for each upstream method used.

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
with the job ID, host, workflow, session/work paths, and exit code.

When enabled, metrics are written before the workflow starts. Each record is
identified as `app: ood-proteindesign` and records the resolved repository,
revision, config, common design inputs, and Nextflow arguments. Metrics
collection is best-effort and
does not fail a design job if the metrics directory is unavailable.

## ProteinDJ 3 deployment

The deployed checkout is `/srv/scratch/sbf-pipelines/proteindj3`, pinned to
the ProteinDJ `v3.0.0` release commit
`4b7205893f0fa2544e9c8a3d19900204bab13468`. Keep that checkout
available and readable from compute nodes.
The launcher requires at least 50 unique standard amino-acid residues and warns
when target PDBs contain more than 300 across all chains. Larger targets remain
allowed; empty or unparseable targets are rejected before Nextflow is submitted.
The site is configured to use the ProteinDJ `v3.0` images from
`ghcr.io/papenfusslab/proteindj` and the
`nextflow/25` module (currently Nextflow `25.10.4`). ProteinDJ's current
configuration uses a cache-bind expression that does not parse under Nextflow
24.
Deploy matching ProteinDJ 3 models under `PROTEINDESIGN_PDJ_BASEDIR`; the wrapper
supplies its `models/rfd`, `models/af2`, `models/mpnn`, and `models/boltz`
directories to the workflow. ProteinDJ 3 requires Nextflow 24.04 or later. The launch script sets
`NXF_SYNTAX_PARSER=v1` by default for Nextflow 26 and later. Local checkouts
are validated against `PROTEINDESIGN_PDJ_REVISION`; remote repositories retain
the usual Nextflow `-r`/`-latest` selection behavior.
