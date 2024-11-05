const leftPane = document.querySelector(".left");
const rightPane = document.querySelector(".right");
const gutter = document.querySelector(".gutter");

function resizer(e) {
  window.addEventListener('mousemove', mousemove);
  window.addEventListener('mouseup', mouseup);
  
  let prevX = e.x;
  const leftPanel = leftPane.getBoundingClientRect();
  
  
  function mousemove(e) {
    let newX = prevX - e.x;
    leftPane.style.width = leftPanel.width - newX + "px";
  }
  
  function mouseup() {
    window.removeEventListener('mousemove', mousemove);
    window.removeEventListener('mouseup', mouseup);

    window.dispatchEvent(new Event(`pane-resize`));
  }
}

gutter.addEventListener('mousedown', resizer);
