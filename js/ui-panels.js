"use strict";

window.Editora = window.Editora || {};
Editora.ui = Editora.ui || {};

/* --------------------------------------------------
   UPLOAD PANEL
-------------------------------------------------- */

Editora.ui.renderUploadPanel = function () {
  const uploadLabel = Editora.state.imageLoaded
    ? "Replace current photo"
    : "Choose photo from device";

  return `
    <section class="panel-section">
      <div class="panel-heading">
        <div>
          <h3>Add your photo</h3>
          <p>Upload JPG, PNG or WebP.</p>
        </div>
      </div>

      <label
        class="uploadCard"
        for="uploadInput"
      >
        <span>${uploadLabel}</span>
      </label>

      <button
        id="panelSamplePhoto"
        class="secondary-button"
        type="button"
      >
        Try sample photo
      </button>

      <button
        id="pastePhotoButton"
        class="secondary-button"
        type="button"
      >
        Paste copied photo
      </button>
    </section>

    <section class="panel-section">
      <span class="status-pill success">
        ● Private editing
      </span>

      <p>
        Your photo stays inside your browser and is not
        uploaded to a server.
      </p>
    </section>
  `;
};

/* --------------------------------------------------
   ADJUST PANEL
-------------------------------------------------- */

Editora.ui.renderAdjustPanel = function () {
  const adjustments = Editora.state.adjustments;

  const controls = [
    {
      key: "brightness",
      label: "Light",
      icon: "☀",
      min: -100,
      max: 100
    },
    {
      key: "contrast",
      label: "Contrast",
      icon: "◐",
      min: -100,
      max: 100
    },
    {
      key: "saturation",
      label: "Colour",
      icon: "◉",
      min: -100,
      max: 100
    },
    {
      key: "warmth",
      label: "Warmth",
      icon: "♨",
      min: -100,
      max: 100
    },
    {
      key: "blur",
      label: "Blur",
      icon: "◌",
      min: 0,
      max: 20
    },
    {
      key: "fade",
      label: "Fade",
      icon: "◍",
      min: 0,
      max: 100
    }
  ];

  const controlsHTML = controls
    .map((control) => {
      const value =
        Number(adjustments[control.key]) || 0;

      const progress =
        Editora.ui.calculateRangeProgress(
          value,
          control.min,
          control.max
        );

      return `
        <div class="slider-control">
          <div class="slider-header">
            <span>
              ${control.icon}
              ${control.label}
            </span>

            <strong id="${control.key}Value">
              ${Editora.ui.formatSliderValue(
                control.key,
                value
              )}
            </strong>
          </div>

          <input
            class="adjustment-slider"
            type="range"
            data-adjustment="${control.key}"
            min="${control.min}"
            max="${control.max}"
            value="${value}"
            style="--range-progress: ${progress}%"
          >
        </div>
      `;
    })
    .join("");

  return `
    <section class="panel-section">
      <div class="panel-heading">
        <div>
          <h3>Photo adjustments</h3>
          <p>Improve light, colour and clarity.</p>
        </div>

        <button
          id="resetAdjustmentsButton"
          class="panel-reset"
          type="button"
        >
          Reset
        </button>
      </div>

      ${controlsHTML}
    </section>
  `;
};

/* --------------------------------------------------
   FILTER PANEL
-------------------------------------------------- */

Editora.ui.renderFiltersPanel = function () {
  const filters = [
    ["original", "Original"],
    ["vivid", "Vivid"],
    ["bright", "Bright"],
    ["warm", "Warm"],
    ["cool", "Cool"],
    ["mono", "Mono"],
    ["vintage", "Vintage"],
    ["fade", "Fade"],
    ["dramatic", "Dramatic"],
    ["soft", "Soft"]
  ];

  const previewSource =
    Editora.upload?.currentPreviewSource || "";

  const filtersHTML = filters
    .map(([key, label]) => {
      const active =
        Editora.state.activeFilter === key;

      const preview = previewSource
        ? `
          <img
            src="${previewSource}"
            alt=""
            class="filter-${key}"
          >
        `
        : `
          <span
            class="filter-thumbnail filter-${key}"
          ></span>
        `;

      return `
        <button
          class="filter-card ${active ? "active" : ""}"
          data-filter="${key}"
          type="button"
        >
          ${preview}
          <span>${label}</span>
        </button>
      `;
    })
    .join("");

  return `
    <section class="panel-section">
      <div class="panel-heading">
        <div>
          <h3>Creative filters</h3>
          <p>Give your photo a new look.</p>
        </div>

        <button
          id="resetFilterButton"
          class="panel-reset"
          type="button"
        >
          Original
        </button>
      </div>

      <div class="filter-list">
        ${filtersHTML}
      </div>
    </section>
  `;
};

/* --------------------------------------------------
   CROP PANEL
-------------------------------------------------- */

Editora.ui.renderCropPanel = function () {
  const activeRatio =
    Editora.state.crop.ratio || "free";

  const ratios = [
    ["free", "Free", "ratio-original"],
    ["original", "Original", "ratio-original"],
    ["1:1", "Square", "ratio-square"],
    ["4:5", "4:5 Post", "ratio-portrait"],
    ["9:16", "Story", "ratio-story"],
    ["16:9", "Wide", "ratio-wide"]
  ];

  const ratioButtons = ratios
    .map(([ratio, label, shapeClass]) => {
      return `
        <button
          class="ratio-button ${
            activeRatio === ratio ? "active" : ""
          }"
          data-ratio="${ratio}"
          type="button"
        >
          <span
            class="ratio-shape ${shapeClass}"
          ></span>

          <span>${label}</span>
        </button>
      `;
    })
    .join("");

  return `
    <section class="panel-section">
      <div class="panel-heading">
        <div>
          <h3>Crop ratio</h3>
          <p>Select the required image shape.</p>
        </div>
      </div>

      <div class="ratio-grid">
        ${ratioButtons}
      </div>

      <div class="crop-actions">
        <button
          id="startCropButton"
          class="primary-button"
          type="button"
        >
          Start crop
        </button>

        <button
          id="cancelCropButton"
          class="secondary-button"
          type="button"
        >
          Cancel
        </button>
      </div>
    </section>

    <section class="panel-section">
      <div class="panel-heading">
        <div>
          <h3>Rotate and flip</h3>
          <p>Correct the photo direction.</p>
        </div>
      </div>

      <div class="transform-grid">
        <button
          class="transform-button"
          data-transform="rotate-left"
          type="button"
        >
          <span>↶</span>
          Rotate left
        </button>

        <button
          class="transform-button"
          data-transform="rotate-right"
          type="button"
        >
          <span>↷</span>
          Rotate right
        </button>

        <button
          class="transform-button"
          data-transform="flip-horizontal"
          type="button"
        >
          <span>↔</span>
          Flip side
        </button>

        <button
          class="transform-button"
          data-transform="flip-vertical"
          type="button"
        >
          <span>↕</span>
          Flip vertical
        </button>
      </div>
    </section>
  `;
};

/* --------------------------------------------------
   TEXT PANEL
-------------------------------------------------- */

Editora.ui.renderTextPanel = function () {
  const selectedObject =
    Editora.state.selectedObject;

  const textSelected =
    selectedObject &&
    [
      "i-text",
      "text",
      "textbox"
    ].includes(selectedObject.type);

  const fontSize = textSelected
    ? Math.round(selectedObject.fontSize || 40)
    : 40;

  const fill = textSelected
    ? Editora.ui.normaliseColour(
        selectedObject.fill
      )
    : "#17181f";

  const fontFamily = textSelected
    ? selectedObject.fontFamily || "Arial"
    : "Arial";

  const fontWeight = textSelected
    ? selectedObject.fontWeight || "normal"
    : "normal";

  const fontStyle = textSelected
    ? selectedObject.fontStyle || "normal"
    : "normal";

  const textSettings = textSelected
    ? `
      <section class="panel-section">
        <div class="selected-object-label">
          Selected text settings
        </div>

        <label class="field">
          <span class="field-label">
            Font
          </span>

          <select
            id="textFontFamily"
            class="select-input"
          >
            ${Editora.ui.renderFontOption(
              "Arial",
              fontFamily
            )}

            ${Editora.ui.renderFontOption(
              "Georgia",
              fontFamily
            )}

            ${Editora.ui.renderFontOption(
              "Verdana",
              fontFamily
            )}

            ${Editora.ui.renderFontOption(
              "Trebuchet MS",
              fontFamily,
              "Trebuchet"
            )}

            ${Editora.ui.renderFontOption(
              "Times New Roman",
              fontFamily
            )}
          </select>
        </label>

        <div class="inline-controls">
          <label class="field">
            <span class="field-label">
              Size
            </span>

            <input
              id="textFontSize"
              class="number-input"
              type="number"
              min="8"
              max="300"
              value="${fontSize}"
            >
          </label>

          <label class="field">
            <span class="field-label">
              Colour
            </span>

            <div class="color-control">
              <input
                id="textColour"
                type="color"
                value="${fill}"
              >

              <span>Text colour</span>
            </div>
          </label>
        </div>

        <div class="format-controls">
          <button
            id="textBoldButton"
            class="format-button ${
              fontWeight === "bold"
                ? "active"
                : ""
            }"
            type="button"
            aria-label="Bold"
          >
            B
          </button>

          <button
            id="textItalicButton"
            class="format-button ${
              fontStyle === "italic"
                ? "active"
                : ""
            }"
            type="button"
            aria-label="Italic"
          >
            <em>I</em>
          </button>

          <button
            class="format-button"
            data-text-align="left"
            type="button"
            aria-label="Align left"
          >
            ≡
          </button>

          <button
            class="format-button"
            data-text-align="center"
            type="button"
            aria-label="Align centre"
          >
            ≣
          </button>

          <button
            class="format-button"
            data-text-align="right"
            type="button"
            aria-label="Align right"
          >
            ≡
          </button>
        </div>

        ${Editora.ui.renderObjectActions()}
      </section>
    `
    : `
      <section class="panel-section">
        <p>
          Select a text object on the canvas to change
          its font, size, colour and alignment.
        </p>
      </section>
    `;

  return `
    <section class="panel-section">
      <div class="panel-heading">
        <div>
          <h3>Add text</h3>
          <p>Add editable text to your design.</p>
        </div>
      </div>

      <button
        class="text-preset heading"
        data-text-preset="heading"
        type="button"
      >
        Add a heading
      </button>

      <button
        class="text-preset subheading"
        data-text-preset="subheading"
        type="button"
      >
        Add a subheading
      </button>

      <button
        class="text-preset body"
        data-text-preset="body"
        type="button"
      >
        Add body text
      </button>
    </section>

    ${textSettings}
  `;
};

Editora.ui.renderFontOption = function (
  value,
  selectedValue,
  label = value
) {
  const selected =
    value === selectedValue
      ? "selected"
      : "";

  return `
    <option
      value="${value}"
      ${selected}
    >
      ${label}
    </option>
  `;
};
/* --------------------------------------------------
   ELEMENTS PANEL
-------------------------------------------------- */

Editora.ui.renderElementsPanel = function () {
  const selectedObject =
    Editora.state.selectedObject;

  const shapeSelected =
    selectedObject &&
    ![
      "image",
      "i-text",
      "text",
      "textbox"
    ].includes(selectedObject.type);

  const fill = shapeSelected
    ? Editora.ui.normaliseColour(
        selectedObject.fill || "#7c5cfc"
      )
    : "#7c5cfc";

  const opacity = shapeSelected
    ? Math.round(
        (selectedObject.opacity ?? 1) * 100
      )
    : 100;

  const settings = shapeSelected
    ? `
      <section class="panel-section">
        <div class="selected-object-label">
          Selected element settings
        </div>

        <label class="field">
          <span class="field-label">
            Fill colour
          </span>

          <div class="color-control">
            <input
              id="shapeFillColour"
              type="color"
              value="${fill}"
            >

            <span>Element colour</span>
          </div>
        </label>

        <div class="slider-control">
          <div class="slider-header">
            <span>Opacity</span>

            <strong id="shapeOpacityValue">
              ${opacity}%
            </strong>
          </div>

          <input
            id="shapeOpacity"
            type="range"
            min="10"
            max="100"
            value="${opacity}"
            style="--range-progress: ${opacity}%"
          >
        </div>

        ${Editora.ui.renderObjectActions()}
      </section>
    `
    : `
      <section class="panel-section">
        <p>
          Select an element on the canvas to change
          its colour, opacity and layer position.
        </p>
      </section>
    `;

  return `
    <section class="panel-section">
      <div class="panel-heading">
        <div>
          <h3>Basic shapes</h3>
          <p>Add shapes to your design.</p>
        </div>
      </div>

      <div class="element-grid">
        <button
          class="element-button"
          data-element="rectangle"
          type="button"
        >
          <span>▭</span>
          Rectangle
        </button>

        <button
          class="element-button"
          data-element="circle"
          type="button"
        >
          <span>●</span>
          Circle
        </button>

        <button
          class="element-button"
          data-element="triangle"
          type="button"
        >
          <span>▲</span>
          Triangle
        </button>

        <button
          class="element-button"
          data-element="line"
          type="button"
        >
          <span>╱</span>
          Line
        </button>

        <button
          class="element-button"
          data-element="star"
          type="button"
        >
          <span>★</span>
          Star
        </button>

        <button
          class="element-button"
          data-element="heart"
          type="button"
        >
          <span>♥</span>
          Heart
        </button>
      </div>
    </section>

    ${settings}
  `;
};

/* --------------------------------------------------
   RESIZE PANEL
-------------------------------------------------- */

Editora.ui.renderResizePanel = function () {
  const width = Math.max(
    1,
    Math.round(Editora.state.resize.width)
  );

  const height = Math.max(
    1,
    Math.round(Editora.state.resize.height)
  );

  const lockClass =
    Editora.state.resize.keepRatio
      ? "active"
      : "";

  return `
    <section class="panel-section">
      <div class="panel-heading">
        <div>
          <h3>Custom size</h3>
          <p>Enter the required dimensions.</p>
        </div>
      </div>

      <div class="resize-grid">
        <label class="dimension-field">
          <span>Width</span>

          <input
            id="resizeWidthInput"
            class="dimension-input"
            type="number"
            min="1"
            max="10000"
            value="${width}"
          >
        </label>

        <button
          id="resizeRatioLock"
          class="ratio-lock ${lockClass}"
          type="button"
          aria-label="Keep proportions"
        >
          🔗
        </button>

        <label class="dimension-field">
          <span>Height</span>

          <input
            id="resizeHeightInput"
            class="dimension-input"
            type="number"
            min="1"
            max="10000"
            value="${height}"
          >
        </label>
      </div>

      <button
        id="applyResizeButton"
        class="primary-button"
        type="button"
      >
        Apply new size
      </button>
    </section>

    <section class="panel-section">
      <div class="panel-heading">
        <div>
          <h3>Social media presets</h3>
          <p>Choose a ready-made size.</p>
        </div>
      </div>

      <div class="preset-list">
        ${Editora.ui.renderResizePreset(
          "Instagram Post",
          1080,
          1080
        )}

        ${Editora.ui.renderResizePreset(
          "Instagram Portrait",
          1080,
          1350
        )}

        ${Editora.ui.renderResizePreset(
          "Instagram Story",
          1080,
          1920
        )}

        ${Editora.ui.renderResizePreset(
          "YouTube Thumbnail",
          1280,
          720
        )}

        ${Editora.ui.renderResizePreset(
          "Facebook Post",
          1200,
          630
        )}
      </div>
    </section>
  `;
};

/* --------------------------------------------------
   EXPORT PANEL
-------------------------------------------------- */

Editora.ui.renderExportPanel = function () {
  const summary =
    Editora.ui.getCurrentImageSummary();

  const format =
    Editora.state.export.format || "png";

  const quality = Math.round(
    (Editora.state.export.quality || 0.92) *
      100
  );

  return `
    <section class="panel-section">
      <div class="export-summary">
        <strong>
          ${Editora.ui.escapeHTML(summary.name)}
        </strong>

        <span>
          ${Editora.ui.escapeHTML(
            summary.dimensions
          )}
        </span>

        <span>
          Your edited photo is ready.
        </span>
      </div>

      <label class="field">
        <span class="field-label">
          File type
        </span>

        <select
          id="exportFormatInput"
          class="select-input"
        >
          <option
            value="png"
            ${format === "png" ? "selected" : ""}
          >
            PNG
          </option>

          <option
            value="jpeg"
            ${format === "jpeg" ? "selected" : ""}
          >
            JPG
          </option>

          <option
            value="webp"
            ${format === "webp" ? "selected" : ""}
          >
            WebP
          </option>
        </select>
      </label>

      <div class="slider-control">
        <div class="slider-header">
          <span>Quality</span>

          <strong id="exportQualityValue">
            ${quality}%
          </strong>
        </div>

        <input
          id="exportQualityInput"
          type="range"
          min="20"
          max="100"
          value="${quality}"
          style="--range-progress: ${quality}%"
        >
      </div>

      <button
        id="saveToGalleryButton"
        class="export-action primary"
        type="button"
      >
        Save to Gallery
      </button>

      <button
        id="chooseSaveLocationButton"
        class="export-action secondary"
        type="button"
      >
        Choose save location
      </button>

      <button
        id="downloadPhotoButton"
        class="export-action secondary"
        type="button"
      >
        Download photo
      </button>
    </section>

    <section class="panel-section">
      <p>
        Gallery saving depends on your phone and browser.
        Editora automatically uses download as a fallback.
      </p>
    </section>
  `;
};
