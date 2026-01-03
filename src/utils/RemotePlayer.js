/* global chrome */

// This class mimics the `react-youtube` player object API
// but bridges calls to the Content Script via chrome.runtime
export default class RemotePlayer {
    constructor() {
        this.duration = 0;
        this.currentTime = 0;

        // Listen for updates from Content Script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message) => {
                if (message.action === 'VIDEO_TIME_UPDATE') {
                    this.currentTime = message.currentTime;
                    this.duration = message.duration;
                }
            });
        }
    }

    getCurrentTime() {
        // We return the locally cached time from the last update message
        // Or we could async fetch it, but that breaks sync hooks expecting sync returns.
        // For smoother scroll, we rely on the frequent 'VIDEO_TIME_UPDATE' messages.
        return this.currentTime;
    }

    getDuration() {
        return this.duration;
    }

    seekTo(seconds, allowSeekAhead) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.tabs) {
            // We need to send this to the ACTIVE tab
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'SEEK_TO',
                        time: seconds,
                        allowSeekAhead
                    });
                }
            });
        }
    }
}
