import {
  initDelay,
  setDelayTime,
  setFeedbackGain,
  initOverdrive,
  setOverdriveGain,
  setReverbWetDry,
  setReverbSize,
} from "./effect.js";

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

// Initialize delay effect
const { delay, feedbackGain } = initDelay(audioContext);
// Initialize overdrive
const overdrive = initOverdrive(audioContext);
// Initialize reverb
import { initReverb } from "./effect.js";
const { convolver, wetGain, dryGain } = initReverb(audioContext);

// Connect reverb to master
wetGain.connect(masterGain);
dryGain.connect(masterGain);

//connect effects
masterGain.connect(delay); // Connect master gain to delay

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
  const isSharp = midiToName(midi).includes("#");
  const div = document.createElement("div");
  div.className = `key ${isSharp ? "black" : "white"}`;
  div.dataset.key = key;
  div.dataset.midi = midi;
  div.textContent = key;
  keyboardContainer.appendChild(div);
}

// Handle Delay Time Slider
const delayTimeSlider = document.getElementById("delayTimeSlider");
const delayTimeLabel = document.getElementById("delayTimeLabel");
delayTimeSlider.addEventListener("input", (event) => {
  const delayTime = parseFloat(event.target.value);
  setDelayTime(delay, delayTime);
  delayTimeLabel.textContent = `${delayTime.toFixed(2)}s`; // Update the label with the current value
});

// Handle Feedback Gain Slider
const feedbackSlider = document.getElementById("feedbackSlider");
const feedbackLabel = document.getElementById("feedbackLabel");
feedbackSlider.addEventListener("input", (event) => {
  const feedbackValue = parseFloat(event.target.value);
  setFeedbackGain(feedbackGain, feedbackValue);
  feedbackLabel.textContent = `${feedbackValue.toFixed(2)}`; // Update the label with the current value
});

// Handle Reverb Size
const reverbSizeSlider = document.getElementById("reverbSizeSlider");
const reverbSizeLabel = document.getElementById("reverbSizeLabel");
reverbSizeSlider.addEventListener("input", (event) => {
  const size = parseFloat(event.target.value);
  setReverbSize(convolver, size, audioContext);
  reverbSizeLabel.textContent = `${size.toFixed(2)}s`;
});

// Handle Wet/Dry Mix
const reverbMixSlider = document.getElementById("reverbMixSlider");
const reverbMixLabel = document.getElementById("reverbMixLabel");
reverbMixSlider.addEventListener("input", (event) => {
  const mix = parseFloat(event.target.value);
  setReverbWetDry(wetGain, dryGain, mix);
  reverbMixLabel.textContent = `${(mix * 100).toFixed(0)}% Wet`;
});

// Handle Overdrive Gain Slider
const overdriveGainSlider = document.getElementById("overdriveGain");
const overdriveGainLabel = document.getElementById("overdriveGainLabel");
overdriveGainSlider.addEventListener("input", (event) => {
  const gainValue = parseFloat(event.target.value);
  setOverdriveGain(overdrive, gainValue);
  overdriveGainLabel.textContent = `${gainValue}`; // Update the label with the current value
});
// Move the sliders to 0
overdriveGainSlider.value = 0;
delayTimeSlider.value = 0;
reverbMixSlider.value = 0;
feedbackSlider.value = 0.35;

// Update the labels too
overdriveGainLabel.textContent = "0"; // Overdrive Gain
delayTimeLabel.textContent = "0.00s"; // Delay Time
reverbMixLabel.textContent = "0% Wet"; // Reverb Wet/Dry
feedbackLabel.textContent = ".35"; //feedback gain

// set the audio effects to 0
setDelayTime(delay, 0);
setOverdriveGain(overdrive, 0);
setReverbWetDry(wetGain, dryGain, 0);
setFeedbackGain(feedbackGain, 0.35);

document.addEventListener("keydown", (event) => {
  if (event.target.tagName.toLowerCase() === "select") return;

  const key = event.key;
  if (!noteMap[key] || activeVoices[key]) return;

  const midiNote = noteMap[key];
  const frequency = midiToFreq(midiNote);
  const type = waveformSelect.value;

  const oscillator = audioContext.createOscillator();
  const ampEnv = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.connect(ampEnv);
  ampEnv.connect(overdrive); // Connect to overdrive before going to feedback gain
  overdrive.connect(feedbackGain); // Connect overdrive to feedback gain
  feedbackGain.connect(dryGain); // DRY signal path
  feedbackGain.connect(convolver); // WET signal path
  convolver.connect(wetGain); // WET to output
  feedbackGain.connect(masterGain); // Connect feedback gain to master gain

  const now = audioContext.currentTime;
  const attack = 0.02;
  const decay = 0.05;
  const sustain = 0.6;
  const release = 0.45;

  ampEnv.gain.cancelScheduledValues(now);
  ampEnv.gain.setValueAtTime(0.0001, now);
  ampEnv.gain.exponentialRampToValueAtTime(1.0, now + attack);
  ampEnv.gain.exponentialRampToValueAtTime(sustain, now + attack + decay);

  oscillator.start();
  activeVoices[key] = { oscillator, ampEnv, release };

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
    const { oscillator, ampEnv, release } = voice;
    const now = audioContext.currentTime;

    ampEnv.gain.cancelScheduledValues(now);
    ampEnv.gain.setValueAtTime(ampEnv.gain.value, now);
    ampEnv.gain.exponentialRampToValueAtTime(0.0001, now + release);

    oscillator.stop(now + release + 0.05);
    delete activeVoices[key];
  }

  const visualKey = document.querySelector(`.key[data-key="${key}"]`);
  if (visualKey) visualKey.classList.remove("active");

  if (Object.keys(activeVoices).length === 0) {
    noteDisplay.textContent = `Currently Playing: None`;
  }
});
