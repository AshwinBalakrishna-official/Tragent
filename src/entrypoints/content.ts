import { loadAnswerBank, loadProfile, loadResume } from '../profile/answerBank';
import { fillPage } from '../fill/run';

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  main() {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type !== 'fill') return;
      Promise.all([loadProfile(), loadAnswerBank(), loadResume()]).then(([p, b, r]) =>
        sendResponse(fillPage(document, location.href, p, b, r)),
      );
      return true;
    });
  },
});
