function injectSniffButton() {
  const contentView = document.querySelector("#ContentView");

  //to fix case of showing sniff button in pdf viewer
  if (
    document.querySelector(
      ".d2l-documentToPdfViewer.d2l-documentToPdfViewer-inline"
    ) ||
    document.getElementById("Instructions") ||
    document.querySelector("d2l-fileviewer")
  ) {
    return;
  }

  if (contentView) {
    const children = Array.from(contentView.parentElement.children);
    const nextElement = children[children.indexOf(contentView) + 1];

    if (nextElement) {
      const existingButton = nextElement.querySelector(".sniffer-btn");
      if (existingButton) existingButton.remove();

      const sniffButton = document.createElement("button");
      sniffButton.setAttribute("type", "button");
      sniffButton.classList.add("d2l-button");

      const iconSpan = document.createElement("span");
      const iconImg = document.createElement("img");
      iconImg.src =
        "https://s.brightspace.com/lib/bsi/2025.2.233/images/tier1/assignments.svg";
      iconImg.alt = "Download Icon";

      iconSpan.appendChild(iconImg);
      sniffButton.appendChild(iconSpan);
      sniffButton.appendChild(document.createTextNode("Sniff"));
      document.body.appendChild(sniffButton);

      sniffButton.addEventListener("click", () => {
        console.log("Sending message to background script");

        //buggy with mult extention, swap to storage
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
