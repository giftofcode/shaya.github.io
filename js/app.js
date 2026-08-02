"use strict";

window.addEventListener("DOMContentLoaded", async function () {

  console.log("🚀 Editora starting...");

  try {

    // Initialize UI
    if (Editora.ui && Editora.ui.initialize) {
      Editora.ui.initialize();
    }

    // Initialize Canvas
    if (Editora.canvas && Editora.canvas.initialize) {
      Editora.canvas.initialize();
    }

    // Initialize Upload
    if (Editora.upload && Editora.upload.initialize) {
      Editora.upload.initialize();
    }

    // Initialize Export
    if (Editora.exporter && Editora.exporter.initialize) {
      Editora.exporter.initialize();
    }

    // Responsive canvas
    window.addEventListener("resize", function () {
      if (
        Editora.canvas &&
        Editora.canvas.fitToScreen
      ) {
        Editora.canvas.fitToScreen();
      }
    });

    console.log("✅ Editora Ready");

  } catch (error) {

    console.error(error);

    alert(
      "Editora failed to start.\nCheck browser console."
    );

  }

});
