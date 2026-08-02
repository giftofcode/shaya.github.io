"use strict";

window.Editora = window.Editora || {};

Editora.ui = Editora.ui || {};

Editora.ui.toolTitles = {
  upload: "Upload",
  adjust: "Adjust",
  filters: "Filters",
  crop: "Crop & Rotate",
  text: "Text",
  elements: "Elements",
  resize: "Resize",
  export: "Export"
};

Editora.ui.toastTimer = null;

Editora.ui.elements = {};

Editora.ui.getElement = function (id) {
  return document.getElementById(id);
};

Editora.ui.initialize = function () {
  Editora.ui.cacheElements();
  Editora.ui.bindToolNavigation();
  Editora.ui.bindHeaderActions();
  Editora.ui.bindGlobalEvents();

  Editora.ui.setEditorAvailability(
    Editora.state.imageLoaded
  );

  Editora.ui.renderTool("upload");
  Editora.ui.updateHistoryButtons();
  Editora.ui.updateCanvasState();
};

Editora.ui.cacheElements = function () {
  Editora.ui.elements = {
    toolTitle:
      Editora.ui.getElement("toolTitle"),

    toolContent:
      Editora.ui.getElement("toolContent"),

    desktopTools:
      document.querySelectorAll(
        ".sidebar .tool"
      ),

    mobileTools:
      document.querySelectorAll(
        ".mobileNav button"
      ),

    undoButton:
      Editora.ui.getElement("undoBtn"),

    redoButton:
      Editora.ui.getElement("redoBtn"),

    exportButton:
      Editora.ui.getElement("exportBtn"),

    workspace:
      document.querySelector(".workspace"),

    properties:
      document.querySelector(".properties"),

    canvasContainer:
      Editora.ui.getElement("canvasContainer")
  };
};

Editora.ui.bindToolNavigation = function () {
  const desktopTools =
    Editora.ui.elements.desktopTools || [];

  const mobileTools =
    Editora.ui.elements.mobileTools || [];

  const allToolButtons = [
    ...desktopTools,
    ...mobileTools
  ];

  allToolButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const toolName = button.dataset.tool;

      if (!toolName) {
        return;
      }

      Editora.ui.openTool(toolName);
    });
  });
};

Editora.ui.bindHeaderActions = function () {
  const undoButton =
    Editora.ui.elements.undoButton;

  const redoButton =
    Editora.ui.elements.redoButton;

  const exportButton =
    Editora.ui.elements.exportButton;

  if (undoButton) {
    undoButton.addEventListener(
      "click",
      function () {
        if (
          Editora.canvas &&
          typeof Editora.canvas.undo === "function"
        ) {
          Editora.canvas.undo();
        }
      }
    );
  }

  if (redoButton) {
    redoButton.addEventListener(
      "click",
      function () {
        if (
          Editora.canvas &&
          typeof Editora.canvas.redo === "function"
        ) {
          Editora.canvas.redo();
        }
      }
    );
  }

  if (exportButton) {
    exportButton.addEventListener(
      "click",
      function () {
        if (!Editora.state.imageLoaded) {
          Editora.ui.showToast(
            "Upload a photo before exporting."
          );

          Editora.ui.openTool("upload");
          return;
        }

        Editora.ui.openTool("export");

        if (window.innerWidth <= 760) {
          Editora.ui.elements.properties
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
        }
      }
    );
  }
};

Editora.ui.bindGlobalEvents = function () {
  document.addEventListener(
    "editora:historychange",
    function () {
      Editora.ui.updateHistoryButtons();
    }
  );

  document.addEventListener(
    "editora:loadingchange",
    function (event) {
      Editora.ui.setLoading(
        Boolean(event.detail?.loading)
      );
    }
  );

  document.addEventListener(
    "editora:image-loaded",
    function () {
      Editora.ui.setEditorAvailability(true);
      Editora.ui.updateCanvasState();

      const nextTool =
        Editora.state.activeTool === "upload"
          ? "adjust"
          : Editora.state.activeTool;

      Editora.ui.openTool(nextTool);
    }
  );

  document.addEventListener(
    "editora:selectionchange",
    function () {
      const activeTool =
        Editora.state.activeTool;

      if (
        activeTool === "text" ||
        activeTool === "elements"
      ) {
        Editora.ui.renderTool(activeTool);
      }
    }
  );

  window.addEventListener(
    "resize",
    function () {
      if (
        Editora.canvas &&
        typeof Editora.canvas.fitToScreen ===
          "function"
      ) {
        Editora.canvas.fitToScreen();
      }
    }
  );
};

Editora.ui.openTool = function (toolName) {
  const toolsThatNeedImage = [
    "adjust",
    "filters",
    "crop",
    "text",
    "elements",
    "resize",
    "export"
  ];

  if (
    toolsThatNeedImage.includes(toolName) &&
    !Editora.state.imageLoaded
  ) {
    Editora.ui.showToast(
      "Please upload a photo first."
    );

    toolName = "upload";
  }

  Editora.setActiveTool(toolName);
  Editora.ui.setActiveToolButtons(toolName);
  Editora.ui.renderTool(toolName);
};

Editora.ui.setActiveToolButtons = function (
  toolName
) {
  const desktopTools =
    Editora.ui.elements.desktopTools || [];

  const mobileTools =
    Editora.ui.elements.mobileTools || [];

  const allToolButtons = [
    ...desktopTools,
    ...mobileTools
  ];

  allToolButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.tool === toolName
    );
  });
};

Editora.ui.renderTool = function (toolName) {
  const toolTitle =
    Editora.ui.elements.toolTitle;

  const toolContent =
    Editora.ui.elements.toolContent;

  if (!toolTitle || !toolContent) {
    return;
  }

  toolTitle.textContent =
    Editora.ui.toolTitles[toolName] ||
    "Editora";

  const renderers = {
    upload:
      Editora.ui.renderUploadPanel,

    adjust:
      Editora.ui.renderAdjustPanel,

    filters:
      Editora.ui.renderFiltersPanel,

    crop:
      Editora.ui.renderCropPanel,

    text:
      Editora.ui.renderTextPanel,

    elements:
      Editora.ui.renderElementsPanel,

    resize:
      Editora.ui.renderResizePanel,

    export:
      Editora.ui.renderExportPanel
  };

  const renderer =
    renderers[toolName];

  if (typeof renderer !== "function") {
    toolContent.innerHTML = `
      <p>
        This tool is not ready yet.
      </p>
    `;

    return;
  }

  toolContent.innerHTML = renderer();

  if (
    typeof Editora.ui.bindCurrentPanel ===
      "function"
  ) {
    Editora.ui.bindCurrentPanel(toolName);
  }
};

Editora.ui.updateHistoryButtons = function () {
  const undoButton =
    Editora.ui.elements.undoButton;

  const redoButton =
    Editora.ui.elements.redoButton;

  if (undoButton) {
    undoButton.disabled =
      !Editora.canUndo();
  }

  if (redoButton) {
    redoButton.disabled =
      !Editora.canRedo();
  }
};

Editora.ui.setEditorAvailability = function (
  enabled
) {
  const disabled = !Boolean(enabled);

  const exportButton =
    Editora.ui.elements.exportButton;

  if (exportButton) {
    exportButton.disabled = disabled;
  }

  document
    .querySelectorAll(
      '.sidebar .tool:not([data-tool="upload"])'
    )
    .forEach((button) => {
      button.disabled = disabled;
    });

  document
    .querySelectorAll(
      '.mobileNav button:not([data-tool="upload"])'
    )
    .forEach((button) => {
      button.disabled = disabled;
    });
};

Editora.ui.updateCanvasState = function () {
  const canvasContainer =
    Editora.ui.elements.canvasContainer;

  if (canvasContainer) {
    canvasContainer.classList.toggle(
      "has-image",
      Editora.state.imageLoaded
    );
  }

  document.body.classList.toggle(
    "is-editor-open",
    Editora.state.imageLoaded
  );
};

Editora.ui.setLoading = function (loading) {
  const workspace =
    Editora.ui.elements.workspace;

  if (!workspace) {
    return;
  }

  workspace.classList.toggle(
    "is-loading",
    Boolean(loading)
  );
};

Editora.ui.showToast = function (message) {
  let toast =
    document.querySelector(".toast");

  if (!toast) {
    toast =
      document.createElement("div");

    toast.className = "toast";

    document.body.appendChild(toast);
  }

  clearTimeout(Editora.ui.toastTimer);

  toast.textContent = message;
  toast.classList.add("show");

  Editora.ui.toastTimer =
    setTimeout(function () {
      toast.classList.remove("show");
    }, 2400);
};

Editora.ui.calculateRangeProgress =
  function (
    value,
    minimum,
    maximum
  ) {
    const numericValue = Number(value);
    const numericMinimum = Number(minimum);
    const numericMaximum = Number(maximum);

    const range =
      numericMaximum - numericMinimum;

    if (
      !Number.isFinite(range) ||
      range <= 0
    ) {
      return 0;
    }

    return (
      (
        numericValue -
        numericMinimum
      ) /
      range
    ) * 100;
  };

Editora.ui.formatSliderValue =
  function (type, value) {
    const number = Number(value);

    if (type === "blur") {
      return `${number}px`;
    }

    if (
      type === "fade" ||
      type === "grayscale"
    ) {
      return `${number}%`;
    }

    return number > 0
      ? `+${number}`
      : String(number);
  };

Editora.ui.normaliseColour =
  function (colour) {
    if (
      typeof colour === "string" &&
      /^#[0-9a-f]{6}$/i.test(colour)
    ) {
      return colour;
    }

    return "#17181f";
  };

Editora.ui.renderResizePreset =
  function (
    name,
    width,
    height
  ) {
    return `
      <button
        class="preset-button"
        data-width="${width}"
        data-height="${height}"
        type="button"
      >
        <span>${name}</span>

        <small>
          ${width} × ${height}
        </small>
      </button>
    `;
  };

Editora.ui.renderObjectActions =
  function () {
    return `
      <div class="object-actions">
        <button
          class="object-action"
          data-object-action="duplicate"
          type="button"
        >
          Duplicate
        </button>

        <button
          class="object-action"
          data-object-action="forward"
          type="button"
        >
          Bring forward
        </button>

        <button
          class="object-action"
          data-object-action="backward"
          type="button"
        >
          Send backward
        </button>

        <button
          class="object-action danger"
          data-object-action="delete"
          type="button"
        >
          Delete
        </button>
      </div>
    `;
  };
Editora.ui.escapeHTML = function (value) {
  const text = String(value ?? "");

  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

Editora.ui.formatFileName = function (fileName) {
  const safeName = String(
    fileName || "editora-photo"
  )
    .trim()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return safeName || "editora-photo";
};

Editora.ui.formatDimensions = function (
  width,
  height
) {
  const safeWidth = Math.max(
    1,
    Math.round(Number(width) || 1)
  );

  const safeHeight = Math.max(
    1,
    Math.round(Number(height) || 1)
  );

  return `${safeWidth} × ${safeHeight} px`;
};

Editora.ui.formatPercentage = function (
  value
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0%";
  }

  return `${Math.round(numericValue)}%`;
};

Editora.ui.formatZoom = function () {
  return `${Math.round(
    Editora.state.zoom * 100
  )}%`;
};

Editora.ui.createButton = function ({
  id = "",
  text = "",
  className = "",
  type = "button",
  disabled = false,
  data = {}
} = {}) {
  const button =
    document.createElement("button");

  button.type = type;
  button.textContent = text;
  button.className = className;
  button.disabled = Boolean(disabled);

  if (id) {
    button.id = id;
  }

  Object.entries(data).forEach(
    ([key, value]) => {
      button.dataset[key] = value;
    }
  );

  return button;
};

Editora.ui.setButtonLoading = function (
  button,
  loading,
  loadingText = "Please wait..."
) {
  if (!button) {
    return;
  }

  if (loading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText =
        button.textContent;
    }

    button.disabled = true;
    button.textContent = loadingText;
    button.classList.add("is-loading");

    return;
  }

  button.disabled = false;

  if (button.dataset.originalText) {
    button.textContent =
      button.dataset.originalText;

    delete button.dataset.originalText;
  }

  button.classList.remove("is-loading");
};

Editora.ui.setPanelMessage = function (
  message,
  type = "info"
) {
  const toolContent =
    Editora.ui.elements.toolContent;

  if (!toolContent) {
    return;
  }

  const oldMessage =
    toolContent.querySelector(
      ".panel-message"
    );

  oldMessage?.remove();

  const messageElement =
    document.createElement("div");

  messageElement.className =
    `panel-message ${type}`;

  messageElement.textContent = message;

  toolContent.prepend(messageElement);
};

Editora.ui.clearPanelMessage =
  function () {
    const toolContent =
      Editora.ui.elements.toolContent;

    toolContent
      ?.querySelector(".panel-message")
      ?.remove();
  };

Editora.ui.openModal = function ({
  title = "Editora",
  content = "",
  closeText = "Close",
  onClose = null
} = {}) {
  Editora.ui.closeModal();

  const backdrop =
    document.createElement("div");

  backdrop.className = "modal-backdrop";
  backdrop.id = "editoraModal";

  backdrop.innerHTML = `
    <section
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editoraModalTitle"
    >
      <header class="modal-header">
        <div>
          <h2 id="editoraModalTitle">
            ${Editora.ui.escapeHTML(title)}
          </h2>
        </div>

        <button
          class="modal-close"
          id="editoraModalClose"
          type="button"
          aria-label="${Editora.ui.escapeHTML(
            closeText
          )}"
        >
          ×
        </button>
      </header>

      <div class="modal-content">
        ${content}
      </div>
    </section>
  `;

  document.body.appendChild(backdrop);

  Editora.state.ui.modalOpen = true;

  const closeModal = function () {
    Editora.ui.closeModal();

    if (typeof onClose === "function") {
      onClose();
    }
  };

  backdrop
    .querySelector("#editoraModalClose")
    ?.addEventListener(
      "click",
      closeModal
    );

  backdrop.addEventListener(
    "click",
    function (event) {
      if (event.target === backdrop) {
        closeModal();
      }
    }
  );

  document.addEventListener(
    "keydown",
    Editora.ui.handleModalEscape
  );

  return backdrop;
};

Editora.ui.handleModalEscape =
  function (event) {
    if (
      event.key === "Escape" &&
      Editora.state.ui.modalOpen
    ) {
      Editora.ui.closeModal();
    }
  };

Editora.ui.closeModal = function () {
  const modal =
    document.getElementById(
      "editoraModal"
    );

  modal?.remove();

  Editora.state.ui.modalOpen = false;

  document.removeEventListener(
    "keydown",
    Editora.ui.handleModalEscape
  );
};

Editora.ui.showConfirmation =
  function ({
    title = "Are you sure?",
    message = "",
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = false,
    onConfirm = null,
    onCancel = null
  } = {}) {
    const safeMessage =
      Editora.ui.escapeHTML(message);

    const modal = Editora.ui.openModal({
      title,
      content: `
        <div class="confirmation-content">
          <p>${safeMessage}</p>

          <div class="confirmation-actions">
            <button
              id="confirmationCancel"
              class="secondary-button"
              type="button"
            >
              ${Editora.ui.escapeHTML(
                cancelText
              )}
            </button>

            <button
              id="confirmationConfirm"
              class="${
                danger
                  ? "danger-button"
                  : "primary-button"
              }"
              type="button"
            >
              ${Editora.ui.escapeHTML(
                confirmText
              )}
            </button>
          </div>
        </div>
      `
    });

    modal
      ?.querySelector(
        "#confirmationCancel"
      )
      ?.addEventListener(
        "click",
        function () {
          Editora.ui.closeModal();

          if (
            typeof onCancel === "function"
          ) {
            onCancel();
          }
        }
      );

    modal
      ?.querySelector(
        "#confirmationConfirm"
      )
      ?.addEventListener(
        "click",
        function () {
          Editora.ui.closeModal();

          if (
            typeof onConfirm === "function"
          ) {
            onConfirm();
          }
        }
      );
  };

Editora.ui.showError = function (
  message
) {
  Editora.ui.showToast(
    message || "Something went wrong."
  );

  console.error(
    `[Editora] ${message}`
  );
};

Editora.ui.showSuccess = function (
  message
) {
  Editora.ui.showToast(
    message || "Completed successfully."
  );
};

Editora.ui.setRangeProgress = function (
  rangeInput
) {
  if (!rangeInput) {
    return;
  }

  const minimum =
    Number(rangeInput.min) || 0;

  const maximum =
    Number(rangeInput.max) || 100;

  const value =
    Number(rangeInput.value) || 0;

  const progress =
    Editora.ui.calculateRangeProgress(
      value,
      minimum,
      maximum
    );

  rangeInput.style.setProperty(
    "--range-progress",
    `${progress}%`
  );
};

Editora.ui.refreshAllRangeInputs =
  function () {
    document
      .querySelectorAll(
        'input[type="range"]'
      )
      .forEach((rangeInput) => {
        Editora.ui.setRangeProgress(
          rangeInput
        );
      });
  };

Editora.ui.scrollPropertiesToTop =
  function () {
    const properties =
      Editora.ui.elements.properties;

    if (!properties) {
      return;
    }

    properties.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

Editora.ui.focusCanvas = function () {
  const canvasContainer =
    Editora.ui.elements.canvasContainer;

  if (!canvasContainer) {
    return;
  }

  canvasContainer.setAttribute(
    "tabindex",
    "-1"
  );

  canvasContainer.focus({
    preventScroll: true
  });
};

Editora.ui.refresh = function () {
  const activeTool =
    Editora.state.activeTool ||
    "upload";

  Editora.ui.setActiveToolButtons(
    activeTool
  );

  Editora.ui.updateCanvasState();
  Editora.ui.updateHistoryButtons();
  Editora.ui.renderTool(activeTool);

  requestAnimationFrame(function () {
    Editora.ui.refreshAllRangeInputs();
  });
};

Editora.ui.isMobile = function () {
  return window.matchMedia(
    "(max-width: 760px)"
  ).matches;
};

Editora.ui.isTouchDevice =
  function () {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  };

Editora.ui.getReadableObjectType =
  function (object) {
    if (!object) {
      return "Nothing selected";
    }

    const typeMap = {
      image: "Photo",
      "i-text": "Text",
      text: "Text",
      textbox: "Text",
      rect: "Rectangle",
      circle: "Circle",
      triangle: "Triangle",
      line: "Line",
      polygon: "Shape",
      path: "Shape",
      group: "Group"
    };

    return (
      typeMap[object.type] ||
      "Element"
    );
  };

Editora.ui.getCurrentImageSummary =
  function () {
    if (!Editora.state.imageLoaded) {
      return {
        name: "No photo",
        dimensions: "—",
        format:
          Editora.state.export.format
      };
    }

    return {
      name:
        Editora.state.export.fileName ||
        Editora.state.originalFileName ||
        "editora-photo",

      dimensions:
        Editora.ui.formatDimensions(
          Editora.state.resize.width,
          Editora.state.resize.height
        ),

      format:
        String(
          Editora.state.export.format ||
          "png"
        ).toUpperCase()
    };
  };
