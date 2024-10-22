const requests = new Map();
let activeRequest = null;

function logURL(requestDetails) {
  if (requestDetails.tabId === devtools.inspectedWindow.tabId) {
    console.log(requestDetails);
    console.log(`Loading: ${requestDetails.url}`);
    const el = document.createElement(`div`);
    el.innerText = `${requestDetails.url} - ${JSON.stringify(requestDetails)}`;
    document.getElementById(`list`).appendChild(el);
  }
}

const port = browser.runtime.connect({ name: `listen-event-sources` });
port.postMessage({
  type: `start`,
  data: {
    tabId: browser.devtools.inspectedWindow.tabId,
  }
});

document.addEventListener(`unload`, () => {
  port.postMessage({
    type: `stop`,
    data: {
      tabId: browser.devtools.inspectedWindow.tabId,
    }
  });
});

function getTdElement(content, className = null) {
  const div = document.createElement(`div`);
  div.innerText = content;

  const td = document.createElement(`td`);
  if (className) {
    td.classList.add(className);
  }
  td.appendChild(div);
  return td;
}

function addRequestToList(s) {
  const url = new URL(s.url);
  const row = document.createElement(`tr`);
  row.appendChild(getTdElement(s.statusCode, `status`));
  row.appendChild(getTdElement(s.method));
  row.appendChild(getTdElement(url.host));
  row.appendChild(getTdElement(url.pathname));
  row.appendChild(getTdElement(`0 B`, `transmitted`));
  row.addEventListener(`click`, () => setActive(s.requestId));
  document.getElementById(`request-list`).prepend(row);

  requests.set(s.requestId, {
    element: row,
    transmitted: 0,
    events: []
  });
}

function addMessageToList(m) {
  const row = document.createElement(`tr`);
  console.log(m);
  row.appendChild(getTdElement(m.eventData.id || ``));
  row.appendChild(getTdElement(m.eventData.data || ``));
  row.appendChild(getTdElement(m.eventData.event || ``));
  row.appendChild(getTdElement(formatBytes(m.size)));
  row.appendChild(getTdElement(m.time));
  row.appendChild(getTdElement(``));
  document.getElementById(`data-list`).prepend(row);
}

function formatBytes(bytes) {
    if (!+bytes) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function setActive(reqId) {
  if (activeRequest) {
    requests.get(activeRequest).element.classList.remove(`active`);
  }
  activeRequest = reqId;
  const request = requests.get(activeRequest);
  request.element.classList.add(`active`);

  document.getElementById(`detail`).style.display = `block`;
  const listEl = document.getElementById(`data-list`);
  listEl.innerHTML = ``;
  for (let ev of request.events.slice(-1000).reverse()) {
    addMessageToList(ev);
  }
}

function parseEvent(ev) {
  const data = {};
  const lines = ev.split(`\n`);
  for (const line of lines) {
    parts = line.split(/:(.*)/s);
    const key = parts[0].trim();
    if (data[key]) {
      data[key] += `\n`;
    } else {
      data[key] = ``;
    }
    data[key] += parts[1]?.trim();
  }
  
  return data;
}

port.onMessage.addListener((m) => {
  if (m.type === `open`) {
    addRequestToList(m.data);
  } else if (m.type === `data`) {
    const request = requests.get(m.data.requestId);
    if (request) {
      for (let ev of m.data.events) {
        request.transmitted += ev.length + 4;
      }
      request.element.querySelector(`.transmitted`).innerText = formatBytes(request.transmitted);
    }

    if (activeRequest === m.data.requestId) {
      for (let ev of m.data.events) {
        const eventData = parseEvent(ev);
        request.events.push({
          time: (new Date()).toLocaleTimeString(),
          eventData,
          size: ev.length
        });
        addMessageToList({
          time: (new Date()).toLocaleTimeString(),
          eventData,
          size: ev.length
        });
      }
    }
  } else if (m.type === `close`) {
    const statusEl = requests.get(m.data.requestId)?.element.querySelector(`.status`);
    statusEl.innerText = `${statusEl.innerText} (closed)`
  }
  // console.log(m);
});
