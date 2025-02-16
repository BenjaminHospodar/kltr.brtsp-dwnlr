//TODO
//1. maybe scrap pathprefix stuff, simplify
//2. execute script for .js
//add cases to only run on video pages

//only runs on specified pages
chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
              hostEquals: "brightspace.carleton.ca",
              pathPrefix: "/d2l/le/content/"
            }
          })
        ],
        actions: [new chrome.declarativeContent.ShowAction()]
      }
    ]);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const url = new URL(tab.url);

    if (
      url.hostname === "brightspace.carleton.ca" &&
      url.pathname.startsWith("/d2l/le/content/")
    ) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const contentView = document.querySelector("#ContentView");

          if (contentView) {
            const parent = contentView.parentElement;
            const children = Array.from(parent.children);
            const contentViewIndex = children.indexOf(contentView);

            // Select the second element after #ContentView
            const secondElementAfter = children[contentViewIndex + 1];

            if (secondElementAfter) {
              // Remove existing Sniff button if any
              const existingButton =
                secondElementAfter.querySelector(".sniff-button");
              if (existingButton) existingButton.remove();

              // Create the button
              const downloadButton = document.createElement("button");
              downloadButton.textContent = "Sniff";
              downloadButton.setAttribute("type", "button");
              downloadButton.classList.add("d2l-button", "sniff-button");

              // Append the button to the second element after #ContentView
              secondElementAfter.prepend(downloadButton);
            }
          }
        }
      });
    }
  }
});
/*
chrome.scripting.executeScript({
  target: { tabId: tabId },
  files: ["content.js"]  // Your content script here
});
*/
