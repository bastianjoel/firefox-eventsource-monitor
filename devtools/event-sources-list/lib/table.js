function setTableData(table, data) {
  const tbody = document.getElementById(table).querySelector(`tbody`);

  tbody.innerHTML = ``;
  addTableData(table, data);
}

function addTableData(table, data) {
  const tbody = document.getElementById(table).querySelector(`tbody`);
  for (let row of data) {
    const tr = document.createElement(`tr`);
    for (let cell of row) {
      const td = document.createElement(`td`);
      td.textContent = cell;
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }
}
