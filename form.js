(() => {
  const CONTEXT_PREFIX = "batch_connect_session_context";
  const BACKBONE_ADVANCED_HIDE_TARGETS = [
    "flexible_residues",
    "rfd_ckpt_override",
    "rfd_noise_scale",
    "bc_chains",
    "bc_design_protocol",
    "bc_template_protocol",
    "bc_omit_aas",
    "bc_fix_interface_residues"
  ];
  const SEQUENCE_ADVANCED_HIDE_TARGETS = [
    "mpnn_checkpoint_type",
    "mpnn_checkpoint_model",
    "mpnn_backbone_noise",
    "mpnn_relax_max_cycles",
    "mpnn_relax_seqs_per_cycle",
    "mpnn_relax_output",
    "mpnn_relax_convergence_rmsd",
    "mpnn_relax_convergence_score",
    "mpnn_relax_convergence_max_cycles",
  ];
  const FOLDING_ADVANCED_HIDE_TARGETS = [
    "uncropped_target_pdb",
    "af2_initial_guess",
    "boltz_use_templates",
    "boltz_input_msa",
    "boltz_recycling_steps",
    "boltz_diffusion_samples",
    "boltz_sampling_steps",
    "boltz_use_potentials",
    "boltz_predict_unbound_binder"
  ];
  const FILTERING_ADVANCED_HIDE_TARGETS = [
    "zip_pdbs",
    "rank_designs",
    "ranking_metric",
    "fold_min_ss",
    "seq_min_ext_coef",
    "max_designs",
    "max_seqs_per_fold",
    "af2_max_pae_interaction",
    "af2_min_iptm",
    "af2_min_plddt_overall",
    "af2_max_rmsd_binder_bndaln",
    "af2_max_rmsd_binder_tgtaln",
    "boltz_max_rmsd_binder",
    "boltz_max_rmsd_target",
    "boltz_max_rmsd_overall",
    "boltz_min_iptm",
    "boltz_min_ipsae_min",
    "boltz_min_pdockq2_min",
    "pr_min_intface_shpcomp",
    "pr_min_intface_hbonds",
    "pr_max_intface_unsat_hbonds",
    "pr_max_surfhphobics"
  ];
  const MAX_HOTSPOT_RESIDUES = 8;
  const STANDARD_AMINO_ACIDS = new Set([
    "ALA", "ARG", "ASN", "ASP", "CYS", "GLN", "GLU", "GLY", "HIS", "ILE",
    "LEU", "LYS", "MET", "PHE", "PRO", "SER", "THR", "TRP", "TYR", "VAL"
  ]);
  const CHECKBOX_HIDE_RULES = {
    pdj_show_backbone_advanced: {
      hideWhenChecked: new Set(),
      hideWhenUnchecked: new Set(BACKBONE_ADVANCED_HIDE_TARGETS)
    },
    pdj_show_sequence_advanced: {
      hideWhenChecked: new Set(),
      hideWhenUnchecked: new Set(SEQUENCE_ADVANCED_HIDE_TARGETS)
    },
    pdj_show_folding_advanced: {
      hideWhenChecked: new Set(),
      hideWhenUnchecked: new Set(FOLDING_ADVANCED_HIDE_TARGETS)
    },
    pdj_show_filtering_advanced: {
      hideWhenChecked: new Set(),
      hideWhenUnchecked: new Set(FILTERING_ADVANCED_HIDE_TARGETS)
    }
  };

  const escapeForSelector = (value) => {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return value.replace(/([ #;?%&,.+*~':"!^$\[\]()=>|/@])/g, "\\$1");
  };

  const parseTruthy = (value) => {
    if (value === null || value === undefined) return false;
    const normalized = String(value).trim().toLowerCase();
    return (
      normalized === "" ||
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "on"
    );
  };

  const getOptionHideTargets = (option) => {
    const targets = new Set();
    if (!option) return targets;

    Array.from(option.attributes).forEach((attribute) => {
      if (!attribute.name.startsWith("data-hide-")) return;
      if (!parseTruthy(attribute.value)) return;
      const target = attribute.name.replace("data-hide-", "").trim();
      if (target) targets.add(target);
    });

    return targets;
  };

  const getAllHideTargetsForSelect = (select) => {
    const targets = new Set();
    Array.from(select.options).forEach((option) => {
      Array.from(option.attributes).forEach((attribute) => {
        if (!attribute.name.startsWith("data-hide-")) return;
        const target = attribute.name.replace("data-hide-", "").trim();
        if (target) targets.add(target);
      });
    });
    return targets;
  };

  const getFieldNameForControl = (element) => {
    if (!element) return "";

    const nameAttribute = element.getAttribute("name") || "";
    const contextMatch = nameAttribute.match(/\[([^\]]+)\]$/);
    if (contextMatch && contextMatch[1]) return contextMatch[1];

    const idAttribute = element.getAttribute("id") || "";
    const contextPrefix = `${CONTEXT_PREFIX}_`;
    if (idAttribute.startsWith(contextPrefix)) {
      return idAttribute.slice(contextPrefix.length).replace(/_id$/, "");
    }

    return idAttribute.replace(/_id$/, "");
  };

  const getFieldElements = (fieldName) => {
    const escaped = escapeForSelector(fieldName);
    const selectors = [
      `#${CONTEXT_PREFIX}_${escaped}`,
      `#${CONTEXT_PREFIX}_${escaped}_id`,
      `[name='${CONTEXT_PREFIX}[${fieldName}]']`,
      `[name='${CONTEXT_PREFIX}[${fieldName}_id]']`,
      `#${escaped}`,
      `#${escaped}_id`,
      `[name='${fieldName}']`
    ];

    const elements = selectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .filter((element, index, array) => array.indexOf(element) === index);

    if (elements.length > 0) return elements;

    const label = document.querySelector(
      `label[for$='_${escaped}'], label[for$='_${escaped}_id'], label[for='${escaped}'], label[for='${escaped}_id']`
    );
    if (!label) return [];
    const forId = label.getAttribute("for");
    if (!forId) return [];
    const fallback = document.getElementById(forId);
    return fallback ? [fallback] : [];
  };

  const getFieldContainer = (element) => {
    if (!element) return null;
    const container = element.closest(".form-group, .mb-3, .form-item, .control-group");
    if (container) return container;

    const byLabel = document.querySelector(`label[for='${element.id}']`);
    if (byLabel) {
      const labelContainer = byLabel.closest(".form-group, .mb-3, .form-item, .control-group");
      if (labelContainer) return labelContainer;
    }

    return element.parentElement;
  };

  const setFieldVisibility = (fieldName, hidden) => {
    const elements = getFieldElements(fieldName);
    const pathSelectorId = `${CONTEXT_PREFIX}_${fieldName}_path_selector`;
    const pathSelectorModal = document.getElementById(pathSelectorId);
    const pathSelectorButton = document.querySelector(`[data-bs-target='#${pathSelectorId}']`) ||
      document.querySelector(`[data-target='#${pathSelectorId}']`);

    const pathSelectorWrappers = [
      pathSelectorButton ? pathSelectorButton.closest(".form-group, .mb-3, .form-item, .control-group") : null,
      pathSelectorModal ? pathSelectorModal.closest(".form-group, .mb-3, .form-item, .control-group") : null
    ].filter((el, idx, arr) => el && arr.indexOf(el) === idx);

    elements.forEach((element) => {
      const container = getFieldContainer(element);
      const controls = [element, ...Array.from((container || element).querySelectorAll("input, select, textarea"))].filter(
        (control, index, array) => array.indexOf(control) === index
      );

      if (container) {
        container.hidden = hidden;
        container.setAttribute("aria-hidden", hidden ? "true" : "false");
      }

      controls.forEach((control) => {
        if (hidden) {
          if (control.required) control.dataset.oodWasRequired = "1";
          control.required = false;
          control.disabled = true;
          control.setCustomValidity("");
        } else {
          if (control.dataset.oodWasRequired === "1") {
            control.required = true;
            delete control.dataset.oodWasRequired;
          }
          control.disabled = false;
        }
      });
    });

    pathSelectorWrappers.forEach((wrapper) => {
      wrapper.hidden = hidden;
      wrapper.setAttribute("aria-hidden", hidden ? "true" : "false");
      if (hidden) {
        wrapper.classList.add("d-none");
      } else {
        wrapper.classList.remove("d-none");
      }
    });

    if (pathSelectorButton) {
      pathSelectorButton.disabled = hidden;
    }
  };

  const initDynamicHide = () => {
    const selectControllers = Array.from(document.querySelectorAll("select")).filter((select) =>
      Array.from(select.options).some((option) =>
        Array.from(option.attributes).some((attribute) => attribute.name.startsWith("data-hide-"))
      )
    );
    const checkboxControllers = Array.from(document.querySelectorAll("input[type='checkbox']")).filter((checkbox) => {
      const fieldName = getFieldNameForControl(checkbox);
      return Boolean(fieldName && CHECKBOX_HIDE_RULES[fieldName]);
    });

    if (selectControllers.length === 0 && checkboxControllers.length === 0) return;

    const evaluate = () => {
      const fieldHiddenState = new Map();

      selectControllers.forEach((select) => {
        const allTargets = getAllHideTargetsForSelect(select);
        const selectedOption =
          select.selectedOptions && select.selectedOptions.length > 0
            ? select.selectedOptions[0]
            : select.options[select.selectedIndex];
        const selectedHiddenTargets = getOptionHideTargets(selectedOption);

        allTargets.forEach((target) => {
          const shouldHide = selectedHiddenTargets.has(target);
          const previous = fieldHiddenState.get(target) || false;
          fieldHiddenState.set(target, previous || shouldHide);
        });
      });

      checkboxControllers.forEach((checkbox) => {
        const fieldName = getFieldNameForControl(checkbox);
        const rules = CHECKBOX_HIDE_RULES[fieldName];
        if (!rules) return;

        const allTargets = new Set([...rules.hideWhenChecked, ...rules.hideWhenUnchecked]);
        const selectedHiddenTargets = checkbox.checked ? rules.hideWhenChecked : rules.hideWhenUnchecked;

        allTargets.forEach((target) => {
          const shouldHide = selectedHiddenTargets.has(target);
          const previous = fieldHiddenState.get(target) || false;
          fieldHiddenState.set(target, previous || shouldHide);
        });
      });

      fieldHiddenState.forEach((hidden, fieldName) => {
        setFieldVisibility(fieldName, hidden);
      });
    };

    selectControllers.forEach((select) => {
      if (select.dataset.oodHideBound === "1") return;
      select.addEventListener("change", evaluate);
      select.dataset.oodHideBound = "1";
    });
    checkboxControllers.forEach((checkbox) => {
      if (checkbox.dataset.oodHideBound === "1") return;
      checkbox.addEventListener("change", evaluate);
      checkbox.dataset.oodHideBound = "1";
    });

    evaluate();
  };

  const onReady = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  };

  const findInput = (name) =>
    document.querySelector(`#batch_connect_session_context_${name}`) ||
    document.querySelector(`#batch_connect_session_context_${name}_id`) ||
    document.querySelector(`input[name$="[${name}]"]`) ||
    document.querySelector(`select[name$="[${name}]"]`) ||
    document.querySelector(`textarea[name$="[${name}]"]`);

  const findFieldContainer = (name) => {
    const input = findInput(name);
    if (input) return getFieldContainer(input);

    return (
      document.querySelector(`#batch_connect_session_context_${name}_field`) ||
      document.querySelector(`[data-attribute="${name}"]`) ||
      null
    );
  };

  const setVisible = (element, isVisible) => {
    if (!element) return;

    element.classList.toggle("d-none", !isVisible);

    if (isVisible) {
      if (element.dataset.originalDisplay) {
        element.style.display = element.dataset.originalDisplay;
      } else {
        element.style.removeProperty("display");
      }
    } else {
      if (!element.dataset.originalDisplay) {
        element.dataset.originalDisplay = element.style.display || "";
      }
      element.style.display = "none";
    }
  };

  const toNumberOr = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const clamp = (value, lower, upper) => Math.min(upper, Math.max(lower, value));

  const ensureDualRangeStyles = () => {
    if (document.getElementById("ood-dual-range-style")) return;

    const style = document.createElement("style");
    style.id = "ood-dual-range-style";
    style.textContent = `
      .ood-dual-range-wrap { margin-top: 0.5rem; }
      .ood-dual-range-track {
        position: relative;
        height: 1.75rem;
      }
      .ood-dual-range-base,
      .ood-dual-range-fill {
        position: absolute;
        left: 0;
        right: 0;
        top: 0.7rem;
        height: 0.35rem;
        border-radius: 999px;
      }
      .ood-dual-range-base { background: #d7dbe0; }
      .ood-dual-range-fill { background: #0d6efd; }
      .ood-dual-range {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 1.75rem;
        margin: 0;
        pointer-events: none;
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
      }
      .ood-dual-range::-webkit-slider-runnable-track {
        height: 0.35rem;
        background: transparent;
      }
      .ood-dual-range::-moz-range-track {
        height: 0.35rem;
        background: transparent;
      }
      .ood-dual-range::-webkit-slider-thumb {
        pointer-events: auto;
        width: 1rem;
        height: 1rem;
        border: 0;
        border-radius: 50%;
        background: #0d6efd;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
        margin-top: -0.35rem;
      }
      .ood-dual-range::-moz-range-thumb {
        pointer-events: auto;
        width: 1rem;
        height: 1rem;
        border: 0;
        border-radius: 50%;
        background: #0d6efd;
        cursor: pointer;
      }
      .ood-dual-range-values {
        margin-top: 0.25rem;
        font-size: 0.875rem;
      }
    `;
    document.head.appendChild(style);
  };

  const createRangeInput = (lower, upper, value, labelText) => {
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(lower);
    input.max = String(upper);
    input.step = "1";
    input.value = String(clamp(value, lower, upper));
    input.className = "ood-dual-range";
    input.setAttribute("aria-label", labelText);
    return input;
  };

  const maskFieldContainer = (container) => {
    if (!container) return;
    container.style.display = "none";
    container.setAttribute("aria-hidden", "true");
  };

  const initLengthSliders = (minlenInput, maxlenInput, validateLengths) => {
    if (!minlenInput || !maxlenInput) return;
    if (minlenInput.dataset.oodLengthSliderInit === "1") return;

    const minlenContainer = getFieldContainer(minlenInput);
    const maxlenContainer = getFieldContainer(maxlenInput);
    if (!minlenContainer || !maxlenContainer) return;

    const minBound = Math.min(
      toNumberOr(minlenInput.getAttribute("min"), 10),
      toNumberOr(maxlenInput.getAttribute("min"), 11)
    );
    const maxBound = Math.max(
      toNumberOr(minlenInput.getAttribute("max"), 199),
      toNumberOr(maxlenInput.getAttribute("max"), 200)
    );

    ensureDualRangeStyles();

    const sliderWrap = document.createElement("div");
    sliderWrap.className = "ood-dual-range-wrap";

    const heading = document.createElement("div");
    heading.style.fontWeight = "600";
    heading.style.marginBottom = "0.25rem";
    heading.textContent = "Binder Length";

    const sliderTrack = document.createElement("div");
    sliderTrack.className = "ood-dual-range-track";

    const baseTrack = document.createElement("div");
    baseTrack.className = "ood-dual-range-base";

    const fillTrack = document.createElement("div");
    fillTrack.className = "ood-dual-range-fill";

    const minSlider = createRangeInput(
      minBound,
      maxBound,
      toNumberOr(minlenInput.value, minBound),
      "Minimum Length slider"
    );
    const maxSlider = createRangeInput(
      minBound,
      maxBound,
      toNumberOr(maxlenInput.value, maxBound),
      "Maximum Length slider"
    );

    const valueLabel = document.createElement("div");
    valueLabel.className = "ood-dual-range-values";

    sliderTrack.appendChild(baseTrack);
    sliderTrack.appendChild(fillTrack);
    sliderTrack.appendChild(minSlider);
    sliderTrack.appendChild(maxSlider);
    sliderWrap.appendChild(heading);
    sliderWrap.appendChild(sliderTrack);
    sliderWrap.appendChild(valueLabel);

    minlenContainer.parentNode.insertBefore(sliderWrap, minlenContainer);
    maskFieldContainer(minlenContainer);
    maskFieldContainer(maxlenContainer);

    minlenInput.dataset.oodLengthSliderInit = "1";
    maxlenInput.dataset.oodLengthSliderInit = "1";

    const updateFillTrack = () => {
      const minValue = toNumberOr(minlenInput.value, minBound);
      const maxValue = toNumberOr(maxlenInput.value, maxBound);
      const sortedMin = Math.min(minValue, maxValue);
      const sortedMax = Math.max(minValue, maxValue);
      const span = Math.max(1, maxBound - minBound);
      const percentMin = ((sortedMin - minBound) / span) * 100;
      const percentMax = ((sortedMax - minBound) / span) * 100;

      fillTrack.style.left = `${percentMin}%`;
      fillTrack.style.right = `${100 - percentMax}%`;
      valueLabel.textContent = `Selected range: ${minValue} - ${maxValue}`;
    };

    const syncFromNumberInputs = () => {
      const minValue = clamp(toNumberOr(minlenInput.value, minBound), minBound, maxBound);
      const maxValue = clamp(toNumberOr(maxlenInput.value, maxBound), minBound, maxBound);

      minSlider.value = String(minValue);
      maxSlider.value = String(maxValue);
      updateFillTrack();
    };

    const setNumberValue = (numberInput, nextValue) => {
      if (numberInput.value === String(nextValue)) return;
      numberInput.value = String(nextValue);
      numberInput.dispatchEvent(new Event("input", { bubbles: true }));
      numberInput.dispatchEvent(new Event("change", { bubbles: true }));
    };

    minSlider.addEventListener("input", () => {
      const nextMin = toNumberOr(minSlider.value, minBound);
      const currentMax = toNumberOr(maxlenInput.value, maxBound);
      setNumberValue(minlenInput, nextMin);
      if (nextMin > currentMax) {
        setNumberValue(maxlenInput, nextMin);
      }
      syncFromNumberInputs();
      validateLengths();
    });

    maxSlider.addEventListener("input", () => {
      const nextMax = toNumberOr(maxSlider.value, maxBound);
      const currentMin = toNumberOr(minlenInput.value, minBound);
      setNumberValue(maxlenInput, nextMax);
      if (nextMax < currentMin) {
        setNumberValue(minlenInput, nextMax);
      }
      syncFromNumberInputs();
      validateLengths();
    });

    minlenInput.addEventListener("input", syncFromNumberInputs);
    maxlenInput.addEventListener("input", syncFromNumberInputs);
    minlenInput.addEventListener("change", syncFromNumberInputs);
    maxlenInput.addEventListener("change", syncFromNumberInputs);

    syncFromNumberInputs();
  };

  const loadScriptOnce = (id, src) =>
    new Promise((resolve, reject) => {
      const existing = document.getElementById(id);
      if (existing) {
        if (existing.dataset.loaded === "1") {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.async = true;
      script.addEventListener("load", () => {
        script.dataset.loaded = "1";
        resolve();
      }, { once: true });
      script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      document.head.appendChild(script);
    });

  const loadStylesheetOnce = (id, href) =>
    new Promise((resolve, reject) => {
      const existing = document.getElementById(id);
      if (existing) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      link.addEventListener("load", () => resolve(), { once: true });
      link.addEventListener("error", () => reject(new Error(`Failed to load ${href}`)), { once: true });
      document.head.appendChild(link);
    });

  const ensureMolstarScopedStyles = () => {
    if (document.getElementById("ood-molstar-scoped-style")) return;

    const style = document.createElement("style");
    style.id = "ood-molstar-scoped-style";
    style.textContent = `
      #ood-molstar-container {
        position: relative;
        width: 100%;
        height: 520px;
        min-height: 520px;
        max-height: 520px;
        overflow: hidden;
      }

      #ood-molstar-container .msp-layout-region-right {
        display: none !important;
      }

      #ood-molstar-preview .btn-group {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 0.25rem;
      }

      @media (max-width: 576px) {
        #ood-molstar-preview .btn-group {
          display: flex;
          margin: 0.5rem 0 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  let molstarAssetsPromise = null;
  const ensureMolstarAssets = () => {
    if (window.molstar && window.molstar.Viewer) return Promise.resolve();
    if (molstarAssetsPromise) return molstarAssetsPromise;

    molstarAssetsPromise = Promise.all([
      loadStylesheetOnce("ood-molstar-css", "https://cdn.jsdelivr.net/npm/molstar@5.11.0/build/viewer/molstar.css"),
      loadScriptOnce("ood-molstar-js", "https://cdn.jsdelivr.net/npm/molstar@5.11.0/build/viewer/molstar.js")
    ]).then(() => {
      if (!window.molstar || !window.molstar.Viewer || !window.molstar.lib) {
        throw new Error("Mol* loaded but its structure-selection API was not found.");
      }
    });

    return molstarAssetsPromise;
  };

  const buildPathPreviewUrl = (template, rawPath) => {
    if (!template || !rawPath) return null;
    const trimmed = rawPath.trim();
    if (!trimmed) return null;

    const withoutLeadingSlash = trimmed.replace(/^\/+/, "");
    const segmented = withoutLeadingSlash
      .split("/")
      .filter((segment) => segment.length > 0)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const encodedPath = encodeURIComponent(trimmed);

    return template
      .replace(/__PATH_SEGMENTS__/g, segmented)
      .replace(/__PATH_ENCODED__/g, encodedPath)
      .replace(/__PATH__/g, withoutLeadingSlash);
  };

  const inferFormatFromUrl = (url) => {
    const normalized = (url || "").toLowerCase();
    if (normalized.endsWith(".cif") || normalized.endsWith(".mmcif") || normalized.endsWith(".bcif")) {
      return "mmcif";
    }
    return "pdb";
  };

  onReady(() => {
    const targetInput = findInput("target");
    const minlenInput = findInput("minlen");
    const maxlenInput = findInput("maxlen");

    const hotspotsInput = findInput("hotspots");
    const targetCropInput = findInput("target_crop");
    const jobconfigInput = findInput("jobconfig");
    const filterconfigInput = findInput("filterconfig");

    const dataWarningField = findFieldContainer("data_warning");
    const citationField = findFieldContainer("citation_request");
    const katanaCitationField = findFieldContainer("katana_citation");
    const molstarPreviewRoot = document.getElementById("ood-molstar-preview");
    const molstarStatus = document.getElementById("ood-molstar-status");
    const molstarLoadButton = document.getElementById("ood-molstar-load");
    const molstarHotspotsModeButton = document.getElementById("ood-molstar-mode-hotspots");
    const molstarCropModeButton = document.getElementById("ood-molstar-mode-crop");
    const molstarApplyCropButton = document.getElementById("ood-molstar-apply-crop");
    const molstarClearCropButton = document.getElementById("ood-molstar-clear-crop");
    const molstarCropSummary = document.getElementById("ood-molstar-crop-summary");
    const molstarContainer = document.getElementById("ood-molstar-container");
    const targetSizeWarning = document.getElementById("ood-target-size-warning");
    const hotspotValidation = document.getElementById("ood-hotspot-validation");
    const targetCropValidation = document.getElementById("ood-target-crop-validation");
    const molstarUrlTemplate = molstarPreviewRoot
      ? (molstarPreviewRoot.getAttribute("data-url-template") || "").trim()
      : "";
    let molstarViewer = null;
    let loadedResiduesByChain = null;
    let loadedResidueCount = 0;
    let sourceResiduesByChain = null;
    let sourceResidueCount = 0;
    let cropIsApplied = false;
    let molstarMode = "hotspots";
    let applyingMolstarSelection = false;
    let selectionReleaseTimer = null;

    let filterConfigTouched = false;

    const setMolstarStatus = (message, isError = false) => {
      if (!molstarStatus) return;
      molstarStatus.textContent = message;
      molstarStatus.style.color = isError ? "#9f1d1d" : "#555";
    };

    const getTargetSource = () => {
      if (!targetInput) return null;
      const value = targetInput.value.trim();
      if (!value) return null;

      if (/^[1-9][A-Za-z0-9]{3}$/.test(value)) {
        return {
          url: `https://files.rcsb.org/download/${value.toUpperCase()}.pdb`,
          format: "pdb",
          label: `RCSB ${value.toUpperCase()}`
        };
      }

      if (/^https?:\/\//i.test(value)) {
        return {
          url: value,
          format: inferFormatFromUrl(value),
          label: value
        };
      }

      const pathUrl = buildPathPreviewUrl(molstarUrlTemplate, value);
      if (pathUrl) {
        return {
          url: pathUrl,
          format: inferFormatFromUrl(value),
          label: value
        };
      }

      return null;
    };

    const ensureMolstarViewer = async () => {
      if (!molstarContainer) throw new Error("Mol* container is unavailable.");
      if (molstarViewer) return molstarViewer;

      await ensureMolstarAssets();
      ensureMolstarScopedStyles();
      molstarViewer = await window.molstar.Viewer.create("ood-molstar-container", {
        layoutIsExpanded: false,
        layoutShowControls: true,
        layoutShowSequence: true,
        layoutShowRemoteState: false,
        layoutShowLeftPanel: false,
        layoutShowRightPanel: false,
        collapseRightPanel: true,
        layoutShowLog: false,
        viewportShowSelectionMode: true,
        //layoutShowSequence: false,
        //viewportShowControls: true,
        //viewportShowExpand: false
      });
      try {
        molstarViewer.plugin.managers.interactivity.setProps({ granularity: "residue" });
      } catch (error) {
        console.warn("Mol* residue selection granularity unavailable", error);
      }
      try {
        // Mol* otherwise starts in camera/focus mode, where a primary click
        // does not behave as a residue hotspot picker.
        molstarViewer.plugin.selectionMode = true;
      } catch (error) {
        console.warn("Mol* selection mode unavailable", error);
      }
      const selectionChanged = molstarViewer.plugin.managers.structure.selection?.events?.changed;
      const syncSelection = () => {
        if (applyingMolstarSelection) return;
        requestAnimationFrame(() => {
          if (applyingMolstarSelection) return;
          if (molstarMode === "crop") syncCropFromMolstar();
          else syncHotspotsFromMolstar();
          validateLoadedTargetAndHotspots();
        });
      };
      selectionChanged?.subscribe(syncSelection);
      molstarViewer.plugin.behaviors.interaction.click.subscribe((event) => {
        if (event && event.button !== undefined && event.button !== 0) return;
        syncSelection();
      });
      return molstarViewer;
    };

    const parseHotspotTokens = (value) => {
      const tokens = [];
      String(value || "").split(",").forEach((rawToken) => {
        const token = rawToken.trim();
        if (!token) return;

        const chainOnly = token.match(/^([A-Za-z]+)$/);
        if (chainOnly) {
          tokens.push({ chain: chainOnly[1], start: null, end: null, text: chainOnly[1] });
          return;
        }

        const residue = token.match(/^(?:([A-Za-z]+)?)([0-9]+)(?:-([0-9]+))?$/);
        if (!residue) return;
        const chain = residue[1] || null;
        const start = Number(residue[2]);
        const end = residue[3] ? Number(residue[3]) : start;
        if (end < start) return;
        tokens.push({
          chain,
          start,
          end,
          text: `${chain || ""}${start}${end === start ? "" : `-${end}`}`
        });
      });
      return tokens;
    };

    const residueMapForTokens = (value, residuesByChain, { requireChain = false } = {}) => {
      const rawParts = String(value || "").split(",").map((token) => token.trim());
      const tokens = parseHotspotTokens(value);
      if ((String(value || "").trim() && rawParts.some((token) => !token)) ||
          rawParts.filter(Boolean).length !== tokens.length) {
        return { error: "Invalid residue format. Use A120 or A120-310.", residuesByChain: new Map(), count: 0 };
      }
      const selected = new Map();
      for (const token of tokens) {
        if (token.start === null || (requireChain && !token.chain)) {
          return { error: "Crop ranges must include a chain, for example A120-310.", residuesByChain: new Map(), count: 0 };
        }
        const chain = token.chain || (residuesByChain?.size === 1 ? [...residuesByChain.keys()][0] : null);
        const available = chain && residuesByChain?.get(chain);
        if (!available) {
          return { error: token.chain
            ? `Chain ${token.chain} is not present in the target structure.`
            : "Numeric residue ranges require a single-chain target.", residuesByChain: new Map(), count: 0 };
        }
        if (!available.has(token.start) || !available.has(token.end)) {
          return { error: `Crop range ${token.text} is not present in the target structure.`, residuesByChain: new Map(), count: 0 };
        }
        if (!selected.has(chain)) selected.set(chain, new Set());
        available.forEach((residue) => {
          if (residue >= token.start && residue <= token.end) selected.get(chain).add(residue);
        });
      }
      return {
        error: "",
        residuesByChain: selected,
        count: [...selected.values()].reduce((count, residues) => count + residues.size, 0)
      };
    };

    const cropSelection = () => residueMapForTokens(targetCropInput?.value, sourceResiduesByChain, { requireChain: true });

    const updateCropSummary = (message = "", isError = false) => {
      if (!molstarCropSummary) return;
      molstarCropSummary.textContent = message;
      molstarCropSummary.style.color = isError ? "#9f1d1d" : "#555";
    };

    const updateMolstarMode = (mode) => {
      molstarMode = mode;
      const cropMode = mode === "crop";
      if (molstarHotspotsModeButton) {
        molstarHotspotsModeButton.className = `btn btn-${cropMode ? "outline-primary" : "primary"}`;
      }
      if (molstarCropModeButton) {
        molstarCropModeButton.className = `btn btn-${cropMode ? "primary" : "outline-primary"}`;
      }
      if (targetCropInput) {
        const container = findFieldContainer("target_crop");
        setVisible(container, cropMode || cropIsApplied);
      }
      if (molstarApplyCropButton) molstarApplyCropButton.hidden = !cropMode;
      if (molstarClearCropButton) molstarClearCropButton.hidden = !cropIsApplied;
      if (molstarViewer) syncMolstarSelection();
      updateCropSummary(cropMode
        ? "Crop mode: select the residues to retain, then click Apply crop."
        : cropIsApplied
        ? `Crop applied: ${loadedResidueCount} residues will be used for this job.`
        : "Hotspot mode: select residues to design against.");
    };

    const setValidationMessage = (element, message) => {
      if (!element) return;
      element.textContent = message;
      element.hidden = !message;
      const container = element.closest(".form-group, .mb-3, .form-item, .control-group");
      if (container) {
        const label = container.querySelector("label");
        if (label) label.hidden = true;
        if (message) {
          container.hidden = false;
          container.classList.remove("d-none");
          container.style.removeProperty("display");
        } else {
          setVisible(container, false);
        }
      }
    };

    const getLoadedResidues = (data) => {
      const structure = window.molstar.lib?.structure;
      const structureElement = structure?.StructureElement;
      const properties = structure?.StructureProperties;
      if (!data || !structureElement?.Location || !properties) return null;

      const residuesByChain = new Map();
      const location = structureElement.Location.create(data);

      data.units.forEach((unit) => {
        const elements = unit.polymerElements || unit.elements || [];
        location.unit = unit;
        elements.forEach((element) => {
          location.element = element;
          const residueName = properties.residue.label_comp_id(location) ||
            properties.residue.auth_comp_id?.(location);
          if (!residueName || !STANDARD_AMINO_ACIDS.has(String(residueName).toUpperCase())) return;

          const chain = properties.chain.auth_asym_id(location) ||
            properties.chain.label_asym_id(location);
          const residue = properties.residue.auth_seq_id(location) ??
            properties.residue.label_seq_id(location);
          if (!chain || residue === undefined || residue === null) return;
          if (!residuesByChain.has(chain)) residuesByChain.set(chain, new Set());
          residuesByChain.get(chain).add(Number(residue));
        });
      });

      return {
        residuesByChain,
        residueCount: [...residuesByChain.values()].reduce((count, residues) => count + residues.size, 0)
      };
    };

    const validateLoadedTargetAndHotspots = () => {
      if (!targetInput) return;

      const minTargetResidues = 50;
      const maxTargetResidues = 300;
      // A preview is optional. Do not turn an unloaded structure into a
      // spurious zero-residue validation error; the launch script validates
      // the submitted PDB regardless of whether it was previewed.
      if (loadedResiduesByChain !== null) {
        const targetTooSmall = loadedResidueCount < minTargetResidues;
        const targetTooLarge = loadedResidueCount > maxTargetResidues;
        targetInput.setCustomValidity(targetTooSmall
          ? `Structure has only ${loadedResidueCount} residue(s). Minimum ${minTargetResidues} residues required.`
          : "");
        setValidationMessage(
          targetSizeWarning,
          targetTooSmall
            ? `Structure has only ${loadedResidueCount} residue(s). Minimum ${minTargetResidues} residues required.`
            : targetTooLarge
            ? `Suggestion: this target contains ${loadedResidueCount} standard amino-acid residues. It's recommended to keep targets below ${maxTargetResidues} residues.`
            : ""
        );
        if (targetSizeWarning) {
          const isError = targetTooSmall;
          targetSizeWarning.style.backgroundColor = isError ? "#F8D7DA" : "#FFF3CD";
          targetSizeWarning.style.borderColor = isError ? "#842029" : "#664D03";
          targetSizeWarning.style.color = isError ? "#842029" : "#664D03";
        }
      } else {
        targetInput.setCustomValidity("");
        setValidationMessage(targetSizeWarning, "");
      }

      if (targetCropInput) {
        let cropError = "";
        if (targetCropInput.value.trim() && sourceResiduesByChain) {
          const crop = cropSelection();
          cropError = crop.error || (crop.count < minTargetResidues
            ? `Crop contains ${crop.count} residue(s). Minimum ${minTargetResidues} residues required.`
            : "");
          if (!cropError) {
            updateCropSummary(cropIsApplied
              ? `Crop applied: ${crop.count} residues will be used for this job.`
              : `Crop selection: ${crop.count} residues. Click Apply crop to use it.`);
          }
        }
        targetCropInput.setCustomValidity(cropError);
        setValidationMessage(targetCropValidation, cropError);
      }

      if (!hotspotsInput) return;
      const rawParts = hotspotsInput.value.split(",").map((token) => token.trim());
      const rawTokens = rawParts.filter(Boolean);
      const parsedTokens = parseHotspotTokens(hotspotsInput.value);
      let hotspotError = "";
      if (
        (hotspotsInput.value.trim() && rawTokens.length !== rawParts.length) ||
        rawTokens.length !== parsedTokens.length
      ) {
        hotspotError = "Invalid hotspot format. Use 231, A231, or A231-240.";
      }

      // Match SBP's limit. Ranges count each residue, while a bare chain can
      // only be counted once the target has been loaded and its residues are
      // known.
      const hotspotResidueCount = parsedTokens.reduce((count, token) => {
        if (token.start === null) {
          if (!loadedResiduesByChain) return count;
          const chain = loadedResiduesByChain.get(token.chain);
          return count + (chain ? chain.size : 0);
        }
        return count + token.end - token.start + 1;
      }, 0);
      if (!hotspotError && hotspotResidueCount > MAX_HOTSPOT_RESIDUES) {
        hotspotError = `Too many hotspot residues selected (${hotspotResidueCount}). Only up to ${MAX_HOTSPOT_RESIDUES} are supported.`;
      }

      if (!loadedResiduesByChain) {
        hotspotsInput.setCustomValidity(hotspotError);
        setValidationMessage(hotspotValidation, hotspotError);
        return;
      }

      for (const token of parsedTokens) {
        if (hotspotError) break;
        const hotspotChain = token.chain ||
          (loadedResiduesByChain.size === 1 ? [...loadedResiduesByChain.keys()][0] : null);
        const chainResidues = hotspotChain
          ? loadedResiduesByChain.get(hotspotChain)
          : null;
        if (!chainResidues) {
          hotspotError = token.chain
            ? `Hotspot chain ${token.chain} is not present in the target structure.`
            : "Numeric hotspots require a single-chain target; include the chain, for example A231.";
          break;
        }
        if (token.start !== null) {
          if (!chainResidues.has(token.start)) {
            hotspotError = token.start === token.end
              ? `Hotspot residue ${token.start} not found in chain "${hotspotChain}".`
              : `Residue ${token.start} not found in chain "${hotspotChain}".`;
          } else if (token.start !== token.end && !chainResidues.has(token.end)) {
            hotspotError = `End residue ${token.end} not found in chain "${hotspotChain}".`;
          }
        }
      }

      hotspotsInput.setCustomValidity(hotspotError);
      setValidationMessage(hotspotValidation, hotspotError);
    };

    const syncInputFromMolstar = (input) => {
      if (!molstarViewer || !input) return;
      const data = molstarViewer.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
      const selection = data && molstarViewer.plugin.managers.structure.selection?.getLoci(data);
      const structureElement = window.molstar.lib?.structure?.StructureElement;
      const properties = window.molstar.lib?.structure?.StructureProperties;
      if (!selection || !structureElement?.Loci?.is(selection) || !properties) return;

      const residuesByChain = new Map();
      structureElement.Loci.forEachLocation(selection, (location) => {
        const chain = properties.chain.auth_asym_id(location) || properties.chain.label_asym_id(location);
        const residue = properties.residue.auth_seq_id(location) ?? properties.residue.label_seq_id(location);
        if (!chain || residue === undefined || residue === null) return;
        if (!residuesByChain.has(chain)) residuesByChain.set(chain, new Set());
        residuesByChain.get(chain).add(Number(residue));
      });

      const tokens = [];
      residuesByChain.forEach((residues, chain) => {
        const sorted = [...residues].sort((a, b) => a - b);
        let start = null;
        let previous = null;
        sorted.forEach((residue) => {
          if (start === null) start = residue;
          else if (residue !== previous + 1) {
            tokens.push(`${chain}${start}${previous === start ? "" : `-${previous}`}`);
            start = residue;
          }
          previous = residue;
        });
        if (start !== null) tokens.push(`${chain}${start}${previous === start ? "" : `-${previous}`}`);
      });
      input.value = tokens.join(",");
      const selectionKind = input === targetCropInput ? "crop" : "hotspot";
      const residueCount = [...residuesByChain.values()].reduce(
        (count, residues) => count + residues.size,
        0
      );
      const rangeLabel = `${tokens.length} ${selectionKind} range${tokens.length === 1 ? "" : "s"}`;
      setMolstarStatus(tokens.length
        ? `Selected ${residueCount} ${selectionKind} residue${residueCount === 1 ? "" : "s"} (${rangeLabel}) in the preview.`
        : `Cleared ${selectionKind}s in the preview.`);
    };

    const syncHotspotsFromMolstar = () => syncInputFromMolstar(hotspotsInput);
    const syncCropFromMolstar = () => syncInputFromMolstar(targetCropInput);

    const syncMolstarSelection = () => {
      const input = molstarMode === "crop" ? targetCropInput : hotspotsInput;
      const residueMap = molstarMode === "crop" ? sourceResiduesByChain : loadedResiduesByChain;
      if (!molstarViewer || !input) return;
      const data = molstarViewer.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
      const lib = window.molstar.lib;
      const selectionManager = molstarViewer.plugin.managers.interactivity?.lociSelects;
      if (!data || !lib || !lib.structure || !selectionManager) return;

      const { StructureElement, StructureProperties } = lib.structure;
      if (!StructureElement || !StructureElement.Loci || !StructureProperties) return;

      applyingMolstarSelection = true;
      try {
        selectionManager.deselectAll();
        let matchedTokens = 0;
        const matchedResidues = new Set();
        const tokens = parseHotspotTokens(input.value);
        tokens.forEach((token) => {
          const hotspotChain = token.chain ||
            (residueMap?.size === 1 ? [...residueMap.keys()][0] : null);
          if (!hotspotChain) return;
          // A lone chain letter is kept as text while the user is typing. It
          // must not expand into every residue and overwrite the field.
          if (token.start === null) return;

          let tokenLoci = null;
          let residuesToSelect;
          if (residueMap?.has(hotspotChain)) {
            residuesToSelect = [...residueMap.get(hotspotChain)]
              .filter((residue) => residue >= token.start && residue <= token.end)
              .sort((a, b) => a - b);
          } else {
            const rangeLength = token.end - token.start + 1;
            if (rangeLength > 10000) return;
            residuesToSelect = Array.from(
              { length: rangeLength },
              (_, index) => token.start + index
            );
          }

          for (const residue of residuesToSelect) {
            const loci = StructureElement.Loci.fromSchema(data, {
              auth_asym_id: hotspotChain,
              auth_seq_id: residue
            });
            if (StructureElement.Loci.isEmpty(loci)) continue;
            matchedResidues.add(`${hotspotChain}:${residue}`);
            tokenLoci = tokenLoci
              ? StructureElement.Loci.union(tokenLoci, loci)
              : loci;
          }
          if (tokenLoci && !StructureElement.Loci.isEmpty(tokenLoci)) {
            matchedTokens += 1;
            selectionManager.select({ loci: tokenLoci });
          }
        });
        if (tokens.length > 0) {
          const selectionKind = molstarMode === "crop" ? "crop" : "hotspot";
          setMolstarStatus(
            `Selected ${matchedResidues.size} ${selectionKind} residue${matchedResidues.size === 1 ? "" : "s"} ` +
            `(${matchedTokens} ${selectionKind} range${matchedTokens === 1 ? "" : "s"}) in the preview.`
          );
        }
      } finally {
        // Mol* publishes the selection change asynchronously. Keep its echo
        // from replacing the text currently being edited.
        if (selectionReleaseTimer) clearTimeout(selectionReleaseTimer);
        selectionReleaseTimer = setTimeout(() => {
          applyingMolstarSelection = false;
          selectionReleaseTimer = null;
        }, 120);
      }
    };

    const applyMolstarCartoonWithSidechainBallAndStick = async (viewer) => {
      const plugin = viewer && viewer.plugin;
      const manager = plugin && plugin.managers && plugin.managers.structure && plugin.managers.structure.component;
      const hierarchy = plugin && plugin.managers && plugin.managers.structure && plugin.managers.structure.hierarchy;
      const reprBuilder = plugin && plugin.builders && plugin.builders.structure && plugin.builders.structure.representation;
      const reprRegistry = plugin && plugin.representation && plugin.representation.structure && plugin.representation.structure.registry;
      if (!manager || !hierarchy || !reprBuilder || !reprRegistry) return;

      const addRepresentation = async (component, reprName, typeParams = undefined) => {
        if (!component) return;
        const reprType = reprRegistry.get(reprName);
        if (!reprType) return;
        const params = { type: reprType };
        if (typeParams) params.typeParams = typeParams;
        await reprBuilder.addRepresentation(component, params);
      };

      const structures =
        (hierarchy.current && hierarchy.current.structures) ||
        (hierarchy.selection && hierarchy.selection.structures) ||
        [];
      if (!Array.isArray(structures) || structures.length === 0) return;

      for (const structure of structures) {
        const components = (structure && structure.components) || [];
        for (const component of components) {
          await manager.removeRepresentations([component]);
        }

        const polymer = await plugin.builders.structure.tryCreateComponentStatic(structure.cell, "polymer", {
          label: "Polymer"
        });
        await addRepresentation(polymer, "cartoon");
        await addRepresentation(polymer, "ball-and-stick", { sizeFactor: 0.18, sizeAspectRatio: 0.7 });
      }
    };

    const applyMolstarCropRepresentation = async () => {
      const plugin = molstarViewer?.plugin;
      const hierarchy = plugin?.managers?.structure?.hierarchy;
      const componentManager = plugin?.managers?.structure?.component;
      // Component references are populated by Mol*'s hierarchy manager after
      // the representation transaction completes, so wait for that update.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const structures = [
        ...(hierarchy?.selection?.structures || []),
        ...(hierarchy?.current?.structures || [])
      ];
      const components = Array.from(new Map(
        structures.flatMap((structure) => (structure?.components || []))
          .map((component) => [component.cell?.transform?.ref, component])
      ).values());
      if (!plugin || !componentManager || !components.length) {
        throw new Error("Mol* crop representation API is unavailable.");
      }
      await componentManager.modifyByCurrentSelection(components, "intersect");
    };

    const preventMolstarButtonSubmit = () => {
      if (!molstarContainer) return;

      const normalizeButtonType = (root) => {
        if (!root || !root.querySelectorAll) return;
        root.querySelectorAll("button").forEach((button) => {
          const type = (button.getAttribute("type") || "").trim().toLowerCase();
          if (!type || type === "submit") {
            button.type = "button";
          }
        });
      };

      normalizeButtonType(molstarContainer);

      molstarContainer.addEventListener(
        "click",
        (event) => {
          const button = event.target && event.target.closest ? event.target.closest("button") : null;
          if (!button || !molstarContainer.contains(button)) return;

          const type = (button.getAttribute("type") || "").trim().toLowerCase();
          if (!type || type === "submit") {
            button.type = "button";
            event.preventDefault();
          }
        },
        true
      );

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (node.matches && node.matches("button")) {
              const type = (node.getAttribute("type") || "").trim().toLowerCase();
              if (!type || type === "submit") {
                node.type = "button";
              }
            }
            normalizeButtonType(node);
          });
        }
      });

      observer.observe(molstarContainer, { childList: true, subtree: true });
    };

    const loadMolstarTarget = async () => {
      const source = getTargetSource();
      if (!source) {
        if (molstarUrlTemplate) {
          setMolstarStatus("Enter a valid target path, URL, or 4-character PDB ID before previewing.", true);
        } else {
          setMolstarStatus(
            "Set PROTEINDESIGN_MOLSTAR_URL_TEMPLATE for filesystem paths, or enter a PDB ID (e.g. 1CRN).",
            true
          );
        }
        return;
      }

      setMolstarStatus(`Loading ${source.label}...`);
      if (molstarLoadButton) molstarLoadButton.disabled = true;

      try {
        const viewer = await ensureMolstarViewer();
        // A crop changes Mol* components rather than replacing the source
        // structure. Always clear before loading so clearing a crop leaves no
        // stale cropped component that can interfere with the next crop.
        await viewer.plugin.clear();
        loadedResiduesByChain = null;
        loadedResidueCount = 0;
        await viewer.loadStructureFromUrl(source.url, source.format, false, {
          label: source.label
        });
        const data = viewer.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        const loadedResidues = getLoadedResidues(data);
        sourceResiduesByChain = loadedResidues?.residuesByChain || null;
        sourceResidueCount = loadedResidues?.residueCount || 0;
        loadedResiduesByChain = sourceResiduesByChain;
        loadedResidueCount = sourceResidueCount;
        await applyMolstarCartoonWithSidechainBallAndStick(viewer);
        try {
          syncMolstarSelection();
          validateLoadedTargetAndHotspots();
        } catch (error) {
          console.error("Mol* hotspot selection failed", error);
          setMolstarStatus(`Hotspot selection failed: ${error.message}`, true);
        }
        validateLoadedTargetAndHotspots();
        setMolstarStatus(`Loaded ${source.label}.`);
      } catch (error) {
        setMolstarStatus(`Could not load target: ${error.message}`, true);
      } finally {
        if (molstarLoadButton) molstarLoadButton.disabled = false;
      }
    };

    const applyTargetCrop = async () => {
      if (!targetCropInput || !sourceResiduesByChain) {
        updateCropSummary("Preview the target before applying a crop.", true);
        return;
      }
      const crop = cropSelection();
      const message = crop.error || (!crop.count
        ? "Select residues to retain before applying a crop."
        : crop.count < 50
        ? `Crop contains ${crop.count} residue(s). Minimum 50 residues required.`
        : "");
      if (message) {
        targetCropInput.setCustomValidity(message);
        setValidationMessage(targetCropValidation, message);
        updateCropSummary(message, true);
        return;
      }
      cropIsApplied = true;
      loadedResiduesByChain = crop.residuesByChain;
      loadedResidueCount = crop.count;
      validateLoadedTargetAndHotspots();
      let cropPreviewError = null;
      try {
        molstarMode = "crop";
        syncMolstarSelection();
        await applyMolstarCropRepresentation();
      } catch (error) {
        console.error("Mol* crop representation failed", error);
        cropPreviewError = error;
      }
      updateMolstarMode("hotspots");
      setMolstarStatus(cropPreviewError
        ? `Crop will be applied to the job, but the preview could not be cropped: ${cropPreviewError.message}`
        : `Crop applied: ${crop.count} residues are shown and will be written to a derived PDB for this job.`,
        Boolean(cropPreviewError));
    };

    const clearTargetCrop = async () => {
      if (targetCropInput) targetCropInput.value = "";
      cropIsApplied = false;
      loadedResiduesByChain = sourceResiduesByChain;
      loadedResidueCount = sourceResidueCount;
      if (molstarViewer) {
        try {
          await loadMolstarTarget();
        } catch (error) {
          console.error("Mol* crop reset failed", error);
        }
      }
      validateLoadedTargetAndHotspots();
      updateMolstarMode("hotspots");
      setMolstarStatus("Crop cleared; the original target will be used.");
    };

    const validateLengths = () => {
      if (!minlenInput || !maxlenInput) return;

      const minValue = Number(minlenInput.value);
      const maxValue = Number(maxlenInput.value);

      if (Number.isNaN(minValue) || Number.isNaN(maxValue)) {
        minlenInput.setCustomValidity("");
        maxlenInput.setCustomValidity("");
        return;
      }

      if (minValue > maxValue) {
        const message = "Minimum Length must be less than or equal to Maximum Length.";
        minlenInput.setCustomValidity(message);
        maxlenInput.setCustomValidity(message);
      } else {
        minlenInput.setCustomValidity("");
        maxlenInput.setCustomValidity("");
      }
    };

    const updateWarningVisibility = () => {
      if (!targetInput) return;
      setVisible(dataWarningField, targetInput.value.trim().length > 0);
    };

    const updateCitationVisibility = () => {
      const hasTarget = targetInput && targetInput.value.trim().length > 0;
      setVisible(citationField, Boolean(hasTarget));
      setVisible(katanaCitationField, Boolean(hasTarget));
    };

    const updateFilterPreset = () => {
      if (!jobconfigInput || !filterconfigInput || jobconfigInput.disabled || filterConfigTouched) return;

      const isPeptidePreset = jobconfigInput.value.includes("peptide");
      const nextValue = isPeptidePreset ? "peptide_filters.json" : "default_filters.json";

      const hasOption = Array.from(filterconfigInput.options || []).some(
        (option) => option.value === nextValue
      );

      if (hasOption) {
        filterconfigInput.value = nextValue;
        filterconfigInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };

    if (minlenInput && maxlenInput) {
      minlenInput.addEventListener("input", validateLengths);
      maxlenInput.addEventListener("input", validateLengths);
      minlenInput.addEventListener("change", validateLengths);
      maxlenInput.addEventListener("change", validateLengths);
      initLengthSliders(minlenInput, maxlenInput, validateLengths);
      validateLengths();
    }

    if (targetInput) {
      const resetTarget = () => {
        loadedResiduesByChain = null;
        loadedResidueCount = 0;
        sourceResiduesByChain = null;
        sourceResidueCount = 0;
        cropIsApplied = false;
        if (targetCropInput) targetCropInput.value = "";
        targetInput.setCustomValidity("");
        setValidationMessage(targetSizeWarning, "");
        validateLoadedTargetAndHotspots();
        updateWarningVisibility();
        updateCitationVisibility();
      };
      targetInput.addEventListener("input", resetTarget);
      targetInput.addEventListener("change", resetTarget);
      updateWarningVisibility();
      updateCitationVisibility();
    }

    if (molstarLoadButton) {
      molstarLoadButton.addEventListener("click", loadMolstarTarget);
    }

    if (molstarHotspotsModeButton) {
      molstarHotspotsModeButton.addEventListener("click", () => updateMolstarMode("hotspots"));
    }
    if (molstarCropModeButton) {
      molstarCropModeButton.addEventListener("click", () => updateMolstarMode("crop"));
    }
    if (molstarApplyCropButton) {
      molstarApplyCropButton.addEventListener("click", applyTargetCrop);
    }
    if (molstarClearCropButton) {
      molstarClearCropButton.addEventListener("click", clearTargetCrop);
    }

    preventMolstarButtonSubmit();

    if (hotspotsInput) {
      const syncHotspotsFromInput = () => {
        try {
          syncMolstarSelection();
          validateLoadedTargetAndHotspots();
        } catch (error) {
          console.error("Mol* hotspot selection failed", error);
          setMolstarStatus(`Hotspot selection failed: ${error.message}`, true);
        }
      };

      hotspotsInput.addEventListener("input", syncHotspotsFromInput);
      hotspotsInput.addEventListener("change", syncHotspotsFromInput);
      hotspotsInput.addEventListener("blur", () => {
        hotspotsInput.value = hotspotsInput.value
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
          .join(",");
        syncHotspotsFromInput();
      });
    }

    if (targetCropInput) {
      const syncCropFromInput = () => {
        if (molstarMode === "crop") syncMolstarSelection();
        validateLoadedTargetAndHotspots();
      };
      targetCropInput.addEventListener("input", syncCropFromInput);
      targetCropInput.addEventListener("change", syncCropFromInput);
    }

    if (jobconfigInput) {
      jobconfigInput.addEventListener("change", updateFilterPreset);
    }

    if (filterconfigInput) {
      filterconfigInput.addEventListener("change", () => {
        filterConfigTouched = true;
      });
    }

    initDynamicHide();
    updateMolstarMode("hotspots");
    updateFilterPreset();
  });

  document.addEventListener("DOMContentLoaded", initDynamicHide);
  document.addEventListener("turbo:load", initDynamicHide);
  document.addEventListener("page:load", initDynamicHide);
})();
