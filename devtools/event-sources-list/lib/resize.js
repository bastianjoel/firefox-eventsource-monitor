(function () {
  const wrapper = document.querySelector(".pane-container");
  const leftPane = document.querySelector(".left");
  const rightPane = document.querySelector(".right");
  const gutter = document.querySelector(".gutter");

  function resizer(e) {
    e.preventDefault();
    window.addEventListener('mousemove', mousemove);
    window.addEventListener('mouseup', mouseup);
    
    let prevX = e.x;
    const leftPanel = leftPane.getBoundingClientRect();
    const wrapperSize = wrapper.getBoundingClientRect();
    
    
    function mousemove(e) {
      e.preventDefault();
      const newX = prevX - e.x;
      const newWidth = leftPanel.width - newX;
      leftPane.style.width = newWidth + "px";
      rightPane.style.width = wrapperSize.width - newWidth + "px";
    }
    
    function mouseup() {
      window.removeEventListener('mousemove', mousemove);
      window.removeEventListener('mouseup', mouseup);

      window.dispatchEvent(new Event(`pane-resize`));
    }
  }

  gutter.addEventListener('mousedown', resizer);
})();
