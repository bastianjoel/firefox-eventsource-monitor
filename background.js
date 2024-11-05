const tabPortMap = new Map();

function handleHeadersReceived(resp) {
  if (tabPortMap.has(resp.tabId)) {
    const contentType = resp.responseHeaders.find(h => h.name.toLowerCase() === `content-type`);
    if (contentType?.value?.startsWith(`text/event-stream`)) {
      const port = tabPortMap.get(resp.tabId)

      port.postMessage({
        type: `open`,
        data: resp
      });

      const filter = browser.webRequest.filterResponseData(resp.requestId);
      const decoder = new TextDecoder("utf-8");
      const encoder = new TextEncoder();

      let remainder = ``;
      filter.ondata = (event) => {
        let str = decoder.decode(event.data, { stream: true });
        remainder += str;
        const parts = remainder.split(`\n\n`);
        remainder = parts.splice(parts.length - 1)[0];

        port.postMessage({
          type: `data`,
          data: {
            requestId: resp.requestId,
            events: parts
          }
        });
        filter.write(encoder.encode(str));
      };

      filter.onstop = () => {
        port.postMessage({
          type: `close`,
          data: {
            requestId: resp.requestId
          }
        });
        filter.close();
      };

      filter.onerror = (event) => {
        console.log(event);
      }
    }
  }
}

browser.webRequest.onHeadersReceived.addListener(handleHeadersReceived, {
  urls: ["<all_urls>"],
}, ["responseHeaders", "blocking"]);


function connected(p) {
  p.onMessage.addListener((m) => {
    if (m?.type === `start`) {
      tabPortMap.set(m.data.tabId, p);
    }
  });
}

browser.runtime.onConnect.addListener(connected);
