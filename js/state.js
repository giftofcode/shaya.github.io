"use strict";

window.Editora = window.Editora || {};

Editora.state = {
  activeTool: "upload",
  imageLoaded: false,
  selectedObject: null,

  zoom: 1,
  minimumZoom: 0.2,
  maximumZoom: 3,

  history: [],
  historyIndex: -1,
  historyLimit: 40,
  isRestoringHistory: false,

  originalFileName: "editora-photo",
  originalImageWidth: 0,
  originalImageHeight: 0,

  crop: {
    active: false,
    ratio: "free"
  },

  resize: {
    width: 1080,
    height: 1080,
    keepRatio: true
  },

  adjustments: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    blur: 0,
    fade: 0,
    grayscale: 0
  },

  activeFilter: "original",

  export: {
    format: "png",
    quality: 0.92,
    fileName: "editora-photo"
  },

  ui: {
    isLoading: false,
    modalOpen: false
  }
};

Editora.defaults = {
  adjustments: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    blur: 0,
    fade: 0,
    grayscale: 0
  },

  export: {
    format: "png",
    quality: 0.92
  }
};

Editora.getState = function () {
  return Editora.state;
};

Editora.setState = function (updates) {
  if (!updates || typeof updates !== "object") {
    return;
  }

  Object.assign(Editora.state, updates);
};

Editora.setActiveTool = function (toolName) {
  if (!toolName || typeof toolName !== "string") {
    return;
  }

  Editora.state.activeTool = toolName;
};

Editora.setImageLoaded = function (loaded) {
  Editora.state.imageLoaded = Boolean(loaded);
};

Editora.setSelectedObject = function (object) {
  Editora.state.selectedObject = object || null;
};

Editora.setZoom = function (value) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return Editora.state.zoom;
  }

  const clampedValue = Math.min(
    Editora.state.maximumZoom,
    Math.max(Editora.state.minimumZoom, parsedValue)
  );

  Editora.state.zoom = clampedValue;

  return clampedValue;
};

Editora.updateAdjustment = function (name, value) {
  if (!(name in Editora.state.adjustments)) {
    return;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return;
  }

  Editora.state.adjustments[name] = parsedValue;
};

Editora.resetAdjustments = function () {
  Editora.state.adjustments = {
    ...Editora.defaults.adjustments
  };
};

Editora.setActiveFilter = function (filterName) {
  Editora.state.activeFilter = filterName || "original";
};

Editora.setCropRatio = function (ratio) {
  Editora.state.crop.ratio = ratio || "free";
};

Editora.setCropActive = function (active) {
  Editora.state.crop.active = Boolean(active);
};

Editora.setResizeDimensions = function (width, height) {
  const safeWidth = Math.max(1, Math.round(Number(width) || 1));
  const safeHeight = Math.max(1, Math.round(Number(height) || 1));

  Editora.state.resize.width = safeWidth;
  Editora.state.resize.height = safeHeight;
};

Editora.setKeepRatio = function (enabled) {
  Editora.state.resize.keepRatio = Boolean(enabled);
};

Editora.setExportSettings = function (settings) {
  if (!settings || typeof settings !== "object") {
    return;
  }

  if (settings.format) {
    Editora.state.export.format = settings.format;
  }

  if (Number.isFinite(Number(settings.quality))) {
    Editora.state.export.quality = Number(settings.quality);
  }

  if (settings.fileName) {
    Editora.state.export.fileName = settings.fileName;
  }
};

Editora.setOriginalImageDetails = function ({
  fileName,
  width,
  height
}) {
  if (fileName) {
    Editora.state.originalFileName = fileName;
    Editora.state.export.fileName = fileName;
  }

  if (Number.isFinite(Number(width))) {
    Editora.state.originalImageWidth = Number(width);
  }

  if (Number.isFinite(Number(height))) {
    Editora.state.originalImageHeight = Number(height);
  }

  if (width && height) {
    Editora.setResizeDimensions(width, height);
  }
};

Editora.resetEditorState = function () {
  Editora.state.activeTool = "upload";
  Editora.state.imageLoaded = false;
  Editora.state.selectedObject = null;

  Editora.state.zoom = 1;

  Editora.state.history = [];
  Editora.state.historyIndex = -1;
  Editora.state.isRestoringHistory = false;

  Editora.state.originalFileName = "editora-photo";
  Editora.state.originalImageWidth = 0;
  Editora.state.originalImageHeight = 0;

  Editora.state.crop = {
    active: false,
    ratio: "free"
  };

  Editora.state.resize = {
    width: 1080,
    height: 1080,
    keepRatio: true
  };

  Editora.state.adjustments = {
    ...Editora.defaults.adjustments
  };

  Editora.state.activeFilter = "original";

  Editora.state.export = {
    ...Editora.defaults.export,
    fileName: "editora-photo"
  };

  Editora.state.ui = {
    isLoading: false,
    modalOpen: false
  };
};

Editora.createSnapshot = function () {
  return {
    activeTool: Editora.state.activeTool,
    zoom: Editora.state.zoom,

    adjustments: {
      ...Editora.state.adjustments
    },

    activeFilter: Editora.state.activeFilter,

    crop: {
      ...Editora.state.crop
    },

    resize: {
      ...Editora.state.resize
    },

    export: {
      ...Editora.state.export
    }
  };
};

Editora.saveHistorySnapshot = function (canvasJSON) {
  if (
    Editora.state.isRestoringHistory ||
    !Editora.state.imageLoaded ||
    !canvasJSON
  ) {
    return;
  }

  const snapshot = {
    canvasJSON,
    editorState: Editora.createSnapshot()
  };

  const serializedSnapshot = JSON.stringify(snapshot);

  const currentSnapshot =
    Editora.state.history[Editora.state.historyIndex];

  if (
    currentSnapshot &&
    JSON.stringify(currentSnapshot) === serializedSnapshot
  ) {
    return;
  }

  Editora.state.history = Editora.state.history.slice(
    0,
    Editora.state.historyIndex + 1
  );

  Editora.state.history.push(snapshot);

  if (
    Editora.state.history.length >
    Editora.state.historyLimit
  ) {
    Editora.state.history.shift();
  }

  Editora.state.historyIndex =
    Editora.state.history.length - 1;

  document.dispatchEvent(
    new CustomEvent("editora:historychange")
  );
};

Editora.canUndo = function () {
  return Editora.state.historyIndex > 0;
};

Editora.canRedo = function () {
  return (
    Editora.state.historyIndex >= 0 &&
    Editora.state.historyIndex <
      Editora.state.history.length - 1
  );
};

Editora.getUndoSnapshot = function () {
  if (!Editora.canUndo()) {
    return null;
  }

  Editora.state.historyIndex -= 1;

  document.dispatchEvent(
    new CustomEvent("editora:historychange")
  );

  return Editora.state.history[
    Editora.state.historyIndex
  ];
};

Editora.getRedoSnapshot = function () {
  if (!Editora.canRedo()) {
    return null;
  }

  Editora.state.historyIndex += 1;

  document.dispatchEvent(
    new CustomEvent("editora:historychange")
  );

  return Editora.state.history[
    Editora.state.historyIndex
  ];
};

Editora.restoreEditorState = function (snapshotState) {
  if (!snapshotState) {
    return;
  }

  Editora.state.activeTool =
    snapshotState.activeTool ||
    Editora.state.activeTool;

  Editora.state.zoom =
    Number(snapshotState.zoom) || 1;

  Editora.state.adjustments = {
    ...Editora.defaults.adjustments,
    ...(snapshotState.adjustments || {})
  };

  Editora.state.activeFilter =
    snapshotState.activeFilter || "original";

  Editora.state.crop = {
    active: false,
    ratio: "free",
    ...(snapshotState.crop || {})
  };

  Editora.state.resize = {
    ...Editora.state.resize,
    ...(snapshotState.resize || {})
  };

  Editora.state.export = {
    ...Editora.state.export,
    ...(snapshotState.export || {})
  };
};

Editora.setLoading = function (loading) {
  Editora.state.ui.isLoading = Boolean(loading);

  document.dispatchEvent(
    new CustomEvent("editora:loadingchange", {
      detail: {
        loading: Editora.state.ui.isLoading
      }
    })
  );
};
