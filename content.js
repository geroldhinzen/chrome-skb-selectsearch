(() => {
  const ENHANCED_CLASS = "skb-selectsearch-enhanced";
  const WRAPPER_CLASS = "skb-selectsearch-wrapper";

  // Single document-level click handler to close all open dropdowns
  let clickHandlerInstalled = false;
  const installGlobalClickHandler = () => {
    if (clickHandlerInstalled) return;
    clickHandlerInstalled = true;

    document.addEventListener("click", (event) => {
      document.querySelectorAll(`.${WRAPPER_CLASS}`).forEach((wrapper) => {
        if (!wrapper.contains(event.target)) {
          const list = wrapper.querySelector(".skb-selectsearch-list");
          if (list) {
            list.classList.remove("is-open");
          }
        }
      });
    });
  };

  const normalizeText = (text) => text.toLowerCase().trim();

  const getOptions = (select) => {
    const options = [];
    const children = Array.from(select.children);
    children.forEach((child) => {
      if (child.tagName === "OPTGROUP") {
        const groupLabel = child.label || "";
        Array.from(child.children).forEach((option) => {
          options.push({
            value: option.value,
            label: option.textContent || "",
            group: groupLabel,
            disabled: option.disabled,
          });
        });
      } else if (child.tagName === "OPTION") {
        options.push({
          value: child.value,
          label: child.textContent || "",
          group: "",
          disabled: child.disabled,
        });
      }
    });
    return options;
  };

  const updateSelectValue = (select, value) => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const buildOptionList = (options, query) => {
    const normalizedQuery = normalizeText(query);
    return options.filter((option) => {
      if (option.disabled) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const label = normalizeText(option.label);
      const group = normalizeText(option.group);
      const value = normalizeText(option.value);
      return (
        label.includes(normalizedQuery) ||
        group.includes(normalizedQuery) ||
        value.includes(normalizedQuery)
      );
    });
  };

  const renderResults = (listEl, results, onSelect) => {
    listEl.innerHTML = "";
    if (results.length === 0) {
      const empty = document.createElement("div");
      empty.className = "skb-selectsearch-empty";
      empty.textContent = "Keine Treffer";
      listEl.append(empty);
      return;
    }

    let currentGroup = "";
    results.forEach((result) => {
      if (result.group && result.group !== currentGroup) {
        currentGroup = result.group;
        const groupEl = document.createElement("div");
        groupEl.className = "skb-selectsearch-group";
        groupEl.textContent = result.group;
        listEl.append(groupEl);
      }

      const item = document.createElement("button");
      item.type = "button";
      item.className = "skb-selectsearch-item";
      item.textContent = result.label || result.value;
      item.dataset.value = result.value;
      item.addEventListener("click", () => onSelect(result));
      listEl.append(item);
    });
  };

  const enhanceSelect = (select) => {
    if (select.classList.contains(ENHANCED_CLASS)) {
      return;
    }

    const options = getOptions(select);
    const wrapper = document.createElement("div");
    wrapper.className = WRAPPER_CLASS;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "skb-selectsearch-input";
    input.placeholder = "Suche…";
    input.autocomplete = "off";

    const list = document.createElement("div");
    list.className = "skb-selectsearch-list";

    const onSelect = (result) => {
      updateSelectValue(select, result.value);
      input.value = result.label || result.value;
      list.classList.remove("is-open");
    };

    const refresh = () => {
      const results = buildOptionList(options, input.value);
      renderResults(list, results, onSelect);
      list.classList.add("is-open");
    };

    input.addEventListener("input", refresh);
    input.addEventListener("focus", refresh);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        list.classList.remove("is-open");
        return;
      }
      if (event.key === "Enter") {
        const firstItem = list.querySelector(".skb-selectsearch-item");
        if (firstItem) {
          event.preventDefault();
          const value = firstItem.dataset.value || "";
          const match = options.find((option) => option.value === value);
          if (match) {
            onSelect(match);
          }
        }
      }
    });

    // Install the global click handler (only once)
    installGlobalClickHandler();

    const selectedOption = options.find((option) => option.value === select.value);
    if (selectedOption) {
      input.value = selectedOption.label || selectedOption.value;
    }

    wrapper.append(input, list);
    select.classList.add(ENHANCED_CLASS);
    select.style.display = "none";
    select.insertAdjacentElement("afterend", wrapper);
  };

  const init = () => {
    document.querySelectorAll("select").forEach(enhanceSelect);
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) {
          return;
        }
        if (node.tagName === "SELECT") {
          enhanceSelect(node);
        }
        node.querySelectorAll?.("select").forEach(enhanceSelect);
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  init();
})();
