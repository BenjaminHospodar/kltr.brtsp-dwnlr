chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "downloadFile") {
    const { url, filename } = message;

    // Download the file
    try {
      // Fetch and create a Blob
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Download the file
      chrome.downloads.download(
        {
          url: blobUrl,
          filename: filename
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            logMessage(`Error: ${chrome.runtime.lastError.message}`);
          } else {
            logMessage(`Download initiated with ID: ${downloadId}`);
          }
        }
      );
    } catch (error) {
      console.error("Error downloading file:", error);
    }

    // Respond back to content script
    sendResponse({ status: "Download started" });
  }
});
