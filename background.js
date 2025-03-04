let debugging = false;

// Set up Page Actions
chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlMatches: "brightspace.carleton.ca/d2l/le/content/*" }
          })
        ],
        actions: [new chrome.declarativeContent.ShowAction()]
      }
    ]);
  });
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("Message received from content script:", message);

  if (message === "download") {
    if (!sender.url.includes("brightspace.carleton.ca/d2l/le/content/")) {
      console.warn("Message received from an invalid page.");
      sendResponse({ status: "error", message: "Not on a valid page." });
      return true;
    }

    try {
      let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      let currentTabId = tab?.id;

      if (!currentTabId) {
        console.error("No active tab found.");
        sendResponse({ status: "error", message: "No active tab found." });
        return true;
      }

      if (!debugging) {
        await chrome.debugger.attach({
          tabId: currentTabId,
          requiredVersion: "1.3"
        });
        debugging = true;
        console.log("Debugger attached to tab:", currentTabId);
      }

      await chrome.debugger.sendCommand(
        { tabId: currentTabId },
        "Network.enable"
      );

      chrome.debugger.onEvent.addListener(async (source, method, params) => {
        if (
          source.tabId === currentTabId &&
          method === "Network.responseReceived"
        ) {
          const { url } = params.response;

          if (url.includes("cfvod")) {
            console.log("Detected Video URL:", url);

            const dlAPI = url
              .split("/seg")[0]
              .replace("name", "fileName")
              .replace("scf/hls/", "");

            try {
              await chrome.scripting.executeScript({
                target: { tabId: currentTabId },
                args: [dlAPI],
                func: (dlAPI) => {
                  const contentView = document.querySelector("#ContentView");

                  if (contentView) {
                    const children = Array.from(
                      contentView.parentElement.children
                    );
                    const nextElement =
                      children[children.indexOf(contentView) + 1];

                    if (nextElement) {
                      // Remove existing
                      const existingButton =
                        nextElement.querySelector(".dl-btn");
                      if (existingButton) existingButton.remove();

                      const downloadButton = document.createElement("a");
                      downloadButton.textContent = "Download";
                      downloadButton.classList.add("d2l-button", "dl-btn");
                      downloadButton.href = dlAPI;
                      downloadButton.setAttribute("download", "lecture.mp4");
                      downloadButton.style.display = "block";

                      nextElement.appendChild(downloadButton);
                      console.log("Download button injected.");
                    }
                  }
                }
              });

              sendResponse({
                status: "success",
                message: "Download button injected successfully."
              });
            } catch (error) {
              console.error("Error injecting download button:", error);
              sendResponse({
                status: "error",
                message: "Failed to inject button."
              });
            }

            try {
              await chrome.debugger.detach({ tabId: currentTabId });
              debugging = false;
              console.log("Debugger detached successfully.");
            } catch (error) {
              console.error("Error detaching debugger:", error);
              sendResponse({
                status: "error",
                message: "Debugger detachment failed."
              });
            }
          }
        }
      });

      return true; // Keep message port open for async response
    } catch (error) {
      console.error("Debugger Attach Error:", error);
      sendResponse({ status: "error", message: "Debugger attaching failed." });
      return true;
    }
  }
  return true;
});
