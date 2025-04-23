const subject = localStorage.getItem("subject");
const username = localStorage.getItem("username");
const messagesDiv = document.getElementById("messages");
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

const synth = window.speechSynthesis;
const recognition = new (window.SpeechRecognition ||
  window.webkitSpeechRecognition)();
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.continuous = true;

let currentQuestion = "";
let timeoutId;
let listening = false;
let introCaptured = false;

function addMessage(text) {
  const msg = document.createElement("div");
  msg.textContent = text;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();

  const selectedVoice = voices.find(
    (voice) => voice.name === "Google UK English Female"
  ); // Example, change as per your system

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  speechSynthesis.cancel();
  setTimeout(() => {
    speechSynthesis.speak(utterance);
  }, 100);
}

async function askQuestion() {
  const prompt = `Act as an Interviewer. Ask one short interview question in ${subject}.`;
  const response = await fetchGemini(prompt);
  currentQuestion = response;
  addMessage("HR: " + currentQuestion);
  speak(currentQuestion);
}

async function evaluateAnswer(answer) {
  const prompt = `Evaluate this answer on correctness, grammar, and pronunciation. Also suggest improvement.
  Question: ${currentQuestion}
  Answer: ${answer}`;
  const feedback = await fetchGemini(prompt);
  addMessage("HR: " + feedback);
  setTimeout(askQuestion, 2000);
}

recognition.onresult = function (event) {
  console.log("Speech recognition result received:", event);
  clearTimeout(timeoutId);
  const transcript = Array.from(event.results)
    .map((result) => result[0].transcript)
    .join(" ");

  if (event.results[event.results.length - 1].isFinal) {
    console.log("Final Transcript:", transcript);
    addMessage("You: " + transcript);

    if (!introCaptured) {
      introCaptured = true;
      handleIntroduction(transcript);
    } else {
      evaluateAnswer(transcript);
    }
  } else {
    timeoutId = setTimeout(() => recognition.stop(), 3500);
  }
};

recognition.onend = function () {
  console.log("Speech recognition ended.");
  if (listening) recognition.start();
};

function startListeningLoop() {
  if (!listening) {
    listening = true;
    setTimeout(() => {
      recognition.start();
      console.log("Speech recognition started");
    }, 1000);
  }
}

recognition.onerror = function (event) {
  console.error("Speech recognition error:", event.error);
};

recognition.onaudiostart = () => {
  console.log("Audio capturing started");
};
recognition.onsoundstart = () => console.log("Sound detected");

async function handleIntroduction(introText) {
  const prompt = `This is a candidate's self-introduction: "${introText}". Give short feedback like an HR on grammar, fluency, and professionalism.`;
  const response = await fetchGemini(prompt);
  addMessage("HR: " + response);
  speak("Thanks for the introduction. Let's begin with questions now.");
  setTimeout(() => {
    askQuestion();
  }, 2000);
}

async function fetchGemini(prompt) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBFjS-NulXziPhytCbVW9jOmFXHeeREOF4",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();
  console.log("Gemini Response:", data);
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No response. Gemini fetching failed"
  );
}

function endInterview() {
  recognition.stop();
  listening = false;
  addMessage("Interview ended. Thank you!");
}

window.onload = () => {
  addMessage(`HR: Hello ${username}, welcome to the virtual interview!`);
  speak(
    `Hello ${username}, welcome to the virtual interview. Can you please introduce yourself?`
  );
  startListeningLoop();
};
