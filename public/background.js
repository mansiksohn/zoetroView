// Background Service Worker

// Toggle Side Panel when extension icon is clicked
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Listen for messages from Content Script or Side Panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // If request to open side panel (from Content Script button)
    if (message.action === 'OPEN_SIDE_PANEL') {
        // Note: open() requires user gesture or specific context. 
        // If called from content script, might need coordination.
        // However, sidePanel.open is only available in Chrome 114+ and requires windowId.
        // Ideally, the user clicks the extension icon.
        // But if we inject a button in YouTube, we want it to open the panel.

        // chrome.sidePanel.open({ tabId: sender.tab.id }); 
        // This API requires a user gesture in the extension context, which content script click provides?
        // Let's try it.
        if (sender.tab && sender.tab.id) {
            chrome.sidePanel.open({ tabId: sender.tab.id, windowId: sender.tab.windowId })
                .catch(err => console.error("Failed to open panel:", err));
        }
    }
});
