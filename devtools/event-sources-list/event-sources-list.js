var dataTable = new Tabulator("#data-table", {
  height: `${document.body.offsetHeight - 2}px`,
  layout:"fitColumns",
  columns: [
    { title: `Id`, field: `id`, widthGrow: 3 },
    { title: `Data`, field: `data`, widthGrow: 3 },
    { title: `Event`, field: `event`, widthGrow: 1 },
    { title: `Size`, field: `size`, width: 75 },
    { title: `Time`, field: `time`, width: 100 },
    { title: `Retry`, field: `retry`, width: 75 },
  ]
});

var requestTable = new Tabulator("#request-table", {
  selectableRows: 1,
  layout:"fitColumns",
  height: `${document.body.offsetHeight - 2}px`,
  columns: [
    { title: `Status`, field: `status` },
    { title: `Method`, field: `method` },
    { title: `Host`, field: `host` },
    { title: `File`, field: `file` },
    { title: `Transmitted`, field: `transmitted` },
  ]
});

requestTable.on("rowSelected", function(row) {
  setActive(row.getData().id)
});

requestTable.on("rowDeselected", function() {
  activeRequest = null;
  document.getElementById(`detail`).style.display = `none`;
});

function updateHeight() {
  const docHeight = document.body.offsetHeight - 2;
  if (requestTable) {
    requestTable.setHeight(docHeight);
  }

  if (dataTable) {
    dataTable.setHeight(docHeight);
  }
}
window.addEventListener('resize', updateHeight);

const requests = new Map();
let activeRequest = null;

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

function addRequestToList(s) {
  const url = new URL(s.url);
  requestTable.addData([{
    id: s.requestId,
    status: s.statusCode,
    method: s.method,
    host: url.host,
    file: url.pathname,
    transmitted: `0 B`
  }], true)

  requests.set(s.requestId, {
    data: s,
    transmitted: 0,
    events: []
  });
}

function addMessageToList(...messages) {
  const data = [];
  for (const m of messages) {
    data.push({
      id: m.eventData.id || ``,
      data: m.eventData.data || ``,
      event: m.eventData.event || ``,
      size: formatBytes(m.size),
      time: m.time,
      retry: ``,
    })
  }

  dataTable.addData(data, true)
}

function formatBytes(bytes) {
    if (!+bytes) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function setActive(reqId) {
  activeRequest = reqId;
  const request = requests.get(activeRequest);

  document.getElementById(`detail`).style.display = `block`;
  dataTable.clearData();
  const events = [];
  for (let i = request.events.length - 1; i >= 0; i--) {
    events.push(request.events[i]);
  }
  addMessageToList(...events);
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
      requestTable.updateData([{ id: m.data.requestId, transmitted: formatBytes(request.transmitted) }])
    }

    const newEvents = [];
    for (let ev of m.data.events) {
      const eventData = parseEvent(ev);
      newEvents.push({
        time: (new Date()).toLocaleTimeString(),
        eventData,
        size: ev.length
      });
    }
    request.events.push(...newEvents);
    if (activeRequest === m.data.requestId) {
      addMessageToList(...newEvents.reverse());
    }
  } else if (m.type === `close`) {
    const status = requests.get(m.data.requestId).data.statusCode;
    requestTable.updateData([{ id: m.data.requestId, status: `${status} (closed)` }])
  }
});
