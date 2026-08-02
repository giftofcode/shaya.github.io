"use strict";

const imageUpload = document.getElementById("imageUpload");
const canvas = document.getElementById("editorCanvas");
const ctx = canvas.getContext("2d");

const emptyState = document.getElementById("emptyState");
const canvasWrapper = document.getElementById("canvasWrapper");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const resetBtn = document.getElementById("resetBtn");
const downloadBtn = document.getElementById("downloadBtn");
const sideDownloadBtn = document.getElementById("sideDownloadBtn");

const rotateLeftBtn = document.getElementById("rotateLeftBtn");
const rotateRightBtn = document.getElementById("rotateRightBtn");
const flipHorizontalBtn = document.getElementById("flipHorizontalBtn");
const flipVerticalBtn = document.getElementById("flipVerticalBtn");

const downloadFormat = document.getElementById("downloadFormat");
const downloadQuality = document.getElementById("downloadQuality");
const qualityValue = document.getElementById("qualityValue");

const sliders = {
  brightness: document.getElementById("brightness"),
  contrast: document.getElementById("contrast"),
  saturation: document.getElementById("saturation"),
  blur: document.getElementById("blur"),
  grayscale: document.getElementById("grayscale"),
  sepia: document.getElementById("sepia"),
  zoom: document.getElementById("zoom")
};

const valueLabels = {
  brightness: document.getElementById("brightnessValue"),
  contrast: document.getElementById("contrastValue"),
  saturation: document.getElementById("saturationValue"),
  blur: document.getElementById("blurValue"),
  grayscale: document.getElementById("grayscaleValue"),
  sepia: document.getElementById("sepiaValue"),
  zoom: document.getElementById("zoomValue")
};

const filterButtons = document.querySelectorAll(".filter-btn");

let originalImage = null;
let uploadedFileName = "edited-photo";

let state = createDefaultState();
let history = [];
let historyIndex = -1;
let sliderHistoryTimer = null;

function createDefaultState() {
  return {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    rotation: 0,
    flipX: 1,
    flipY: 1,
    zoom: 100,
    activeFilter: "normal"
  };
}

function getImageBaseName(fileName) {
  return fileName.replace(/\.[^/.]+$/, "") || "edited-photo";
}

function setEditorEnabled(enabled) {
  const editorControls = [
    undoBtn,
    redoBtn,
    resetBtn,
    downloadBtn,
    sideDownloadBtn,
    rotateLeftBtn,
    rotateRightBtn,
    flipHorizontalBtn,
    flipVerticalBtn,
    downloadFormat,
    downloadQuality,
    ...Object.values(sliders),
    ...filterButtons
  ];

  editorControls.forEach((control) => {
    control.disabled = !enabled;
  });

  updateHistoryButtons();
}

imageUpload.addEventListener("change", handleImageUpload);

function handleImageUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (readerEvent) {
    const image = new Image();

    image.onload = function () {
      originalImage = image;
      uploadedFileName = getImageBaseName(file.name);

      state = createDefaultState();
      history = [];
      historyIndex = -1;

      emptyState.classList.add("hidden");
      canvasWrapper.classList.remove("hidden");

      setEditorEnabled(true);
      syncControlsWithState();
      saveHistory();
      renderImage();
    };

    image.onerror = function () {
      alert("The selected image could not be opened.");
    };

    image.src = readerEvent.target.result;
  };

  reader.onerror = function () {
    alert("The file could not be read.");
  };

  reader.readAsDataURL(file);

  event.target.value = "";
}

function renderImage() {
  if (!originalImage) {
    return;
  }

  const normalizedRotation =
    ((state.rotation % 360) + 360) % 360;

  const swapDimensions =
    normalizedRotation === 90 ||
    normalizedRotation === 270;

  const imageWidth = originalImage.naturalWidth;
  const imageHeight = originalImage.naturalHeight;

  canvas.width = swapDimensions
    ? imageHeight
    : imageWidth;

  canvas.height = swapDimensions
    ? imageWidth
    : imageHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  ctx.filter = createFilterString();

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.scale(state.flipX, state.flipY);

  ctx.drawImage(
    originalImage,
    -imageWidth / 2,
    -imageHeight / 2,
    imageWidth,
    imageHeight
  );

  ctx.restore();

  canvas.style.width =
    `${canvas.width * (state.zoom / 100)}px`;

  canvas.style.height =
    `${canvas.height * (state.zoom / 100)}px`;
}

function createFilterString() {
  let brightness = state.brightness;
  let contrast = state.contrast;
  let saturation = state.saturation;
  let grayscale = state.grayscale;
  let sepia = state.sepia;
  let hueRotate = 0;

  switch (state.activeFilter) {
    case "grayscale":
      grayscale = 100;
      break;

    case "sepia":
      sepia = 85;
      saturation = Math.max(saturation, 115);
      break;

    case "warm":
      sepia = Math.max(sepia, 25);
      saturation = Math.max(saturation, 125);
      brightness = Math.max(brightness, 103);
      break;

    case "cool":
      hueRotate = 175;
      saturation = Math.max(saturation, 110);
      break;

    case "dramatic":
      contrast = Math.max(contrast, 145);
      saturation = Math.max(saturation, 120);
      break;
  }

  return `
    brightness(${brightness}%)
    contrast(${contrast}%)
    saturate(${saturation}%)
    blur(${state.blur}px)
    grayscale(${grayscale}%)
    sepia(${sepia}%)
    hue-rotate(${hueRotate}deg)
  `;
}

function syncControlsWithState() {
  sliders.brightness.value = state.brightness;
  sliders.contrast.value = state.contrast;
  sliders.saturation.value = state.saturation;
  sliders.blur.value = state.blur;
  sliders.grayscale.value = state.grayscale;
  sliders.sepia.value = state.sepia;
  sliders.zoom.value = state.zoom;

  valueLabels.brightness.textContent =
    `${state.brightness}%`;

  valueLabels.contrast.textContent =
    `${state.contrast}%`;

  valueLabels.saturation.textContent =
    `${state.saturation}%`;

  valueLabels.blur.textContent =
    `${state.blur}px`;

  valueLabels.grayscale.textContent =
    `${state.grayscale}%`;

  valueLabels.sepia.textContent =
    `${state.sepia}%`;

  valueLabels.zoom.textContent =
    `${state.zoom}%`;

  filterButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.filter === state.activeFilter
    );
  });

  canvas.style.width =
    `${canvas.width * (state.zoom / 100)}px`;

  canvas.style.height =
    `${canvas.height * (state.zoom / 100)}px`;
}

Object.entries(sliders).forEach(([property, slider]) => {
  slider.addEventListener("input", function () {
    const value = Number(this.value);

    state[property] = value;
    updateValueLabel(property, value);

    if (property === "zoom") {
      updateCanvasZoom();
    } else {
      renderImage();
    }

    clearTimeout(sliderHistoryTimer);

    sliderHistoryTimer = setTimeout(() => {
      saveHistory();
    }, 350);
  });
});

function updateValueLabel(property, value) {
  if (property === "blur") {
    valueLabels[property].textContent = `${value}px`;
    return;
  }

  valueLabels[property].textContent = `${value}%`;
}

function updateCanvasZoom() {
  if (!originalImage) {
    return;
  }

  canvas.style.width =
    `${canvas.width * (state.zoom / 100)}px`;

  canvas.style.height =
    `${canvas.height * (state.zoom / 100)}px`;
}

rotateLeftBtn.addEventListener("click", function () {
  state.rotation -= 90;
  renderImage();
  saveHistory();
});

rotateRightBtn.addEventListener("click", function () {
  state.rotation += 90;
  renderImage();
  saveHistory();
});

flipHorizontalBtn.addEventListener("click", function () {
  state.flipX *= -1;
  renderImage();
  saveHistory();
});

flipVerticalBtn.addEventListener("click", function () {
  state.flipY *= -1;
  renderImage();
  saveHistory();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", function () {
    state.activeFilter = this.dataset.filter;

    filterButtons.forEach((filterButton) => {
      filterButton.classList.remove("active");
    });

    this.classList.add("active");

    renderImage();
    saveHistory();
  });
});

resetBtn.addEventListener("click", function () {
  if (!originalImage) {
    return;
  }

  state = createDefaultState();

  syncControlsWithState();
  renderImage();
  saveHistory();
});

function saveHistory() {
  const currentState = JSON.stringify(state);

  if (
    historyIndex >= 0 &&
    history[historyIndex] === currentState
  ) {
    return;
  }

  history = history.slice(0, historyIndex + 1);
  history.push(currentState);
  historyIndex = history.length - 1;

  if (history.length > 40) {
    history.shift();
    historyIndex--;
  }

  updateHistoryButtons();
}

function updateHistoryButtons() {
  if (!originalImage) {
    undoBtn.disabled = true;
    redoBtn.disabled = true;
    return;
  }

  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled =
    historyIndex >= history.length - 1;
}

undoBtn.addEventListener("click", function () {
  if (historyIndex <= 0) {
    return;
  }

  historyIndex--;
  state = JSON.parse(history[historyIndex]);

  syncControlsWithState();
  renderImage();
  updateHistoryButtons();
});

redoBtn.addEventListener("click", function () {
  if (historyIndex >= history.length - 1) {
    return;
  }

  historyIndex++;
  state = JSON.parse(history[historyIndex]);

  syncControlsWithState();
  renderImage();
  updateHistoryButtons();
});

downloadQuality.addEventListener("input", function () {
  qualityValue.textContent = `${this.value}%`;
});

downloadBtn.addEventListener("click", downloadEditedImage);
sideDownloadBtn.addEventListener("click", downloadEditedImage);

function downloadEditedImage() {
  if (!originalImage) {
    alert("Please upload a photo first.");
    return;
  }

  const format = downloadFormat.value;
  const quality = Number(downloadQuality.value) / 100;

  let mimeType = "image/png";
  let extension = "png";

  if (format === "jpeg") {
    mimeType = "image/jpeg";
    extension = "jpg";
  }

  if (format === "webp") {
    mimeType = "image/webp";
    extension = "webp";
  }

  const link = document.createElement("a");

  link.download =
    `${uploadedFileName}-edited.${extension}`;

  link.href = canvas.toDataURL(mimeType, quality);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

setEditorEnabled(false);
