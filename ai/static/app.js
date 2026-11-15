document.querySelectorAll("form[action='/analyze']").forEach((form) => {
  form.addEventListener("submit", () => {
    const button = form.querySelector("button[type='submit']");
    if (button && form.querySelector("input[type='file']").files.length) {
      button.disabled = true;
      button.textContent = "Analysing document…";
    }
  });
});
