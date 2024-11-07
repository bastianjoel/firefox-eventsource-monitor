function formatBytes(bytes) {
    if (!+bytes) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function parseEventSourceMessage(ev) {
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

