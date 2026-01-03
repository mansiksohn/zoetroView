// ZoetroView Content Script

// Constants
const BUTTON_ID = 'zoetroview-control-btn';

// Helper: Create the icon SVG
const getIconSvg = () => `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.4126 3.3496C7.46397 3.14414 7.64857 3 7.86036 3L12.5339 3C12.8341 3 13.0545 3.28218 12.9816 3.57348L8.7124 20.6504C8.66104 20.8559 8.47643 21 8.26464 21H3.59113C3.29086 21 3.07055 20.7178 3.14337 20.4265L7.4126 3.3496Z" fill="white"/>
<path d="M15.2876 3.3496C15.339 3.14414 15.5236 3 15.7354 3L20.4089 3C20.7091 3 20.9295 3.28218 20.8566 3.57348L16.5874 20.6504C16.536 20.8559 16.3514 21 16.1396 21H11.4661C11.1659 21 10.9455 20.7178 11.0184 20.4265L15.2876 3.3496Z" fill="white"/>
<path d="M21 20.5385C21 20.7934 20.7934 21 20.5385 21H19.3411C19.0409 21 18.8205 20.7178 18.8934 20.4265L20.0907 15.6372C20.2227 15.1092 21 15.2049 21 15.7491V20.5385Z" fill="white"/>
<path d="M3 3.46154C3 3.20664 3.20664 3 3.46154 3L4.65887 3C4.95914 3 5.17946 3.28218 5.10663 3.57348L3.9093 8.36282C3.77729 8.89084 3 8.79515 3 8.25088L3 3.46154Z" fill="white"/>
</svg>
`;

// 1. Inject Button into YouTube Player
function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const rightControls = document.querySelector('.ytp-right-controls');
    if (!rightControls) return;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'ytp-button';
    btn.setAttribute('title', 'Open ZoetroView');
    btn.innerHTML = getIconSvg();
    btn.style.verticalAlign = 'top';

    btn.onclick = () => {
        // Request Background Script to open Side Panel
        // Note: chrome.sidePanel.open requires user gesture which this click provides
        chrome.runtime.sendMessage({ action: 'OPEN_SIDE_PANEL' });
    };

    rightControls.prepend(btn);
}

// Observer to re-inject button if player re-renders
const observer = new MutationObserver(() => {
    injectButton();
});

observer.observe(document.body, { childList: true, subtree: true });

// 2. Video Control & Sync Logic
let videoElement = null;

function findVideo() {
    const v = document.querySelector('video');
    if (v && v !== videoElement) {
        videoElement = v;
        setupListeners(v);
    }
    return v;
}

function setupListeners(video) {
    // Broadcast time updates to Side Panel
    video.ontimeupdate = () => {
        chrome.runtime.sendMessage({
            action: 'VIDEO_TIME_UPDATE',
            currentTime: video.currentTime,
            duration: video.duration
        }).catch(() => { }); // Ignore errors if panel is closed
    };

    video.onplay = () => chrome.runtime.sendMessage({ action: 'VIDEO_STATE', state: 'playing' }).catch(() => { });
    video.onpause = () => chrome.runtime.sendMessage({ action: 'VIDEO_STATE', state: 'paused' }).catch(() => { });
}

// 3. Listen for Commands from Side Panel (RemotePlayer)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const video = findVideo();
    if (!video) return;

    switch (message.action) {
        case 'SEEK_TO':
            video.currentTime = message.time;
            if (message.allowSeekAhead) {
                // YouTube specific: might need to ensure buffering
            }
            sendResponse({ status: 'ok', currentTime: video.currentTime });
            break;

        case 'GET_TIME':
            sendResponse({ currentTime: video.currentTime, duration: video.duration });
            break;

        case 'GET_DURATION':
            sendResponse({ duration: video.duration });
            break;
    }
});

// Initial Setup
setTimeout(injectButton, 1000);
setInterval(findVideo, 2000); // Polling fallback
