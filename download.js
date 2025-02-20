//Need to overhaul code
//most code here needs to run in contect of backround
// idk how it was working when called by popup, look into

let debugging = false;

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    console.error("No active tab found.");
    return;
  }

  let currentTabId = tab.id;

  try {
    if (!debugging) {
      await chrome.debugger.attach({
        tabId: currentTabId,
        requiredVersion: "1.3"
      });
      debugging = true;
    }

    //context 
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
          const BrokenAPI = url
            .split("/seg")[0]
            .replace("name", "fileName")
            .replace("scf/hls/", "");

          try {
            await chrome.scripting.executeScript({
              target: { tabId: currentTabId },
              args: [BrokenAPI],
              func: (BrokenAPI) => {
                const contentView = document.querySelector("#ContentView");

                if (contentView) {
                  const children = Array.from(
                    contentView.parentElement.children
                  );
                  const nextElement =
                    children[children.indexOf(contentView) + 1]; //cause id is allways different

                  if (nextElement) {
                    const existingButton = nextElement.querySelector(".dl-btn");
                    if (existingButton) existingButton.remove();

                    const downloadButton = document.createElement("button");
                    downloadButton.textContent = "Download";
                    downloadButton.classList.add("d2l-button", "dl-btn");
                    downloadButton.href = BrokenAPI;

                    nextElement.appendChild(downloadButton);
                  }
                }
              }
            });
          } catch (error) {
            console.error("Error injecting download button:", error);
          }

          try {
            await chrome.debugger.detach({ tabId: currentTabId });
            debugging = false;
          } catch (error) {
            console.error("Error detaching debugger:", error);
          }
        }
      }
    });
  } catch (error) {
    console.error("Error Attaching:", error);
  }
})();
