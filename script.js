function startInterview() {
  const name = document.getElementById("name-input").value.trim();
  const subject = document.getElementById("subject-select").value;

  if (!name || !subject) {
    alert("Please enter your name and select a subject.");
    return;
  }

  localStorage.setItem("username", name);
  localStorage.setItem("subject", subject);
  window.location.href = "interview.html";
}
