(() => {
  const CONTEXT_PREFIX = "batch_connect_session_context";

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

  const getFieldElements = (fieldName) => {
    const escaped = escapeForSelector(fieldName);
    const selectors = [
      `#${CONTEXT_PREFIX}_${escaped}`,
      `[name='${CONTEXT_PREFIX}[${fieldName}]']`,
      `#${escaped}`,
      `[name='${fieldName}']`
    ];

    const elements = selectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .filter((element, index, array) => array.indexOf(element) === index);

    if (elements.length > 0) return elements;

    const label = document.querySelector(`label[for$='_${escaped}'], label[for='${escaped}']`);
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
  };

  const initDynamicHide = () => {
    const controllers = Array.from(document.querySelectorAll("select")).filter((select) =>
      Array.from(select.options).some((option) =>
        Array.from(option.attributes).some((attribute) => attribute.name.startsWith("data-hide-"))
      )
    );

    if (controllers.length === 0) return;

    const evaluate = () => {
      const fieldHiddenState = new Map();

      controllers.forEach((select) => {
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

      fieldHiddenState.forEach((hidden, fieldName) => {
        setFieldVisibility(fieldName, hidden);
      });
    };

    controllers.forEach((select) => {
      if (select.dataset.oodHideBound === "1") return;
      select.addEventListener("change", evaluate);
      select.dataset.oodHideBound = "1";
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

    let filterConfigTouched = false;

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
