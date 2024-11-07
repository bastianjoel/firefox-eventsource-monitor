function openTab(event, id) {
  const tabContent = document.getElementsByClassName(`tab-content`);
  for (i = 0; i < tabContent.length; i++) {
    tabContent[i].classList.remove(`active`);
  }

  const tabLinks = document.getElementsByClassName(`tab-links`);
  for (i = 0; i < tabLinks.length; i++) {
    tabLinks[i].classList.remove(`active`);
  }

  document.getElementById(id).classList.add(`active`);
  event.currentTarget.classList.add(`active`);
}

const tabLinks = document.getElementsByClassName(`tab-links`);
for (i = 0; i < tabLinks.length; i++) {
  const link = tabLinks[i];
  link.addEventListener(`click`, (e) => openTab(e, link.dataset[`tab`]))
}
