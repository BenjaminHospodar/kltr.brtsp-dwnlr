let debugging = false;
let currentTabId;

document.getElementById("download").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    console.error("No active tab found.");
    return;
  }

  currentTabId = tab.id;

  try {
    // Attach the debugger to the tab
    await chrome.debugger.attach({ tabId: currentTabId }, "1.3");
    debugging = true;
    document.getElementById("download").disabled = true;

    // Enable network monitoring
    await chrome.debugger.sendCommand(
      { tabId: currentTabId },
      "Network.enable"
    );

    // Listen to network events
    chrome.debugger.onEvent.addListener(async (source, method, params) => {
      if (
        source.tabId === currentTabId &&
        method === "Network.responseReceived"
      ) {
        const { url } = await params.response;
        if (url.includes("cfvod")) {
          const cleanUrl = url
            .substring(0, url.indexOf("?"))
            .replace("scf/hls/", "");
          logMessage(`the juice: ${cleanUrl}`);

          chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            args: [cleanUrl],
            func: (cleanUrl) => {
              const ltiLaunch =
                document.querySelector("d2l-lti-launch").shadowRoot;

              //console.log(cleanUrl);

              // Create a download button
              const downloadButton = document.createElement("button");
              downloadButton.textContent = "Download";
              downloadButton.style.backgroundColor = "#0073e6";
              downloadButton.style.color = "#ffffff";
              downloadButton.style.border = "none";
              downloadButton.style.padding = "10px 20px";
              downloadButton.style.borderRadius = "5px";
              downloadButton.style.cursor = "pointer";

              downloadButton.params = cleanUrl;

              downloadButton.addEventListener("click", async (evt) => {
                // Fetch and create a Blob
                const response = await fetch(evt.currentTarget.params);
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
              });

              // Append the button to the shadow DOM
              ltiLaunch.appendChild(downloadButton);
            }
          });

          try {
            // Detach the debugger
            await chrome.debugger.detach({ tabId: currentTabId });
            debugging = false;
            document.getElementById("download").disabled = false;

            logMessage("Stopped listening to network packets.");
          } catch (error) {
            console.error("Error detaching debugger:", error);
          }
        }
      }
    });

    logMessage("Started listening to network packets...");
  } catch (error) {
    console.error("Error listening:", error);
  }
});

//can remove later, for debugging
function logMessage(message) {
  const output = document.getElementById("output");
  const entry = document.createElement("div");
  entry.textContent = message;
  output.appendChild(entry);
  output.scrollTop = output.scrollHeight;
}

function playVideo() {
  chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: () => {
      document.getElementById("kplayer").play();
      //document.getElementsByClassName('btn comp playPauseBtn display-high icon-play')[0].click();
    }
  });
}
