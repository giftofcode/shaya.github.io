"use strict";

const imageUpload = document.getElementById("imageUpload");
const sampleBtn = document.getElementById("sampleBtn");

const welcomeScreen = document.getElementById("welcomeScreen");
const editorScreen = document.getElementById("editorScreen");
const bottomNavigation = document.getElementById("bottomNavigation");

const canvas = document.getElementById("editorCanvas");
const context = canvas.getContext("2d", {
  willReadFrequently: true
});

const checkerboard = document.getElementById("checkerboard");
const loadingOverlay = document.getElementById("loadingOverlay");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const exportHeaderBtn = document.getElementById("exportHeaderBtn");

const adjustmentSlider =
  document.getElementById("adjustmentSlider");

const activeAdjustmentName =
  document.getElementById("activeAdjustmentName");

const activeAdjustmentValue =
  document.getElementById("activeAdjustmentValue");

const sliderMinimum =
  document.getElementById("sliderMinimum");

const sliderMaximum =
  document.getElementById("sliderMaximum");

const adjustmentOptions =
  document.querySelectorAll(".adjustment-option");

const filterCards =
  document.querySelectorAll(".filter-card");

const ratioButtons =
  document.querySelectorAll(".ratio-button");

const navItems =
  document.querySelectorAll(".nav-item");

const panels =
  document.querySelectorAll(".panel-content");

const resetAdjustmentsBtn =
  document.getElementById("resetAdjustmentsBtn");

const resetFilterBtn =
  document.getElementById("resetFilterBtn");

const applyCropBtn =
  document.getElementById("applyCropBtn");

const rotateLeftBtn =
  document.getElementById("rotateLeftBtn");

const rotateRightBtn =
  document.getElementById("rotateRightBtn");

const flipHorizontalBtn =
  document.getElementById("flipHorizontalBtn");

const flipVerticalBtn =
  document.getElementById("flipVerticalBtn");

const resetTransformBtn =
  document.getElementById("resetTransformBtn");

const resizeWidth =
  document.getElementById("resizeWidth");

const resizeHeight =
  document.getElementById("resizeHeight");

const lockRatioBtn =
  document.getElementById("lockRatioBtn");

const applyResizeBtn =
  document.getElementById("applyResizeBtn");

const resetResizeBtn =
  document.getElementById("resetResizeBtn");

const imageDimensions =
  document.getElementById("imageDimensions");

const exportFormat =
  document.getElementById("exportFormat");

const exportQuality =
  document.getElementById("exportQuality");

const exportQualityValue =
  document.getElementById("exportQualityValue");

const downloadBtn =
  document.getElementById("downloadBtn");

const newPhotoBtn =
  document.getElementById("newPhotoBtn");

const toast =
  document.getElementById("toast");

const adjustmentSettings = {
  brightness: {
    label: "Brightness",
    min: -100,
    max: 100,
    default: 0
  },

  contrast: {
    label: "Contrast",
    min: -100,
    max: 100,
    default: 0
  },

  saturation: {
    label: "Colour",
    min: -100,
    max: 100,
    default: 0
  },

  warmth: {
    label: "Warmth",
    min: -100,
    max: 100,
    default: 0
  },

  blur: {
    label: "Blur",
    min: 0,
    max: 20,
    default: 0
  },

  grayscale: {
    label: "Black & White",
    min: 0,
    max: 100,
    default: 0
  }
};

let sourceImage = null;
let currentImageDataUrl = "";
let fileBaseName = "editora-photo";

let selectedAdjustment = "brightness";
let selectedCropRatio = "original";
let ratioLocked = true;

let history = [];
let historyIndex = -1;
let historyTimer = null;
let toastTimer = null;

let state = createDefaultState();

function createDefaultState() {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    blur: 0,
    grayscale: 0,
    filter: "original",
    rotation: 0,
    flipX: 1,
    flipY: 1
  };
}

function cloneState() {
  return JSON.parse(JSON.stringify(state));
}

function showToast(message) {
  clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.add("show-toast");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show-toast");
  }, 2200);
}

function showLoading(show) {
  loadingOverlay.classList.toggle("hidden", !show);
}

function getFileBaseName(fileName) {
  return fileName.replace(/\.[^/.]+$/, "") || "editora-photo";
}

imageUpload.addEventListener("change", handleFileUpload);

function handleFileUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    showToast("Please choose a valid photo.");
    return;
  }

  if (file.size > 25 * 1024 * 1024) {
    showToast("Please choose a photo smaller than 25 MB.");
    return;
  }

  fileBaseName = getFileBaseName(file.name);

  const reader = new FileReader();

  reader.onload = function (readerEvent) {
    loadImageFromSource(readerEvent.target.result);
  };

  reader.onerror = function () {
    showToast("The photo could not be opened.");
  };

  reader.readAsDataURL(file);

  event.target.value = "";
}

function loadImageFromSource(source) {
  showLoading(true);

  const image = new Image();

  image.onload = function () {
    sourceImage = image;
    currentImageDataUrl = source;

    state = createDefaultState();
    history = [];
    historyIndex = -1;

    selectedAdjustment = "brightness";
    selectedCropRatio = "original";

    openEditor();
    updateResizeInputs();
    updateDimensionsText();
    syncInterface();
    renderCanvas();
    saveHistory(true);

    showLoading(false);
    showToast("Photo ready to edit.");
  };

  image.onerror = function () {
    showLoading(false);
    showToast("The photo format is not supported.");
  };

  image.src = source;
}

function createSampleImage() {
  const sampleCanvas = document.createElement("canvas");
  const sampleContext = sampleCanvas.getContext("2d");

  sampleCanvas.width = 1200;
  sampleCanvas.height = 1500;

  const sky = sampleContext.createLinearGradient(
    0,
    0,
    0,
    sampleCanvas.height
  );

  sky.addColorStop(0, "#78c5e8");
  sky.addColorStop(0.55, "#ead6ae");
  sky.addColorStop(1, "#d58363");

  sampleContext.fillStyle = sky;
  sampleContext.fillRect(
    0,
    0,
    sampleCanvas.width,
    sampleCanvas.height
  );

  sampleContext.fillStyle = "#ffd168";
  sampleContext.beginPath();
  sampleContext.arc(870, 320, 110, 0, Math.PI * 2);
  sampleContext.fill();

  sampleContext.fillStyle = "#4c7263";
  sampleContext.beginPath();
  sampleContext.moveTo(0, 950);
  sampleContext.lineTo(400, 460);
  sampleContext.lineTo(800, 950);
  sampleContext.closePath();
  sampleContext.fill();

  sampleContext.fillStyle = "#375948";
  sampleContext.beginPath();
  sampleContext.moveTo(430, 1000);
  sampleContext.lineTo(850, 560);
  sampleContext.lineTo(1200, 1020);
  sampleContext.closePath();
  sampleContext.fill();

  sampleContext.fillStyle = "#223b34";
  sampleContext.fillRect(0, 960, 1200, 540);

  for (let index = 0; index < 28; index++) {
    const x = Math.random() * 1200;
    const y = 980 + Math.random() * 520;
    const radius = 18 + Math.random() * 50;

    sampleContext.fillStyle =
      index % 2 === 0 ? "#395f49" : "#4f7a58";

    sampleContext.beginPath();
    sampleContext.arc(x, y, radius, 0, Math.PI * 2);
    sampleContext.fill();
  }

  sampleContext.fillStyle = "rgba(255,255,255,0.92)";
  sampleContext.font = "700 62px Arial";
  sampleContext.fillText("EDITORA", 70, 1320);

  sampleContext.font = "400 34px Arial";
  sampleContext.fillText(
    "Your creative photo space",
    70,
    1380
  );

  fileBaseName = "editora-sample";

  loadImageFromSource(
    sampleCanvas.toDataURL("image/jpeg", 0.95)
  );
}

sampleBtn.addEventListener("click", createSampleImage);

function openEditor() {
  welcomeScreen.classList.add("hidden");
  editorScreen.classList.remove("hidden");
  bottomNavigation.classList.remove("hidden");

  undoBtn.disabled = false;
  redoBtn.disabled = true;
  exportHeaderBtn.disabled = false;
}

function resetApplication() {
  sourceImage = null;
  currentImageDataUrl = "";
  state = createDefaultState();

  history = [];
  historyIndex = -1;

  context.clearRect(0, 0, canvas.width, canvas.height);

  editorScreen.classList.add("hidden");
  bottomNavigation.classList.add("hidden");
  welcomeScreen.classList.remove("hidden");

  undoBtn.disabled = true;
  redoBtn.disabled = true;
  exportHeaderBtn.disabled = true;
}

function renderCanvas() {
  if (!sourceImage) {
    return;
  }

  const rotation =
    ((state.rotation % 360) + 360) % 360;

  const swapsDimensions =
    rotation === 90 || rotation === 270;

  const sourceWidth = sourceImage.naturalWidth;
  const sourceHeight = sourceImage.naturalHeight;

  canvas.width = swapsDimensions
    ? sourceHeight
    : sourceWidth;

  canvas.height = swapsDimensions
    ? sourceWidth
    : sourceHeight;

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.save();

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.filter = createFilterString();

  context.translate(
    canvas.width / 2,
    canvas.height / 2
  );

  context.rotate(
    state.rotation * Math.PI / 180
  );

  context.scale(
    state.flipX,
    state.flipY
  );

  context.drawImage(
    sourceImage,
    -sourceWidth / 2,
    -sourceHeight / 2,
    sourceWidth,
    sourceHeight
  );

  context.restore();

  fitCanvasInsideStage();
  updateDimensionsText();
}

function fitCanvasInsideStage() {
  const stageWidth = checkerboard.parentElement.clientWidth - 32;
  const stageHeight = checkerboard.parentElement.clientHeight - 32;

  const scale = Math.min(
    stageWidth / canvas.width,
    stageHeight / canvas.height,
    1
  );

  const displayWidth = Math.max(
    1,
    Math.round(canvas.width * scale)
  );

  const displayHeight = Math.max(
    1,
    Math.round(canvas.height * scale)
  );

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  checkerboard.style.width = `${displayWidth}px`;
  checkerboard.style.height = `${displayHeight}px`;
}

window.addEventListener("resize", fitCanvasInsideStage);

function createFilterString() {
  let brightness = 100 + state.brightness;
  let contrast = 100 + state.contrast;
  let saturation = 100 + state.saturation;
  let grayscale = state.grayscale;
  let sepia = 0;
  let hueRotate = 0;
  let opacity = 100;

  if (state.warmth > 0) {
    sepia += state.warmth * 0.35;
    saturation += state.warmth * 0.18;
  }

  if (state.warmth < 0) {
    hueRotate += Math.abs(state.warmth) * 1.55;
    saturation += Math.abs(state.warmth) * 0.08;
  }

  switch (state.filter) {
    case "vivid":
      saturation += 34;
      contrast += 9;
      brightness += 2;
      break;

    case "warm":
      sepia += 24;
      saturation += 18;
      brightness += 3;
      break;

    case "cool":
      hueRotate += 175;
      saturation += 12;
      break;

    case "mono":
      grayscale = 100;
      contrast += 8;
      break;

    case "vintage":
      sepia += 62;
      contrast -= 7;
      saturation -= 12;
      break;

    case "fade":
      contrast -= 15;
      brightness += 10;
      saturation -= 22;
      opacity = 96;
      break;

    case "dramatic":
      contrast += 42;
      saturation += 17;
      brightness -= 4;
      break;
  }

  return [
    `brightness(${Math.max(0, brightness)}%)`,
    `contrast(${Math.max(0, contrast)}%)`,
    `saturate(${Math.max(0, saturation)}%)`,
    `sepia(${Math.max(0, sepia)}%)`,
    `grayscale(${Math.max(0, grayscale)}%)`,
    `hue-rotate(${hueRotate}deg)`,
    `blur(${state.blur}px)`,
    `opacity(${opacity}%)`
  ].join(" ");
}

adjustmentOptions.forEach((option) => {
  option.addEventListener("click", function () {
    selectedAdjustment = this.dataset.adjustment;

    adjustmentOptions.forEach((item) => {
      item.classList.remove("active-option");
    });

    this.classList.add("active-option");

    syncAdjustmentSlider();
  });
});

function syncAdjustmentSlider() {
  const settings =
    adjustmentSettings[selectedAdjustment];

  adjustmentSlider.min = settings.min;
  adjustmentSlider.max = settings.max;
  adjustmentSlider.value =
    state[selectedAdjustment];

  activeAdjustmentName.textContent =
    settings.label;

  activeAdjustmentValue.textContent =
    formatAdjustmentValue(
      selectedAdjustment,
      state[selectedAdjustment]
    );

  sliderMinimum.textContent = settings.min;
  sliderMaximum.textContent = settings.max;
}

function formatAdjustmentValue(type, value) {
  if (type === "blur") {
    return `${value}px`;
  }

  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

adjustmentSlider.addEventListener("input", function () {
  const value = Number(this.value);

  state[selectedAdjustment] = value;

  activeAdjustmentValue.textContent =
    formatAdjustmentValue(
      selectedAdjustment,
      value
    );

  renderCanvas();
  queueHistorySave();
});

function queueHistorySave() {
  clearTimeout(historyTimer);

  historyTimer = setTimeout(() => {
    saveHistory();
  }, 350);
}

resetAdjustmentsBtn.addEventListener("click", function () {
  Object.keys(adjustmentSettings).forEach((key) => {
    state[key] = adjustmentSettings[key].default;
  });

  syncAdjustmentSlider();
  renderCanvas();
  saveHistory();
  showToast("Adjustments reset.");
});

filterCards.forEach((card) => {
  card.addEventListener("click", function () {
    state.filter = this.dataset.filter;

    filterCards.forEach((item) => {
      item.classList.remove("active-filter");
    });

    this.classList.add("active-filter");

    renderCanvas();
    saveHistory();
  });
});

resetFilterBtn.addEventListener("click", function () {
  state.filter = "original";

  filterCards.forEach((item) => {
    item.classList.toggle(
      "active-filter",
      item.dataset.filter === "original"
    );
  });

  renderCanvas();
  saveHistory();
  showToast("Original look restored.");
});

ratioButtons.forEach((button) => {
  button.addEventListener("click", function () {
    selectedCropRatio = this.dataset.ratio;

    ratioButtons.forEach((item) => {
      item.classList.remove("active-ratio");
    });

    this.classList.add("active-ratio");
  });
});

function getCropRatioValue(ratio) {
  const ratios = {
    "1:1": 1,
    "4:5": 4 / 5,
    "9:16": 9 / 16,
    "16:9": 16 / 9,
    "3:2": 3 / 2
  };

  return ratios[ratio] || null;
}

applyCropBtn.addEventListener("click", function () {
  if (!sourceImage) {
    return;
  }

  if (selectedCropRatio === "original") {
    showToast("The original ratio is already active.");
    return;
  }

  renderCanvas();

  const ratio = getCropRatioValue(selectedCropRatio);

  if (!ratio) {
    return;
  }

  const currentWidth = canvas.width;
  const currentHeight = canvas.height;
  const currentRatio = currentWidth / currentHeight;

  let cropWidth = currentWidth;
  let cropHeight = currentHeight;

  if (currentRatio > ratio) {
    cropWidth = currentHeight * ratio;
  } else {
    cropHeight = currentWidth / ratio;
  }

  const cropX = (currentWidth - cropWidth) / 2;
  const cropY = (currentHeight - cropHeight) / 2;

  const cropCanvas = document.createElement("canvas");
  const cropContext = cropCanvas.getContext("2d");

  cropCanvas.width = Math.round(cropWidth);
  cropCanvas.height = Math.round(cropHeight);

  cropContext.drawImage(
    canvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );

  commitCanvasAsNewSource(
    cropCanvas,
    "Crop applied."
  );
});

rotateLeftBtn.addEventListener("click", function () {
  state.rotation -= 90;
  renderCanvas();
  saveHistory();
});

rotateRightBtn.addEventListener("click", function () {
  state.rotation += 90;
  renderCanvas();
  saveHistory();
});

flipHorizontalBtn.addEventListener("click", function () {
  state.flipX *= -1;
  renderCanvas();
  saveHistory();
});

flipVerticalBtn.addEventListener("click", function () {
  state.flipY *= -1;
  renderCanvas();
  saveHistory();
});

resetTransformBtn.addEventListener("click", function () {
  state.rotation = 0;
  state.flipX = 1;
  state.flipY = 1;

  renderCanvas();
  saveHistory();
  showToast("Rotation and flip reset.");
});

function updateResizeInputs() {
  if (!sourceImage) {
    return;
  }

  resizeWidth.value = sourceImage.naturalWidth;
  resizeHeight.value = sourceImage.naturalHeight;
}

function updateDimensionsText() {
  if (!sourceImage) {
    imageDimensions.textContent = "";
    return;
  }

  imageDimensions.textContent =
    `Current image: ${canvas.width} × ${canvas.height} px`;
}

lockRatioBtn.addEventListener("click", function () {
  ratioLocked = !ratioLocked;

  lockRatioBtn.classList.toggle(
    "active-lock",
    ratioLocked
  );

  lockRatioBtn.textContent = ratioLocked
    ? "🔗 Keep proportions"
    : "🔓 Free proportions";
});

resizeWidth.addEventListener("input", function () {
  if (!ratioLocked || !sourceImage) {
    return;
  }

  const width = Number(this.value);

  if (!width || width < 1) {
    return;
  }

  const ratio =
    sourceImage.naturalWidth /
    sourceImage.naturalHeight;

  resizeHeight.value = Math.round(width / ratio);
});

resizeHeight.addEventListener("input", function () {
  if (!ratioLocked || !sourceImage) {
    return;
  }

  const height = Number(this.value);

  if (!height || height < 1) {
    return;
  }

  const ratio =
    sourceImage.naturalWidth /
    sourceImage.naturalHeight;

  resizeWidth.value = Math.round(height * ratio);
});

applyResizeBtn.addEventListener("click", function () {
  if (!sourceImage) {
    return;
  }

  const width = Number(resizeWidth.value);
  const height = Number(resizeHeight.value);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width > 10000 ||
    height > 10000
  ) {
    showToast("Enter a size between 1 and 10,000 pixels.");
    return;
  }

  renderCanvas();

  const resizeCanvas = document.createElement("canvas");
  const resizeContext = resizeCanvas.getContext("2d");

  resizeCanvas.width = Math.round(width);
  resizeCanvas.height = Math.round(height);

  resizeContext.imageSmoothingEnabled = true;
  resizeContext.imageSmoothingQuality = "high";

  resizeContext.drawImage(
    canvas,
    0,
    0,
    resizeCanvas.width,
    resizeCanvas.height
  );

  commitCanvasAsNewSource(
    resizeCanvas,
    "Photo resized."
  );
});

resetResizeBtn.addEventListener("click", function () {
  updateResizeInputs();
  showToast("Original size restored in the fields.");
});

function commitCanvasAsNewSource(sourceCanvas, message) {
  const dataUrl =
    sourceCanvas.toDataURL("image/png");

  const image = new Image();

  image.onload = function () {
    sourceImage = image;
    currentImageDataUrl = dataUrl;

    state = createDefaultState();

    history = [];
    historyIndex = -1;

    updateResizeInputs();
    syncInterface();
    renderCanvas();
    saveHistory(true);

    showToast(message);
  };

  image.src = dataUrl;
}

function saveHistory(force = false) {
  if (!sourceImage) {
    return;
  }

  const snapshot = {
    state: cloneState(),
    source: currentImageDataUrl
  };

  const serialized = JSON.stringify(snapshot);

  if (
    !force &&
    historyIndex >= 0 &&
    JSON.stringify(history[historyIndex]) === serialized
  ) {
    return;
  }

  history = history.slice(0, historyIndex + 1);
  history.push(snapshot);

  if (history.length > 30) {
    history.shift();
  }

  historyIndex = history.length - 1;

  updateHistoryButtons();
}

function updateHistoryButtons() {
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled =
    historyIndex >= history.length - 1;
}

undoBtn.addEventListener("click", function () {
  if (historyIndex <= 0) {
    return;
  }

  historyIndex -= 1;
  restoreHistorySnapshot(history[historyIndex]);
});

redoBtn.addEventListener("click",
