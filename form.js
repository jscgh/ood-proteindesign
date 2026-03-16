(() => {
  const CONTEXT_PREFIX = "batch_connect_session_context";
  const PDJ_ADVANCED_HIDE_TARGETS = [
    "pdj_advanced_heading",
    "mpnn_relax_max_cycles",
    "uncropped_target_pdb",
    "boltz_use_templates",
    "boltz_input_msa",
    "fold_min_ss",
    "seq_min_ext_coef",
    "max_designs",
    "max_seqs_per_fold",
    "af2_max_pae_interaction",
    "af2_min_plddt_overall",
    "af2_max_rmsd_binder_bndaln",
    "af2_max_rmsd_binder_tgtaln",
    "boltz_max_rmsd_binder",
    "boltz_max_rmsd_target",
    "boltz_max_rmsd_overall",
    "boltz_min_ptm_interface"
  ];
  const CHECKBOX_HIDE_RULES = {
    pdj_show_advanced: {
      hideWhenChecked: new Set(),
      hideWhenUnchecked: new Set(PDJ_ADVANCED_HIDE_TARGETS)
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
    if (input) {
      const parentGroup = input.closest(".form-group, .form-item, .control-group");
      if (parentGroup) return parentGroup;
    }

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
        height: 420px;
        min-height: 420px;
        max-height: 420px;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  };

  let molstarAssetsPromise = null;
  const ensureMolstarAssets = () => {
    if (window.molstar && window.molstar.Viewer) return Promise.resolve();
    if (molstarAssetsPromise) return molstarAssetsPromise;

    molstarAssetsPromise = Promise.all([
      loadStylesheetOnce("ood-molstar-css", "https://cdn.jsdelivr.net/npm/molstar@4/build/viewer/molstar.css"),
      loadScriptOnce("ood-molstar-js", "https://cdn.jsdelivr.net/npm/molstar@4/build/viewer/molstar.js")
    ]).then(() => {
      if (!window.molstar || !window.molstar.Viewer) {
        throw new Error("Mol* loaded but Viewer API was not found.");
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
    const jobconfigInput = findInput("jobconfig");
    const filterconfigInput = findInput("filterconfig");

    const dataWarningField = findFieldContainer("data_warning");
    const citationField = findFieldContainer("citation_request");
    const katanaCitationField = findFieldContainer("katana_citation");
    const molstarPreviewRoot = document.getElementById("ood-molstar-preview");
    const molstarStatus = document.getElementById("ood-molstar-status");
    const molstarLoadButton = document.getElementById("ood-molstar-load");
    const molstarContainer = document.getElementById("ood-molstar-container");
    const molstarUrlTemplate = molstarPreviewRoot
      ? (molstarPreviewRoot.getAttribute("data-url-template") || "").trim()
      : "";
    let molstarViewer = null;

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
        layoutShowLog: false,
        //layoutShowSequence: false,
        //viewportShowControls: true,
        //viewportShowExpand: false
      });     
      return molstarViewer;
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
        await viewer.loadStructureFromUrl(source.url, source.format);
        setMolstarStatus(`Loaded ${source.label}.`);
      } catch (error) {
        setMolstarStatus(`Could not load target: ${error.message}`, true);
      } finally {
        if (molstarLoadButton) molstarLoadButton.disabled = false;
      }
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
      targetInput.addEventListener("input", () => {
        updateWarningVisibility();
        updateCitationVisibility();
      });
      targetInput.addEventListener("change", () => {
        updateWarningVisibility();
        updateCitationVisibility();
      });
      updateWarningVisibility();
      updateCitationVisibility();
    }

    if (molstarLoadButton) {
      molstarLoadButton.addEventListener("click", loadMolstarTarget);
    }

    preventMolstarButtonSubmit();

    if (hotspotsInput) {
      hotspotsInput.addEventListener("blur", () => {
        hotspotsInput.value = hotspotsInput.value
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
          .join(",");
      });
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
    updateFilterPreset();
  });

  document.addEventListener("DOMContentLoaded", initDynamicHide);
  document.addEventListener("turbo:load", initDynamicHide);
  document.addEventListener("page:load", initDynamicHide);
})();
