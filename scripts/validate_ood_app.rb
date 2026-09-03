#!/usr/bin/env ruby
# frozen_string_literal: true

require "erb"
require "open3"
require "ostruct"
require "pathname"
require "yaml"

ROOT = Pathname(__dir__).join("..").expand_path

REQUIRED_FILES = %w[
  manifest.yml
  form.yml.erb
  submit.yml.erb
  info.html.erb
  view.html.erb
  template/script.sh.erb
].freeze

class TemplateContext
  attr_reader :context

  def initialize
    @context = OpenStruct.new(
      run_name: "ci_run",
      target: "/tmp/target.pdb",
      hotspots: "A10,A20,A30",
      target_crop: "A1-60",
      pdj_design_mode: "rfd_denovo",
      minlen: 60,
      maxlen: 100,
      ndesigns: 10,
      seqs_per_design: 4,
      pdj_seq_method: "mpnn",
      pdj_pred_method: "boltz",
      mpnn_checkpoint_type: "soluble",
      mpnn_checkpoint_model: "v_48_020",
      mpnn_backbone_noise: 0,
      mpnn_relax_max_cycles: 1,
      uncropped_target_pdb: "",
      boltz_use_templates: "false",
      boltz_input_msa: "",
      fold_min_ss: 3,
      seq_min_ext_coef: 1000,
      max_designs: 10,
      max_seqs_per_fold: 2,
      af2_max_pae_interaction: 10,
      af2_min_iptm: "",
      af2_min_plddt_overall: 70,
      af2_max_rmsd_binder_bndaln: 2,
      af2_max_rmsd_binder_tgtaln: 2,
      boltz_max_rmsd_binder: 2,
      boltz_max_rmsd_target: 2,
      boltz_max_rmsd_overall: 2,
      boltz_min_iptm: 0.5,
      boltz_min_ipsae_min: "",
      boltz_min_pdockq2_min: "",
      pr_min_intface_shpcomp: "",
      pr_min_intface_hbonds: "",
      pr_max_intface_unsat_hbonds: "",
      pr_max_surfhphobics: "",
      flexible_residues: "",
      rfd_ckpt_override: "",
      rfd_noise_scale: "",
      bc_chains: "",
      bc_design_protocol: "default",
      bc_template_protocol: "default",
      bc_omit_aas: "C",
      bc_fix_interface_residues: "true",
      af2_initial_guess: "true",
      boltz_recycling_steps: 3,
      boltz_diffusion_samples: 1,
      boltz_sampling_steps: 200,
      boltz_use_potentials: "false",
      boltz_predict_unbound_binder: "false",
      zip_pdbs: "true",
      rank_designs: "true",
      ranking_metric: ""
    )
  end

  def get_binding
    run_name = "ci_run"
    email = "ci@example.com"
    email_on_terminated = false
    context = @context
    binding
  end
end

def assert_required_files!
  missing = REQUIRED_FILES.reject { |relative_path| ROOT.join(relative_path).exist? }
  return if missing.empty?

  abort("Missing required app files:\n- #{missing.join("\n- ")}")
end

def erb_templates
  Dir.glob(ROOT.join("**/*.erb")).sort
end

def compile_erb!(path)
  source = File.read(path)
  compiled = ERB.new(source).src
  RubyVM::InstructionSequence.compile(compiled, path)
rescue StandardError => e
  abort("ERB compilation failed for #{Pathname(path).relative_path_from(ROOT)}: #{e.message}")
end

def render_template(path, template_context)
  ERB.new(File.read(path), trim_mode: "-").result(template_context.get_binding)
end

def validate_yaml_file!(relative_path, template_context)
  rendered = render_template(ROOT.join(relative_path), template_context)
  YAML.safe_load(rendered, aliases: true)
rescue StandardError => e
  abort("YAML validation failed for #{relative_path}: #{e.message}")
end

def validate_manifest!
  YAML.safe_load_file(ROOT.join("manifest.yml"), aliases: true)
rescue StandardError => e
  abort("YAML validation failed for manifest.yml: #{e.message}")
end

def validate_shell_templates!(template_context)
  Dir.glob(ROOT.join("template/*.sh.erb")).sort.each do |path|
    rendered = render_template(path, template_context)
    _stdout, stderr, status = Open3.capture3("bash", "-n", stdin_data: rendered)
    next if status.success?

    relative_path = Pathname(path).relative_path_from(ROOT)
    abort("Shell validation failed for #{relative_path}: #{stderr.strip}")
  end
end

def assert_launch_contract!(template_context)
  rendered = render_template(ROOT.join("template/script.sh.erb"), template_context)
  required_fragments = [
    'design_mode="rfd_denovo"',
    '--design_mode "${design_mode}"',
    '--hotspot_residues "${hotspots}"',
    '--bc_design_protocol "${bc_design_protocol}"',
    '--boltz_min_iptm "${boltz_min_iptm}"',
    'NXF_SYNTAX_PARSER="${NXF_SYNTAX_PARSER:-v1}"',
    'PDJ_VERSION_ARGS=()',
    'expected_revision=$(git -C "${PDJ_REPOSITORY}" rev-parse --verify "${PDJ_REVISION}^{commit}" 2>/dev/null)',
    'PDJ_CONTAINER_REGISTRY="oras://ghcr.io/papenfusslab/proteindj"',
    'PDJ_CONTAINER_VERSION="v3.0"',
    '--container_registry "${PDJ_CONTAINER_REGISTRY}" --container_version "${PDJ_CONTAINER_VERSION}"',
    '--mpnn_models "${MODEL_DIR}/mpnn/"',
    '--mpnn_checkpoint_type "${mpnn_checkpoint_type}"',
    '--mpnn_checkpoint_model "${mpnn_checkpoint_model}"',
    '--mpnn_backbone_noise "${mpnn_backbone_noise}"',
    'min_target_residues=50',
    'max_target_residues=300',
    'Minimum ${min_target_residues} residues required',
    'Warning: target structure has ${target_residue_count} amino-acid residues',
    'declare -A target_chains=()',
    'Hotspot chain ${hotspot_chain} is not present in target structure',
    'Hotspot residue ${hotspot_start} not found in chain ${hotspot_chain}',
    'End residue ${hotspot_end} not found in chain ${hotspot_chain}',
    'target_crop_raw="A1-60"',
    'target.cropped.pdb',
    'Crop contains only ${target_residue_count} residue(s). Minimum ${min_target_residues} residues required.',
    'hotspots="${hotspots_clean}"',
    'case because chain IDs are case-sensitive',
    'module load java/21 nextflow/25'
  ]
  legacy_fragments = ["binder_denovo", "--rfd_mode ", "--rfd_num_designs", "--rfd_input_pdb", "--rfd_hotspots"]

  missing = required_fragments.reject { |fragment| rendered.include?(fragment) }
  abort("ProteinDJ 3 launch contract is missing: #{missing.join(', ')}") unless missing.empty?

  legacy = legacy_fragments.select { |fragment| rendered.include?(fragment) }
  abort("ProteinDJ 2 launch arguments remain: #{legacy.join(', ')}") unless legacy.empty?

  abort("Hotspot chain IDs must not be uppercased") if rendered.include?('hotspots="${hotspots_clean^^}"')

  template_context.context.pdj_design_mode = "bindcraft_denovo"
  bindcraft_rendered = render_template(ROOT.join("template/script.sh.erb"), template_context)
  unless bindcraft_rendered.include?('design_mode="bindcraft_denovo"')
    abort("FreeBindCraft launch mode did not render correctly")
  end
end

def assert_form_contract!
  source = File.read(ROOT.join("form.js"))
  rendered_form = render_template(ROOT.join("form.yml.erb"), TemplateContext.new)
  required_fragments = [
    "const MAX_HOTSPOT_RESIDUES = 8",
    "Too many hotspot residues selected",
    "hotspotResidueCount",
    "applyTargetCrop",
    "Crop contains ${crop.count} residue(s). Minimum 50 residues required.",
    "molstarMode === \"crop\""
  ]
  missing = required_fragments.reject { |fragment| source.include?(fragment) }
  abort("Hotspot form contract is missing: #{missing.join(', ')}") unless missing.empty?

  abort("Target input must remain PDB-only") if rendered_form.include?("(pdb|cif)")
end

assert_required_files!
validate_manifest!

template_context = TemplateContext.new
erb_templates.each { |path| compile_erb!(path) }
validate_yaml_file!("form.yml.erb", template_context)
validate_yaml_file!("submit.yml.erb", template_context)
validate_shell_templates!(template_context)
assert_form_contract!
assert_launch_contract!(template_context)

puts "Open OnDemand app validation passed for #{ROOT.basename}"
