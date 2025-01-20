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

    //TODO have a reload that will load everything before playing
    //await chrome.tabs.reload(currentTabId);
    
    
    //chrome.tabs.executeScript(currentTabId, {file: "backround.js"});
    

    // Attach the debugger to the tab
    await chrome.debugger.attach({ tabId: currentTabId }, "1.3");
    debugging = true;
    document.getElementById("download").disabled = true;

    // Enable network monitoring
    await chrome.debugger.sendCommand({ tabId: currentTabId }, "Network.enable");

    // Listen to network events
    chrome.debugger.onEvent.addListener(async (source, method, params) => {
      if ((source.tabId === currentTabId && method === "Network.responseReceived")) {
        const {url} = await params.response;
        if(url.includes("cfvod")){
          const cleanUrl = url.substring(0, url.indexOf('?')).replace('scf/hls/', '');
          logMessage(`the juice: ${cleanUrl}`);
  
          try {
            // Fetch and create a Blob
            const response = await fetch(cleanUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            // Download the file
            chrome.downloads.download(
              {
                url: blobUrl,
                filename: "downloaded_video.mp4",
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
  document.getElementById("kplayer").play();
}

function pauseVideo() {
  document.getElementsByClassName('btn comp playPauseBtn display-high icon-pause')[0].click();
}