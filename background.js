let debugging = false;

chrome.runtime.onInstalled.addListener(() => {
  //add icon prop func
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
  if (message === "download") {
    if (sender.url.includes("brightspace.carleton.ca/d2l/le/content/")) {
      let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

      let currentTabId = tab?.id; //grabbing curr tab id

      if (!currentTabId) {
        console.error("No active tab found.");
        sendResponse({ status: "error", message: "No active tab found." });
        return true;
      }

      try {
        if (!debugging) {
          //if not already attached
          await chrome.debugger.attach({
            tabId: currentTabId,
            requiredVersion: "1.3"
          });
          debugging = true;
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
                        children[children.indexOf(contentView) + 1]; //cause id is allways different

                      if (nextElement) {
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
                      }
                    }
                  }
                });

                sendResponse({
                  status: "success",
                  message: "Download button injected successfuly."
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
              } catch (error) {
                console.error("Error detaching debugger:", error);
                sendResponse({
                  status: "error",
                  message: "Debugger detaching  failed."
                });
              }
            }
          }
        });
      } catch (error) {
        console.error("Error Attaching:", error);
        sendResponse({
          status: "error",
          message: "Debugger attaching failed."
        });
      }
    } else {
      sendResponse({
        status: "error",
        message: "Not on valid page."
      });
    }
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (tab.url.includes("brightspace.carleton.ca/d2l/le/content/")) {
      //maybe later do a sniff for for the transcript??
    }
  }
});
