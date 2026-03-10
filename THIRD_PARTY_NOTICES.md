# Third-Party Notices

This repository (`ood-proteindesign`) is an Open OnDemand wrapper that dispatches
jobs to external workflow projects. It is not a bundled copy of those upstream
codebases.

## Upstream workflows used at runtime

- BindFlow: https://github.com/Australian-Structural-Biology-Computing/bindflow
  - Reported license: MIT
  - Includes a `CITATIONS.md` file with required/recommended citations.
- ProteinDJ: https://github.com/tlitfin/proteindj
  - See upstream `LICENSE` file for terms.
  - README includes extensive citation guidance for integrated tools.
- BindCraft (used by BindFlow): https://github.com/martinpacesa/BindCraft
  - Reported license: MIT

## UI libraries loaded at form runtime

- Mol*: https://github.com/molstar/molstar
  - Loaded in `form.js` from jsDelivr CDN for in-browser structure preview.
  - License: MIT

## Important downstream licensing notes

- PyRosetta licensing:
  - Upstream BindFlow/BindCraft/ProteinDJ documentation notes that PyRosetta
    usage may require additional license permissions depending on use case,
    especially commercial use.
  - Users are responsible for ensuring their use complies with PyRosetta terms.

## Citation reminders presented in the UI

The app form includes:

- Structural Biology Facility citation text (DOI: 10.26190/4KQF-M552)
- Katana HPC citation text (DOI: 10.26190/669X-A286)

These are presented to users in `form.yml.erb` as usage/citation guidance.
