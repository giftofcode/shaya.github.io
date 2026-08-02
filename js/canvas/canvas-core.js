"use strict";

window.Editora = window.Editora || {};
Editora.canvas = Editora.canvas || {};

Editora.canvas.instance = null;
Editora.canvas.backgroundImage = null;
Editora.canvas.originalImageSource = "";
Editora.canvas.historyTimer = null;
Editora.canvas.isReady = false;

/* --------------------------------------------------
   INITIALIZE FABRIC CANVAS
-------------------------------------------------- */

Editora.canvas.initialize = function () {
  if (typeof fabric === "undefined") {
    console.error("Fabric.js is not loaded.");

    Editora.ui?.showToast?.(
      "Editor library could not load."
    );

    return false;
  }

  const canvasElement =
    document.getElementById("editorCanvas");

  if (!canvasElement) {
    console.error(
      "The editorCanvas element was not found."
    );

    return false;
  }

  if (Editora.canvas.instance) {
    return true;
  }

  Editora.canvas.instance =
    new fabric.Canvas("editorCanvas", {
      width: 1080,
      height: 1080,

      backgroundColor: "#ffffff",

      preserveObjectStacking: true,

      selection: true,

      stopContextMenu: true,

      fireRightClick: true,

      controlsAboveOverlay: true,

      enableRetinaScaling: true,

      renderOnAddRemove: true
    });

  Editora.canvas.configureFabricDefaults();
  Editora.canvas.bindCanvasEvents();

  Editora.canvas.isReady = true;

  requestAnimationFrame(function () {
    Editora.canvas.fitToScreen();
  });

  return true;
};

/* --------------------------------------------------
   FABRIC DEFAULT OBJECT STYLE
-------------------------------------------------- */

Editora.canvas.configureFabricDefaults =
  function () {
    fabric.Object.prototype.set({
      transparentCorners: false,

      cornerColor: "#7c5cfc",

      cornerStrokeColor: "#ffffff",

      borderColor: "#7c5cfc",

      cornerStyle: "circle",

      cornerSize:
        window.innerWidth <= 760 ? 18 : 13,

      borderScaleFactor: 2,

      padding: 3,

      rotatingPointOffset: 30
    });
  };

/* --------------------------------------------------
   CANVAS EVENTS
-------------------------------------------------- */

Editora.canvas.bindCanvasEvents =
  function () {
    const canvas =
      Editora.canvas.instance;

    if (!canvas) {
      return;
    }

    canvas.on(
      "selection:created",
      Editora.canvas.handleSelection
    );

    canvas.on(
      "selection:updated",
      Editora.canvas.handleSelection
    );

    canvas.on(
      "selection:cleared",
      Editora.canvas.handleSelectionCleared
    );

    canvas.on(
      "object:modified",
      function () {
        Editora.canvas.saveHistory();
        Editora.canvas.render();
      }
    );

    canvas.on(
      "object:added",
      function (event) {
        const object = event.target;

        if (
          !object ||
          object.isBackgroundImage ||
          Editora.state?.isRestoringHistory
        ) {
          return;
        }

        Editora.canvas.queueHistorySave();
      }
    );

    canvas.on(
      "object:removed",
      function (event) {
        const object = event.target;

        if (
          !object ||
          object.isBackgroundImage ||
          Editora.state?.isRestoringHistory
        ) {
          return;
        }

        Editora.canvas.queueHistorySave();
      }
    );

    canvas.on(
      "mouse:wheel",
      Editora.canvas.handleMouseWheel
    );
  };

Editora.canvas.handleSelection =
  function (event) {
    const selectedObject =
      event.selected?.[0] ||
      event.target ||
      null;

    Editora.setSelectedObject?.(
      selectedObject
    );

    document.dispatchEvent(
      new CustomEvent(
        "editora:selectionchange"
      )
    );
  };

Editora.canvas.handleSelectionCleared =
  function () {
    Editora.setSelectedObject?.(null);

    document.dispatchEvent(
      new CustomEvent(
        "editora:selectionchange"
      )
    );
  };

/* --------------------------------------------------
   LOAD IMAGE ON CANVAS
-------------------------------------------------- */

Editora.canvas.loadImageSource = function (
  source,
  options = {}
) {
  return new Promise(function (
    resolve,
    reject
  ) {
    if (!Editora.canvas.instance) {
      Editora.canvas.initialize();
    }

    if (!source) {
      reject(
        new Error("No image source supplied.")
      );

      return;
    }

    Editora.setLoading?.(true);

    fabric.Image.fromURL(
      source,

      function (image) {
        try {
          if (!image) {
            throw new Error(
              "Fabric could not create the image."
            );
          }

          Editora.canvas.clearCanvas(false);

          Editora.canvas.originalImageSource =
            source;

          image.set({
            left: 0,
            top: 0,

            originX: "left",
            originY: "top",

            selectable: false,
            evented: false,

            hasControls: false,
            hasBorders: false,

            hoverCursor: "default",

            objectCaching: false,

            isBackgroundImage: true,

            excludeFromExport: false
          });

          Editora.canvas.backgroundImage =
            image;

          const imageWidth =
            image.width || 1;

          const imageHeight =
            image.height || 1;

          Editora.canvas.setCanvasDimensions(
            imageWidth,
            imageHeight,
            false
          );

          image.scaleX =
            Editora.canvas.instance.getWidth() /
            imageWidth;

          image.scaleY =
            Editora.canvas.instance.getHeight() /
            imageHeight;

          Editora.canvas.instance.add(image);

          Editora.canvas.instance.sendToBack(
            image
          );

          Editora.canvas.instance
            .setActiveObject(null);

          Editora.setImageLoaded?.(true);

          Editora.setOriginalImageDetails?.({
            fileName:
              options.fileName ||
              Editora.state?.originalFileName ||
              "editora-photo",

            width: imageWidth,

            height: imageHeight
          });

          Editora.canvas.fitToScreen();

          Editora.canvas.instance
            .requestRenderAll();

          Editora.canvas.saveHistory(true);

          document.dispatchEvent(
            new CustomEvent(
              "editora:image-loaded",
              {
                detail: {
                  width: imageWidth,
                  height: imageHeight
                }
              }
            )
          );

          Editora.setLoading?.(false);

          resolve(image);
        } catch (error) {
          Editora.setLoading?.(false);

          console.error(
            "Editora image loading error:",
            error
          );

          reject(error);
        }
      },

      {
        crossOrigin: "anonymous"
      }
    );
  });
};

/* --------------------------------------------------
   CANVAS SIZE
-------------------------------------------------- */

Editora.canvas.setCanvasDimensions =
  function (
    width,
    height,
    updateState = true
  ) {
    const canvas =
      Editora.canvas.instance;

    if (!canvas) {
      return;
    }

    const safeWidth = Math.max(
      1,
      Math.round(Number(width) || 1)
    );

    const safeHeight = Math.max(
      1,
      Math.round(Number(height) || 1)
    );

    canvas.setWidth(safeWidth);
    canvas.setHeight(safeHeight);

    canvas.calcOffset();

    if (updateState) {
      Editora.setResizeDimensions?.(
        safeWidth,
        safeHeight
      );
    }

    Editora.canvas.fitToScreen();
    Editora.canvas.render();
  };

/* --------------------------------------------------
   FIT CANVAS TO SCREEN
-------------------------------------------------- */

Editora.canvas.fitToScreen = function () {
  const canvas =
    Editora.canvas.instance;

  const container =
    document.getElementById(
      "canvasContainer"
    );

  if (!canvas || !container) {
    return;
  }

  const containerWidth = Math.max(
    100,
    container.clientWidth - 24
  );

  const containerHeight = Math.max(
    100,
    container.clientHeight - 24
  );

  const canvasWidth =
    canvas.getWidth() || 1;

  const canvasHeight =
    canvas.getHeight() || 1;

  let zoom = Math.min(
    containerWidth / canvasWidth,
    containerHeight / canvasHeight
  );

  if (!Number.isFinite(zoom)) {
    zoom = 1;
  }

  zoom = Math.min(1, zoom);

  zoom = Math.max(
    Editora.state?.minimumZoom || 0.1,
    zoom
  );

  Editora.canvas.setZoom(zoom, false);
};

/* --------------------------------------------------
   ZOOM
-------------------------------------------------- */

Editora.canvas.setZoom = function (
  zoomValue,
  centerViewport = true
) {
  const canvas =
    Editora.canvas.instance;

  if (!canvas) {
    return;
  }

  const minimum =
    Editora.state?.minimumZoom || 0.1;

  const maximum =
    Editora.state?.maximumZoom || 4;

  const zoom = Math.min(
    maximum,
    Math.max(
      minimum,
      Number(zoomValue) || 1
    )
  );

  Editora.setZoom?.(zoom);

  canvas.setZoom(zoom);

  if (centerViewport) {
    Editora.canvas.centerViewport();
  } else {
    Editora.canvas.updateCanvasCSSSize();
  }

  canvas.calcOffset();
  canvas.requestRenderAll();

  document.dispatchEvent(
    new CustomEvent(
      "editora:zoomchange",
      {
        detail: {
          zoom
        }
      }
    )
  );
};

Editora.canvas.zoomIn = function () {
  const current =
    Editora.state?.zoom || 1;

  Editora.canvas.setZoom(
    current + 0.1
  );
};

Editora.canvas.zoomOut = function () {
  const current =
    Editora.state?.zoom || 1;

  Editora.canvas.setZoom(
    current - 0.1
  );
};

Editora.canvas.resetZoom = function () {
  Editora.canvas.fitToScreen();
};

Editora.canvas.handleMouseWheel =
  function (eventData) {
    const event = eventData.e;

    if (!event.ctrlKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const canvas =
      Editora.canvas.instance;

    if (!canvas) {
      return;
    }

    let zoom =
      canvas.getZoom();

    zoom *=
      0.999 **
      event.deltaY;

    zoom = Math.min(
      Editora.state?.maximumZoom || 4,
      Math.max(
        Editora.state?.minimumZoom || 0.1,
        zoom
      )
    );

    Editora.setZoom?.(zoom);

    const point =
      new fabric.Point(
        event.offsetX,
        event.offsetY
      );

    canvas.zoomToPoint(
      point,
      zoom
    );

    Editora.canvas.updateCanvasCSSSize();
    canvas.requestRenderAll();
  };

/* --------------------------------------------------
   DISPLAY SIZE
-------------------------------------------------- */

Editora.canvas.updateCanvasCSSSize =
  function () {
    const canvas =
      Editora.canvas.instance;

    if (!canvas) {
      return;
    }

    const zoom =
      canvas.getZoom() || 1;

    const wrapper =
      canvas.wrapperEl;

    if (!wrapper) {
      return;
    }

    const displayWidth =
      canvas.getWidth() * zoom;

    const displayHeight =
      canvas.getHeight() * zoom;

    wrapper.style.width =
      `${displayWidth}px`;

    wrapper.style.height =
      `${displayHeight}px`;
  };

Editora.canvas.centerViewport =
  function () {
    const canvas =
      Editora.canvas.instance;

    if (!canvas) {
      return;
    }

    canvas.viewportTransform = [
      Editora.state?.zoom || 1,
      0,
      0,
      Editora.state?.zoom || 1,
      0,
      0
    ];

    Editora.canvas.updateCanvasCSSSize();
  };

/* --------------------------------------------------
   RENDER
-------------------------------------------------- */

Editora.canvas.render = function () {
  Editora.canvas.instance
    ?.requestRenderAll();
};

/* --------------------------------------------------
   CLEAR CANVAS
-------------------------------------------------- */

Editora.canvas.clearCanvas = function (
  resetState = true
) {
  const canvas =
    Editora.canvas.instance;

  if (!canvas) {
    return;
  }

  canvas.clear();

  canvas.backgroundColor =
    "#ffffff";

  Editora.canvas.backgroundImage =
    null;

  Editora.canvas.originalImageSource =
    "";

  if (resetState) {
    Editora.resetEditorState?.();

    document.dispatchEvent(
      new CustomEvent(
        "editora:canvas-cleared"
      )
    );
  }

  canvas.requestRenderAll();
};

/* --------------------------------------------------
   OBJECT SELECTION
-------------------------------------------------- */

Editora.canvas.getActiveObject =
  function () {
    return (
      Editora.canvas.instance
        ?.getActiveObject() || null
    );
  };

Editora.canvas.discardSelection =
  function () {
    const canvas =
      Editora.canvas.instance;

    if (!canvas) {
      return;
    }

    canvas.discardActiveObject();
    Editora.setSelectedObject?.(null);
    canvas.requestRenderAll();
  };

/* --------------------------------------------------
   HISTORY CONNECTION
-------------------------------------------------- */

Editora.canvas.queueHistorySave =
  function () {
    clearTimeout(
      Editora.canvas.historyTimer
    );

    Editora.canvas.historyTimer =
      setTimeout(function () {
        Editora.canvas.saveHistory();
      }, 250);
  };

Editora.canvas.saveHistory = function (
  force = false
) {
  const canvas =
    Editora.canvas.instance;

  if (
    !canvas ||
    !Editora.state?.imageLoaded
  ) {
    return;
  }

  if (
    Editora.state?.isRestoringHistory &&
    !force
  ) {
    return;
  }

  const canvasJSON =
    canvas.toJSON([
      "isBackgroundImage",
      "excludeFromExport",
      "name"
    ]);

  Editora.saveHistorySnapshot?.(
    canvasJSON
  );
};

/* --------------------------------------------------
   HELPERS FOR LATER MODULES
-------------------------------------------------- */

Editora.canvas.getBackgroundImage =
  function () {
    return Editora.canvas.backgroundImage;
  };

Editora.canvas.getCanvas = function () {
  return Editora.canvas.instance;
};

Editora.canvas.getCanvasElement =
  function () {
    return document.getElementById(
      "editorCanvas"
    );
  };

Editora.canvas.getCanvasDimensions =
  function () {
    const canvas =
      Editora.canvas.instance;

    if (!canvas) {
      return {
        width: 0,
        height: 0
      };
    }

    return {
      width: canvas.getWidth(),
      height: canvas.getHeight()
    };
  };
