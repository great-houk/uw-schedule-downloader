chrome.runtime.onMessage.addListener(
   function (url, sender, _sendResponse) {
      chrome.downloads.download({ url: url, filename: "courseSchedule.ics", conflictAction: "uniquify" });
   }
);