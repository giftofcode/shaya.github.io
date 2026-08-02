"use strict";

window.Editora = window.Editora || {};
Editora.upload = Editora.upload || {};

Editora.upload.currentPreviewSource = "";
Editora.upload.maximumFileSize = 25 * 1024 * 1024;
Editora.upload.maximumMobileDimension = 2400;
Editora.upload.maximumDesktopDimension = 4096;

/* --------------------------------------------------
   INITIALIZE UPLOAD SYSTEM
-------------------------------------------------- */

Editora.upload.initialize = function () {
  const uploadInput =
    document.getElementById("uploadInput");

  const sampleButton =
    document.getElementById("samplePhoto");

  const canvasContainer =
    document.getElementById("canvasContainer");

  if (!uploadInput) {
    console.error(
      "Editora upload input was not found."
    );

    return;
  }

  uploadInput.addEventListener(
    "change",
    Editora.upload.handleFileSelection
  );

  sampleButton?.addEventListener(
    "click",
    function () {
      Editora.upload.loadSamplePhoto();
    }
  );

  Editora.upload.bindDragAndDrop(
    canvasContainer
  );

  Editora.upload.bindPasteEvent();
};

/* --------------------------------------------------
   FILE SELECTION
-------------------------------------------------- */

Editora.upload.handleFileSelection =
  async function (event) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    await Editora.upload.processFile(file);
  };

/* --------------------------------------------------
   VALIDATE AND PROCESS FILE
-------------------------------------------------- */

Editora.upload.processFile =
  async function (file) {
    try {
      if (!file) {
        throw new Error(
          "No photo was selected."
        );
      }

      if (!file.type.startsWith("image/")) {
        throw new Error(
          "Please select a valid image file."
        );
      }

      const supportedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (
        file.type &&
        !supportedTypes.includes(file.type)
      ) {
        throw new Error(
          "Only JPG, PNG and WebP photos are supported."
        );
      }

      if (
        file.size >
        Editora.upload.maximumFileSize
      ) {
        throw new Error(
          "Please choose a photo smaller than 25 MB."
        );
      }

      Editora.setLoading?.(true);

      const source =
        await Editora.upload.readFileAsDataURL(
          file
        );

      const prepared =
        await Editora.upload.prepareImage(
          source,
          file.type
        );

      const fileName =
        Editora.upload.getFileBaseName(
          file.name
        );

      Editora.upload.currentPreviewSource =
        prepared.previewSource;

      await Editora.canvas.loadImageSource(
        prepared.imageSource,
        {
          fileName
        }
      );

      Editora.setExportSettings?.({
        fileName
      });

      Editora.ui?.showToast?.(
        "Photo uploaded successfully."
      );
    } catch (error) {
      console.error(
        "Editora upload error:",
        error
      );

      Editora.setLoading?.(false);

      Editora.ui?.showToast?.(
        error.message ||
        "The photo could not be opened."
      );
    }
  };

/* --------------------------------------------------
   READ FILE
-------------------------------------------------- */

Editora.upload.readFileAsDataURL =
  function (file) {
    return new Promise(function (
      resolve,
      reject
    ) {
      const reader = new FileReader();

      reader.onload = function () {
        resolve(reader.result);
      };

      reader.onerror = function () {
        reject(
          new Error(
            "The selected photo could not be read."
          )
        );
      };

      reader.readAsDataURL(file);
    });
  };

/* --------------------------------------------------
   PREPARE MOBILE-SAFE IMAGE
-------------------------------------------------- */

Editora.upload.prepareImage =
  function (
    source,
    originalMimeType = "image/jpeg"
  ) {
    return new Promise(function (
      resolve,
      reject
    ) {
      const image = new Image();

      image.onload = function () {
        try {
          const originalWidth =
            image.naturalWidth ||
            image.width;

          const originalHeight =
            image.naturalHeight ||
            image.height;

          if (
            !originalWidth ||
            !originalHeight
          ) {
            throw new Error(
              "The image has invalid dimensions."
            );
          }

          const isMobile =
            window.innerWidth <= 760;

          const maximumDimension =
            isMobile
              ? Editora.upload
                  .maximumMobileDimension
              : Editora.upload
                  .maximumDesktopDimension;

          const scale = Math.min(
            1,
            maximumDimension /
              Math.max(
                originalWidth,
                originalHeight
              )
          );

          const safeWidth = Math.max(
            1,
            Math.round(
              originalWidth * scale
            )
          );

          const safeHeight = Math.max(
            1,
            Math.round(
              originalHeight * scale
            )
          );

          const preparationCanvas =
            document.createElement(
              "canvas"
            );

          const preparationContext =
            preparationCanvas.getContext(
              "2d",
              {
                alpha: true
              }
            );

          if (!preparationContext) {
            throw new Error(
              "Image preparation is not supported."
            );
          }

          preparationCanvas.width =
            safeWidth;

          preparationCanvas.height =
            safeHeight;

          preparationContext
            .clearRect(
              0,
              0,
              safeWidth,
              safeHeight
            );

          preparationContext
            .imageSmoothingEnabled = true;

          preparationContext
            .imageSmoothingQuality = "high";

          preparationContext.drawImage(
            image,
            0,
            0,
            safeWidth,
            safeHeight
          );

          const preserveTransparency =
            originalMimeType ===
            "image/png";

          const outputMimeType =
            preserveTransparency
              ? "image/png"
              : "image/jpeg";

          const imageSource =
            preparationCanvas.toDataURL(
              outputMimeType,
              0.94
            );

          const previewSource =
            Editora.upload
              .createPreviewSource(
                preparationCanvas
              );

          resolve({
            imageSource,
            previewSource,
            width: safeWidth,
            height: safeHeight
          });
        } catch (error) {
          reject(error);
        }
      };

      image.onerror = function () {
        reject(
          new Error(
            "This image format could not be opened."
          )
        );
      };

      image.src = source;
    });
  };

/* --------------------------------------------------
   FILTER PREVIEW IMAGE
-------------------------------------------------- */

Editora.upload.createPreviewSource =
  function (sourceCanvas) {
    const previewCanvas =
      document.createElement("canvas");

    const previewContext =
      previewCanvas.getContext("2d");

    if (!previewContext) {
      return "";
    }

    const previewSize = 180;

    const sourceWidth =
      sourceCanvas.width;

    const sourceHeight =
      sourceCanvas.height;

    const sourceRatio =
      sourceWidth / sourceHeight;

    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    let cropX = 0;
    let cropY = 0;

    if (sourceRatio > 1) {
      cropWidth = sourceHeight;
      cropX =
        (sourceWidth - cropWidth) / 2;
    } else {
      cropHeight = sourceWidth;
      cropY =
        (sourceHeight - cropHeight) / 2;
    }

    previewCanvas.width =
      previewSize;

    previewCanvas.height =
      previewSize;

    previewContext
      .imageSmoothingEnabled = true;

    previewContext
      .imageSmoothingQuality = "high";

    previewContext.drawImage(
      sourceCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      previewSize,
      previewSize
    );

    return previewCanvas.toDataURL(
      "image/jpeg",
      0.82
    );
  };

/* --------------------------------------------------
   DRAG AND DROP
-------------------------------------------------- */

Editora.upload.bindDragAndDrop =
  function (container) {
    if (!container) {
      return;
    }

    const preventDefault =
      function (event) {
        event.preventDefault();
        event.stopPropagation();
      };

    [
      "dragenter",
      "dragover",
      "dragleave",
      "drop"
    ].forEach((eventName) => {
      container.addEventListener(
        eventName,
        preventDefault
      );
    });

    [
      "dragenter",
      "dragover"
    ].forEach((eventName) => {
      container.addEventListener(
        eventName,
        function () {
          container.classList.add(
            "is-dragging"
          );
        }
      );
    });

    [
      "dragleave",
      "drop"
    ].forEach((eventName) => {
      container.addEventListener(
        eventName,
        function () {
          container.classList.remove(
            "is-dragging"
          );
        }
      );
    });

    container.addEventListener(
      "drop",
      function (event) {
        const file =
          event.dataTransfer
            ?.files?.[0];

        if (file) {
          Editora.upload.processFile(
            file
          );
        }
      }
    );
  };

/* --------------------------------------------------
   PASTE IMAGE
-------------------------------------------------- */

Editora.upload.bindPasteEvent =
  function () {
    document.addEventListener(
      "paste",
      function (event) {
        const items =
          event.clipboardData?.items;

        if (!items) {
          return;
        }

        for (
          const item of items
        ) {
          if (
            item.type.startsWith(
              "image/"
            )
          ) {
            const file =
              item.getAsFile();

            if (file) {
              event.preventDefault();

              Editora.upload.processFile(
                file
              );
            }

            break;
          }
        }
      }
    );
  };

Editora.upload.pasteFromClipboard =
  async function () {
    try {
      if (
        !navigator.clipboard ||
        !navigator.clipboard.read
      ) {
        throw new Error(
          "Clipboard image access is not supported in this browser."
        );
      }

      const clipboardItems =
        await navigator.clipboard.read();

      for (
        const clipboardItem
        of clipboardItems
      ) {
        const imageType =
          clipboardItem.types.find(
            function (type) {
              return type.startsWith(
                "image/"
              );
            }
          );

        if (!imageType) {
          continue;
        }

        const blob =
          await clipboardItem.getType(
            imageType
          );

        const file = new File(
          [blob],
          "pasted-photo.png",
          {
            type: imageType
          }
        );

        await Editora.upload
          .processFile(file);

        return;
      }

      throw new Error(
        "No copied image was found."
      );
    } catch (error) {
      Editora.ui?.showToast?.(
        error.message ||
        "Could not paste the photo."
      );
    }
  };

/* --------------------------------------------------
   SAMPLE PHOTO
-------------------------------------------------- */

Editora.upload.loadSamplePhoto =
  async function () {
    try {
      Editora.setLoading?.(true);

      const sampleSource =
        Editora.upload
          .createSamplePhoto();

      Editora.upload.currentPreviewSource =
        sampleSource;

      await Editora.canvas
        .loadImageSource(
          sampleSource,
          {
            fileName:
              "editora-sample"
          }
        );

      Editora.setExportSettings?.({
        fileName: "editora-sample"
      });

      Editora.ui?.showToast?.(
        "Sample photo loaded."
      );
    } catch (error) {
      console.error(
        "Sample photo error:",
        error
      );

      Editora.setLoading?.(false);

      Editora.ui?.showToast?.(
        "Sample photo could not be loaded."
      );
    }
  };

Editora.upload.createSamplePhoto =
  function () {
    const sampleCanvas =
      document.createElement("canvas");

    const context =
      sampleCanvas.getContext("2d");

    sampleCanvas.width = 1200;
    sampleCanvas.height = 1500;

    const skyGradient =
      context.createLinearGradient(
        0,
        0,
        0,
        sampleCanvas.height
      );

    skyGradient.addColorStop(
      0,
      "#81c9ee"
    );

    skyGradient.addColorStop(
      0.52,
      "#f2d9aa"
    );

    skyGradient.addColorStop(
      1,
      "#d7896c"
    );

    context.fillStyle =
      skyGradient;

    context.fillRect(
      0,
      0,
      sampleCanvas.width,
      sampleCanvas.height
    );

    context.fillStyle =
      "#ffd56f";

    context.beginPath();

    context.arc(
      875,
      300,
      105,
      0,
      Math.PI * 2
    );

    context.fill();

    context.fillStyle =
      "#557b68";

    context.beginPath();

    context.moveTo(
      0,
      980
    );

    context.lineTo(
      390,
      480
    );

    context.lineTo(
      820,
      980
    );

    context.closePath();
    context.fill();

    context.fillStyle =
      "#365948";

    context.beginPath();

    context.moveTo(
      410,
      1020
    );

    context.lineTo(
      840,
      580
    );

    context.lineTo(
      1200,
      1030
    );

    context.closePath();
    context.fill();

    context.fillStyle =
      "#263f37";

    context.fillRect(
      0,
      960,
      1200,
      540
    );

    context.fillStyle =
      "rgba(255,255,255,0.94)";

    context.font =
      "700 68px Arial";

    context.fillText(
      "EDITORA",
      72,
      1315
    );

    context.font =
      "400 34px Arial";

    context.fillText(
      "Edit beautifully.",
      72,
      1380
    );

    return sampleCanvas.toDataURL(
      "image/jpeg",
      0.94
    );
  };

/* --------------------------------------------------
   FILE NAME
-------------------------------------------------- */

Editora.upload.getFileBaseName =
  function (fileName) {
    const withoutExtension =
      String(
        fileName ||
        "editora-photo"
      ).replace(
        /\.[^/.]+$/,
        ""
      );

    if (
      Editora.ui &&
      typeof Editora.ui
        .formatFileName ===
        "function"
    ) {
      return Editora.ui
        .formatFileName(
          withoutExtension
        );
    }

    return (
      withoutExtension ||
      "editora-photo"
    );
  };
