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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (tab.url.includes("brightspace.carleton.ca/d2l/le/content/")) {
      //gotta be doing somthing wrong here, verify that above code is doing what i think it is
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          const contentView = document.querySelector("#ContentView");

          if (contentView) {
            const children = Array.from(contentView.parentElement.children);
            const nextElement = children[children.indexOf(contentView) + 1]; //cause id is allways different

            if (nextElement) {
              const existingButton = nextElement.querySelector(".sniffer-btn");
              if (existingButton) existingButton.remove();

              const sniffButton = document.createElement("button");
              sniffButton.textContent = "Sniff";
              sniffButton.setAttribute("type", "button");
              sniffButton.classList.add("d2l-button", "sniffer-btn");

              sniffButton.addEventListener("click", async () => {
                sniffButton.style.display = "none"; // Hide button

                //context is page DOM
                //need to add message passing to another backround script, or not??
                //could slap right under here, or make clearner in another file???
                //maybe look for better way to do it, debugger only avalible in background
                //everything here should be semi-solid, but need to test

                setTimeout(() => {
                  let DownloadBtn = nextElement.querySelector(".dl-btn");
                  if (!DownloadBtn) sniffButton.style.display = "block";
                  //work out cases, rn within 20 if no download button, show sniff button again
                  //will need to disable network listener again
                  //basicly reset, need to check vars
                }, 20000); //20 sec
              });

              nextElement.prepend(sniffButton);
            }
          }
        }
      });
    }
  }
});
