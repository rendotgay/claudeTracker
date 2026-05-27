let userSettings = { showOffPeak: true, countdownMinutes: 30 };

function updateCachedSettings() {
    chrome.storage.local.get({ showOffPeak: true, countdownMinutes: 30 }, (settings) => {
        userSettings = settings;
    });
}

updateCachedSettings();
chrome.storage.onChanged.addListener(() => {
    updateCachedSettings();
});

function getPeakStatus() {
    try {
        const options = { timeZone: 'America/Los_Angeles', hour12: false };
        const ptDate = new Date(new Date().toLocaleString('en-US', options));

        const day = ptDate.getDay();
        const hours = ptDate.getHours();
        const minutes = ptDate.getMinutes();
        const seconds = ptDate.getSeconds();

        if (day === 0 || day === 6) {
            return { isPeak: false, isWarning: false, isOffPeak: true, text: "OFF-PEAK" };
        }

        const currentMinutesIdx = (hours * 60) + minutes;
        const peakStartIdx = 5 * 60;      // 05:00 AM
        const peakEndIdx = 11 * 60;       // 11:00 AM

        // Dynamically compute layout limit via saved configuration state
        const warningStartIdx = peakStartIdx - userSettings.countdownMinutes;

        if (currentMinutesIdx >= peakStartIdx && currentMinutesIdx < peakEndIdx) {
            return { isPeak: true, isWarning: false, isOffPeak: false, text: "PEAK TIME" };
        }

        if (currentMinutesIdx >= warningStartIdx && currentMinutesIdx < peakStartIdx) {
            const minutesLeft = peakStartIdx - currentMinutesIdx - 1;
            const secondsLeft = 60 - seconds;
            const padSec = secondsLeft < 10 ? '0' + secondsLeft : secondsLeft;
            return { isPeak: false, isWarning: true, isOffPeak: false, text: `PEAK IN ${minutesLeft}:${padSec}` };
        }

        return { isPeak: false, isWarning: false, isOffPeak: true, text: "OFF-PEAK" };
    } catch (e) {
        return { isPeak: false, isWarning: false, isOffPeak: false, text: "TIME ERROR" };
    }
}

function injectPeakIndicator() {
    const chatInput = document.getElementById('chat-input-file-upload-bottom');
    if (!chatInput) return;

    const fieldset = chatInput.closest('fieldset.flex.w-full.min-w-0.flex-col');
    if (!fieldset) return;

    const composerContainer = fieldset.parentElement;
    if (!composerContainer) return;

    let indicator = document.getElementById('claude-peak-indicator');

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'claude-peak-indicator';
        indicator.style.cssText = `
          position: absolute;
          top: 0;
          left: 51%;
          transform: translateX(-50%);
          z-index: 10;
          padding: 4px 10px;
          font-weight: bold;
          font-size: 11px;
          letter-spacing: 0.5px;
          border-radius: 9999px;
          font-family: "Anthropic Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          transition: all 0.2s ease;
          white-space: nowrap;
          opacity: 0.5;
        `;

        if (window.getComputedStyle(composerContainer).position === 'static') {
            composerContainer.style.position = 'relative';
        }

        composerContainer.appendChild(indicator);
    }

    const status = getPeakStatus();

    if (indicator.innerText !== status.text) {
        indicator.innerText = status.text;
    }

    // Process UI visibility configurations
    if (status.isPeak) {
        indicator.style.display = 'block';
        indicator.style.color = '#ff6961';
    } else if (status.isWarning) {
        indicator.style.display = 'block';
        indicator.style.color = '#f8d66d';
    } else if (status.isOffPeak && userSettings.showOffPeak) {
        indicator.style.display = 'block';
        indicator.style.color = '#8cd47e';
    } else {
        indicator.style.display = 'none';
    }
}

setInterval(injectPeakIndicator, 1000);
