function injectSniffButton() {
  const contentView = document.querySelector("#ContentView");

  console.log("Content view loaded.");

  if (contentView) {
    console.log("Content view valid.");

    const children = Array.from(contentView.parentElement.children);
    const nextElement = children[children.indexOf(contentView) + 1];

    if (nextElement) {
      console.log("next element valid.");

      const existingButton = nextElement.querySelector(".sniffer-btn");
      if (existingButton) existingButton.remove();

      const sniffButton = document.createElement("button");
      sniffButton.textContent = "Sniff";
      sniffButton.setAttribute("type", "button");
      sniffButton.classList.add("d2l-button", "sniffer-btn");

      sniffButton.addEventListener("click", () => {
        console.log("Sending message to background script");

        chrome.runtime.sendMessage({ action: "download" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Message sending failed:", chrome.runtime.lastError);
            return;
          }

          if (response && response.status === "success") {
            console.log("Background script response:", response);
          } else {
            console.warn("No response received from background script.");
          }
        });
      });

      nextElement.prepend(sniffButton);
      console.log("Sniff button injected.");
    }
  }
}

injectSniffButton();
