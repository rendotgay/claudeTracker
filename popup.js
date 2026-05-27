document.addEventListener('DOMContentLoaded', () => {
    const showOffPeakCheck = document.getElementById('showOffPeak');
    const countdownMinutesInput = document.getElementById('countdownMinutes');

    chrome.storage.local.get({ showOffPeak: true, countdownMinutes: 30 }, (settings) => {
        showOffPeakCheck.checked = settings.showOffPeak;
        countdownMinutesInput.value = settings.countdownMinutes;
    });

    showOffPeakCheck.addEventListener('change', () => {
        chrome.storage.local.set({ showOffPeak: showOffPeakCheck.checked });
    });

    countdownMinutesInput.addEventListener('input', () => {
        const value = parseInt(countdownMinutesInput.value, 10) || 30;
        chrome.storage.local.set({ countdownMinutes: value });
    });
});
