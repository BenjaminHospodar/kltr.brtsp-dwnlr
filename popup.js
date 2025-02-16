let debugging = false;
let currentTabId;

/*
chrome.scripting.executeScript({
  target: {
    tabId: await chrome.tabs.query({ active: true, currentWindow: true }).id
  },
  func: () => {
    const ltiLaunch = document.querySelector("d2l-lti-launch").shadowRoot;

    // Button element
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Sniff";
    downloadButton.setAttribute("type", "button");
    downloadButton.classList.add("d2l-button");

    ltiLaunch.appendChild(downloadButton);
  }
});
*/

document.getElementById("download").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    console.error("No active tab found.");
    return;
  }

  currentTabId = tab.id;

  try {
    // Attach the debugger to the tab
    if (!debugging) {
      await chrome.debugger.detach({ tabId: currentTabId });
      debugging = true;
    }
    document.getElementById("download").disabled = true; //rm

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
          const brokenAPI = url
            .split("/seg")[0]
            .replace("name", "fileName")
            .replace("scf/hls/", "");

          chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            args: [brokenAPI],
            func: (brokenAPI) => {
              const ltiLaunch =
                document.querySelector("d2l-lti-launch").shadowRoot;

              // Button element
              const downloadButton = document.createElement("button");
              downloadButton.textContent = "Download";
              downloadButton.setAttribute("type", "button");
              downloadButton.classList.add("d2l-button");

              // dl link
              const link = document.createElement("a");
              link.href = brokenAPI;
              link.textContent = "Download";
              link.setAttribute("download", "");
              downloadButton.appendChild(link);

              // Create icon
              const iconSpan = document.createElement("span");
              iconSpan.classList.add("d2l-icon-custom", "d2l_1_81_126");
              downloadButton.prepend(iconSpan);

              ltiLaunch.appendChild(downloadButton);
            }
          });

          try {
            // Detach the debugger
            await chrome.debugger.detach({ tabId: currentTabId });
            debugging = false;
            document.getElementById("download").disabled = false;
          } catch (error) {
            console.error("Error detaching debugger:", error);
          }
        }
      }
    });
  } catch (error) {
    console.error("Error listening:", error);
  }
});
