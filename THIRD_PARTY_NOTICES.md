# Third-Party Notices

This repository (`ood-proteindesign`) is an Open OnDemand wrapper that dispatches
jobs to external workflow projects. It is not a bundled copy of those upstream
codebases.

## Upstream workflow used at runtime

- ProteinDJ: https://github.com/PapenfussLab/proteindj
  - See upstream `LICENSE` file for terms.
  - README includes extensive citation guidance for integrated tools.
- FreeBindCraft (used by ProteinDJ's `bindcraft_denovo` mode):
  https://github.com/PapenfussLab/FreeBindCraft
  - ProteinDJ uses its PyRosetta-free implementation.

## UI libraries loaded at form runtime

- Mol*: https://github.com/molstar/molstar
  - Loaded in `form.js` from jsDelivr CDN for in-browser structure preview.
  - License: MIT

## Important downstream licensing notes

- ProteinDJ integrates third-party tools with their own terms. Users are
  responsible for reviewing upstream licensing and citation guidance for the
  methods used in a campaign.

## Citation reminders presented in the UI

The app form includes:

- Structural Biology Facility citation text (DOI: 10.26190/4KQF-M552)
- Katana HPC citation text (DOI: 10.26190/669X-A286)

These are presented to users in `form.yml.erb` as usage/citation guidance.
