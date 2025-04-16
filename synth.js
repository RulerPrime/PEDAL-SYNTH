const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioContext.createGain();
masterGain.connect(audioContext.destination);

const waveformSelect = document.getElementById("waveformSelect");
const activeVoices = {};

const noteMap = {
  a: 60,
  w: 61,
  s: 62,
  e: 63,
  d: 64,
  f: 65,
  t: 66,
  g: 67,
  y: 68,
  h: 69,
  u: 70,
  j: 71,
  k: 72,
  o: 73,
  l: 74,
  p: 75,
  ";": 76,
};

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const masterGainControl = document.getElementById("masterFader");
const masterGainValue = document.getElementById("fadeLabel");
const noteDisplay = document.getElementById("noteDisplay");
const keyboardContainer = document.getElementById("keyboard");

masterGain.gain.setValueAtTime(
  dbToGain(parseFloat(masterGainControl.value)),
  audioContext.currentTime
);

masterGainControl.addEventListener("input", () => {
  masterGainValue.textContent = `${masterGainControl.value} dBFS`;
  masterGain.gain.setValueAtTime(
    dbToGain(parseFloat(masterGainControl.value)),
    audioContext.currentTime
  );
});

function dbToGain(db) {
  return Math.pow(10, db / 20);
}

function midiToName(midi) {
  const names = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  return names[midi % 12] + Math.floor(midi / 12 - 1);
}

for (const [key, midi] of Object.entries(noteMap)) {
  const div = document.createElement("div");
  div.className = "key";
  div.dataset.key = key;
  div.dataset.midi = midi;
  div.textContent = key;
  keyboardContainer.appendChild(div);
}

document.addEventListener("keydown", (event) => {
  if (event.target.tagName.toLowerCase() === "select") return; // avoid interference with dropdown

  const key = event.key;
  if (!noteMap[key] || activeVoices[key]) return;

  const midiNote = noteMap[key];
  const frequency = midiToFreq(midiNote);
  const type = waveformSelect.value;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  const now = audioContext.currentTime;
  const attack = 0.05;
  const decay = 0.1;
  const sustain = 0.7;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(1, now + attack);
  gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);

  oscillator.start();
  activeVoices[key] = { oscillator, gainNode };

  console.log(
    `Key: ${key} | MIDI: ${midiNote} | Freq: ${frequency.toFixed(2)} Hz`
  );
  noteDisplay.textContent = `Currently Playing: ${midiToName(
    midiNote
  )} (${midiNote})`;

  const visualKey = document.querySelector(`.key[data-key="${key}"]`);
  if (visualKey) visualKey.classList.add("active");
});

document.addEventListener("keyup", (event) => {
  const key = event.key;
  const voice = activeVoices[key];
  if (voice) {
    const { oscillator, gainNode } = voice;
    const now = audioContext.currentTime;
    const release = 0.3;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + release);
    oscillator.stop(now + release);
    oscillator.disconnect();
    delete activeVoices[key];
  }

  const visualKey = document.querySelector(`.key[data-key="${key}"]`);
  if (visualKey) visualKey.classList.remove("active");

  if (Object.keys(activeVoices).length === 0) {
    noteDisplay.textContent = `Currently Playing: None`;
  }
});
