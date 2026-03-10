# OOD ProteinDesign Implementation Status

Updated: 2026-03-10

## Essentials

- [x] Single unified app with workflow selector for ProteinDJ and BindFlow
- [x] Workflow-aware field visibility and required-state handling in JavaScript
- [x] Unified numeric hotspots input for both workflows
- [x] ProteinDJ hotspot chain-prefix conversion (numeric -> chain+index)
- [x] Defensive hotspot handling (avoid double-prefixing existing chain-form inputs)
- [x] Exposed ProteinDJ core controls from binder_denovo schema intent
  - [x] `num_designs` / `seqs_per_design`
  - [x] `input_pdb`
  - [x] `design_length` (via min/max length)
  - [x] `hotspot_residues`
  - [x] optional `rfd_contigs`
- [x] Exposed prediction and sequence method controls
  - [x] `pred_method` (`af2` / `boltz`)
  - [x] `seq_method` (`mpnn` / `fampnn`)
- [x] Exposed recommended quality filter defaults
  - [x] AF2: `af2_max_pae_interaction`, `af2_min_plddt_overall`, `af2_max_rmsd_binder_bndaln`, `af2_max_rmsd_binder_tgtaln`
  - [x] Boltz: `boltz_max_rmsd_binder`, `boltz_max_rmsd_target`, `boltz_max_rmsd_overall`, `boltz_min_ptm_interface`
- [x] Added optional advanced ProteinDJ controls
  - [x] `mpnn_relax_max_cycles`
  - [x] `uncropped_target_pdb`
  - [x] `boltz_use_templates`
  - [x] `boltz_input_msa`
  - [x] `fold_min_ss`
  - [x] `seq_min_ext_coef`
  - [x] `max_designs`
  - [x] `max_seqs_per_fold`
- [x] Advanced controls hidden by default behind `Show Advanced ProteinDJ Options`
- [x] Method-specific hide rules for AF2/Boltz fields
- [x] Fixed hidden `path_selector` edge case (stray `Select Path` button/modal now hidden with field)
- [x] ProteinDJ runtime compatibility support for both schema-style and legacy parameter names
- [x] Auto-generate `rfd_contigs` from PDB chain when blank (prevents RFdiffusion contig startup error)
- [x] Added wrapper licensing/compliance docs (`LICENSE`, `THIRD_PARTY_NOTICES.md`, README section)

## Optional / Future

- [ ] Add explicit launch presets (`binder_denovo_boltz`, `binder_denovo_af2`)
- [ ] Add runtime/cost estimator hinting in form UI
- [ ] Add contig preview/helper UI
- [ ] Add structure-assisted hotspot picker UI
- [ ] Add dry-run or stub validation mode for safer preflight checks
- [ ] Add regression test checklist for the 3 canonical paths:
  - [ ] BindFlow
  - [ ] ProteinDJ + AF2
  - [ ] ProteinDJ + Boltz
