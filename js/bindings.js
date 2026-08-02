"use strict";

window.Editora = window.Editora || {};
Editora.ui = Editora.ui || {};

/* --------------------------------------------------
   CURRENT PANEL ROUTER
-------------------------------------------------- */

Editora.ui.bindCurrentPanel = function (toolName) {
  const binders = {
    upload: Editora.ui.bindUploadPanel,
    adjust: Editora.ui.bindAdjustPanel,
    filters: Editora.ui.bindFiltersPanel,
    crop: Editora.ui.bindCropPanel,
    text: Editora.ui.bindTextPanel,
    elements: Editora.ui.bindElementsPanel,
    resize: Editora.ui.bindResizePanel,
    export: Editora.ui.bindExportPanel
  };

  const binder = binders[toolName];

  if (typeof binder === "function") {
    binder();
  }

  requestAnimationFrame(function () {
    Editora.ui.refreshAllRangeInputs();
  });
};

/* --------------------------------------------------
   UPLOAD PANEL
-------------------------------------------------- */

Editora.ui.bindUploadPanel = function () {
  const sampleButton =
    Editora.ui.getElement("panelSamplePhoto");

  const pasteButton =
    Editora.ui.getElement("pastePhotoButton");

  sampleButton?.addEventListener(
    "click",
    function () {
      if (
        Editora.upload &&
        typeof Editora.upload.loadSamplePhoto ===
          "function"
      ) {
        Editora.upload.loadSamplePhoto();
      }
    }
  );

  pasteButton?.addEventListener(
    "click",
    function () {
      if (
        Editora.upload &&
        typeof Editora.upload.pasteFromClipboard ===
          "function"
      ) {
        Editora.upload.pasteFromClipboard();
      }
    }
  );
};

/* --------------------------------------------------
   ADJUST PANEL
-------------------------------------------------- */

Editora.ui.bindAdjustPanel = function () {
  const sliders =
    document.querySelectorAll(
      ".adjustment-slider"
    );

  sliders.forEach((slider) => {
    slider.addEventListener(
      "input",
      function () {
        const adjustment =
          slider.dataset.adjustment;

        const value =
          Number(slider.value);

        Editora.updateAdjustment(
          adjustment,
          value
        );

        Editora.ui.setRangeProgress(
          slider
        );

        const valueLabel =
          Editora.ui.getElement(
            `${adjustment}Value`
          );

        if (valueLabel) {
          valueLabel.textContent =
            Editora.ui.formatSliderValue(
              adjustment,
              value
            );
        }

        if (
          Editora.canvas &&
          typeof Editora.canvas.applyAdjustments ===
            "function"
        ) {
          Editora.canvas.applyAdjustments();
        }
      }
    );

    slider.addEventListener(
      "change",
      function () {
        if (
          Editora.canvas &&
          typeof Editora.canvas.saveHistory ===
            "function"
        ) {
          Editora.canvas.saveHistory();
        }
      }
    );
  });

  const resetButton =
    Editora.ui.getElement(
      "resetAdjustmentsButton"
    );

  resetButton?.addEventListener(
    "click",
    function () {
      Editora.resetAdjustments();

      Editora.canvas?.applyAdjustments?.();
      Editora.canvas?.saveHistory?.();

      Editora.ui.renderTool("adjust");

      Editora.ui.showToast(
        "Adjustments reset."
      );
    }
  );
};

/* --------------------------------------------------
   FILTER PANEL
-------------------------------------------------- */

Editora.ui.bindFiltersPanel = function () {
  const filterButtons =
    document.querySelectorAll(
      ".filter-card"
    );

  filterButtons.forEach((button) => {
    button.addEventListener(
      "click",
      function () {
        const filter =
          button.dataset.filter ||
          "original";

        Editora.setActiveFilter(filter);

        Editora.canvas?.applyFilter?.(
          filter
        );

        Editora.canvas?.saveHistory?.();

        Editora.ui.renderTool("filters");
      }
    );
  });

  const resetButton =
    Editora.ui.getElement(
      "resetFilterButton"
    );

  resetButton?.addEventListener(
    "click",
    function () {
      Editora.setActiveFilter(
        "original"
      );

      Editora.canvas?.applyFilter?.(
        "original"
      );

      Editora.canvas?.saveHistory?.();

      Editora.ui.renderTool("filters");
    }
  );
};

/* --------------------------------------------------
   CROP PANEL
-------------------------------------------------- */

Editora.ui.bindCropPanel = function () {
  const ratioButtons =
    document.querySelectorAll(
      ".ratio-button"
    );

  ratioButtons.forEach((button) => {
    button.addEventListener(
      "click",
      function () {
        const ratio =
          button.dataset.ratio ||
          "free";

        Editora.setCropRatio(ratio);

        Editora.ui.renderTool("crop");
      }
    );
  });

  const startCropButton =
    Editora.ui.getElement(
      "startCropButton"
    );

  startCropButton?.addEventListener(
    "click",
    function () {
      Editora.canvas?.startCrop?.(
        Editora.state.crop.ratio
      );
    }
  );

  const cancelCropButton =
    Editora.ui.getElement(
      "cancelCropButton"
    );

  cancelCropButton?.addEventListener(
    "click",
    function () {
      Editora.canvas?.cancelCrop?.();
    }
  );

  const transformButtons =
    document.querySelectorAll(
      "[data-transform]"
    );

  transformButtons.forEach((button) => {
    button.addEventListener(
      "click",
      function () {
        const action =
          button.dataset.transform;

        Editora.canvas?.transformImage?.(
          action
        );
      }
    );
  });
};

/* --------------------------------------------------
   TEXT PANEL
-------------------------------------------------- */

Editora.ui.bindTextPanel = function () {
  const presetButtons =
    document.querySelectorAll(
      "[data-text-preset]"
    );

  presetButtons.forEach((button) => {
    button.addEventListener(
      "click",
      function () {
        const preset =
          button.dataset.textPreset;

        Editora.canvas?.addText?.(
          preset
        );
      }
    );
  });

  const fontFamilyInput =
    Editora.ui.getElement(
      "textFontFamily"
    );

  fontFamilyInput?.addEventListener(
    "change",
    function () {
      Editora.canvas?.updateSelectedText?.({
        fontFamily:
          fontFamilyInput.value
      });
    }
  );

  const fontSizeInput =
    Editora.ui.getElement(
      "textFontSize"
    );

  fontSizeInput?.addEventListener(
    "change",
    function () {
      const fontSize =
        Number(fontSizeInput.value);

      if (
        !Number.isFinite(fontSize) ||
        fontSize < 8 ||
        fontSize > 300
      ) {
        Editora.ui.showToast(
          "Choose a font size between 8 and 300."
        );

        return;
      }

      Editora.canvas?.updateSelectedText?.({
        fontSize
      });
    }
  );

  const textColourInput =
    Editora.ui.getElement(
      "textColour"
    );

  textColourInput?.addEventListener(
    "input",
    function () {
      Editora.canvas?.updateSelectedText?.({
        fill:
          textColourInput.value
      });
    }
  );

  const boldButton =
    Editora.ui.getElement(
      "textBoldButton"
    );

  boldButton?.addEventListener(
    "click",
    function () {
      const selectedObject =
        Editora.state.selectedObject;

      const nextWeight =
        selectedObject?.fontWeight ===
        "bold"
          ? "normal"
          : "bold";

      Editora.canvas?.updateSelectedText?.({
        fontWeight: nextWeight
      });

      Editora.ui.renderTool("text");
    }
  );

  const italicButton =
    Editora.ui.getElement(
      "textItalicButton"
    );

  italicButton?.addEventListener(
    "click",
    function () {
      const selectedObject =
        Editora.state.selectedObject;

      const nextStyle =
        selectedObject?.fontStyle ===
        "italic"
          ? "normal"
          : "italic";

      Editora.canvas?.updateSelectedText?.({
        fontStyle: nextStyle
      });

      Editora.ui.renderTool("text");
    }
  );

  const alignmentButtons =
    document.querySelectorAll(
      "[data-text-align]"
    );

  alignmentButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        function () {
          const textAlign =
            button.dataset.textAlign;

          Editora.canvas
            ?.updateSelectedText?.({
              textAlign
            });
        }
      );
    }
  );

  Editora.ui.bindObjectActions();
};

/* --------------------------------------------------
   ELEMENTS PANEL
-------------------------------------------------- */

Editora.ui.bindElementsPanel = function () {
  const elementButtons =
    document.querySelectorAll(
      "[data-element]"
    );

  elementButtons.forEach((button) => {
    button.addEventListener(
      "click",
      function () {
        const elementType =
          button.dataset.element;

        Editora.canvas?.addElement?.(
          elementType
        );
      }
    );
  });

  const fillInput =
    Editora.ui.getElement(
      "shapeFillColour"
    );

  fillInput?.addEventListener(
    "input",
    function () {
      Editora.canvas
        ?.updateSelectedObject?.({
          fill: fillInput.value
        });
    }
  );

  const opacityInput =
    Editora.ui.getElement(
      "shapeOpacity"
    );

  opacityInput?.addEventListener(
    "input",
    function () {
      const opacity =
        Number(opacityInput.value) /
        100;

      Editora.ui.setRangeProgress(
        opacityInput
      );

      Editora.canvas
        ?.updateSelectedObject?.({
          opacity
        });

      const valueLabel =
        Editora.ui.getElement(
          "shapeOpacityValue"
        );

      if (valueLabel) {
        valueLabel.textContent =
          `${opacityInput.value}%`;
      }
    }
  );

  opacityInput?.addEventListener(
    "change",
    function () {
      Editora.canvas?.saveHistory?.();
    }
  );

  Editora.ui.bindObjectActions();
};

/* --------------------------------------------------
   OBJECT ACTIONS
-------------------------------------------------- */

Editora.ui.bindObjectActions = function () {
  const actionButtons =
    document.querySelectorAll(
      "[data-object-action]"
    );

  actionButtons.forEach((button) => {
    button.addEventListener(
      "click",
      function () {
        const action =
          button.dataset.objectAction;

        Editora.canvas
          ?.runObjectAction?.(
            action
          );
      }
    );
  });
};

/* --------------------------------------------------
   RESIZE PANEL
-------------------------------------------------- */

Editora.ui.bindResizePanel = function () {
  const widthInput =
    Editora.ui.getElement(
      "resizeWidthInput"
    );

  const heightInput =
    Editora.ui.getElement(
      "resizeHeightInput"
    );

  const originalWidth =
    Number(
      Editora.state.resize.width
    ) || 1;

  const originalHeight =
    Number(
      Editora.state.resize.height
    ) || 1;

  const aspectRatio =
    originalWidth / originalHeight;

  widthInput?.addEventListener(
    "input",
    function () {
      if (
        !Editora.state.resize.keepRatio
      ) {
        return;
      }

      const width =
        Number(widthInput.value);

      if (
        !Number.isFinite(width) ||
        width < 1
      ) {
        return;
      }

      heightInput.value =
        Math.max(
          1,
          Math.round(
            width / aspectRatio
          )
        );
    }
  );

  heightInput?.addEventListener(
    "input",
    function () {
      if (
        !Editora.state.resize.keepRatio
      ) {
        return;
      }

      const height =
        Number(heightInput.value);

      if (
        !Number.isFinite(height) ||
        height < 1
      ) {
        return;
      }

      widthInput.value =
        Math.max(
          1,
          Math.round(
            height * aspectRatio
          )
        );
    }
  );

  const ratioLockButton =
    Editora.ui.getElement(
      "resizeRatioLock"
    );

  ratioLockButton?.addEventListener(
    "click",
    function () {
      Editora.setKeepRatio(
        !Editora.state.resize.keepRatio
      );

      Editora.ui.renderTool("resize");
    }
  );

  const applyResizeButton =
    Editora.ui.getElement(
      "applyResizeButton"
    );

  applyResizeButton?.addEventListener(
    "click",
    function () {
      const width =
        Number(widthInput?.value);

      const height =
        Number(heightInput?.value);

      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width < 1 ||
        height < 1 ||
        width > 10000 ||
        height > 10000
      ) {
        Editora.ui.showToast(
          "Enter dimensions between 1 and 10,000 pixels."
        );

        return;
      }

      Editora.canvas?.resizeCanvas?.(
        Math.round(width),
        Math.round(height)
      );
    }
  );

  const presetButtons =
    document.querySelectorAll(
      ".preset-button"
    );

  presetButtons.forEach((button) => {
    button.addEventListener(
      "click",
      function () {
        const width =
          Number(button.dataset.width);

        const height =
          Number(button.dataset.height);

        Editora.canvas?.resizeCanvas?.(
          width,
          height
        );
      }
    );
  });
};

/* --------------------------------------------------
   EXPORT PANEL
-------------------------------------------------- */

Editora.ui.bindExportPanel = function () {
  const formatInput =
    Editora.ui.getElement(
      "exportFormatInput"
    );

  const qualityInput =
    Editora.ui.getElement(
      "exportQualityInput"
    );

  formatInput?.addEventListener(
    "change",
    function () {
      Editora.setExportSettings({
        format:
          formatInput.value
      });
    }
  );

  qualityInput?.addEventListener(
    "input",
    function () {
      const quality =
        Number(
          qualityInput.value
        );

      Editora.ui.setRangeProgress(
        qualityInput
      );

      const valueLabel =
        Editora.ui.getElement(
          "exportQualityValue"
        );

      if (valueLabel) {
        valueLabel.textContent =
          `${quality}%`;
      }

      Editora.setExportSettings({
        quality:
          quality / 100
      });
    }
  );

  const galleryButton =
    Editora.ui.getElement(
      "saveToGalleryButton"
    );

  galleryButton?.addEventListener(
    "click",
    function () {
      Editora.exporter
        ?.saveToGallery?.();
    }
  );

  const saveLocationButton =
    Editora.ui.getElement(
      "chooseSaveLocationButton"
    );

  saveLocationButton?.addEventListener(
    "click",
    function () {
      Editora.exporter
        ?.chooseSaveLocation?.();
    }
  );

  const downloadButton =
    Editora.ui.getElement(
      "downloadPhotoButton"
    );

  downloadButton?.addEventListener(
    "click",
    function () {
      Editora.exporter
        ?.download?.();
    }
  );
};
