// Set up WebAudio API context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Create the master gain node
const masterGain = audioContext.createGain();
masterGain.connect(audioContext.destination);

// Track the currently playing oscillator
let currentOscillator = null;

// Note-to-MIDI map
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

// UI Elements
const masterGainControl = document.getElementById("masterFader");
const masterGainValue = document.getElementById("fadeLabel");

// Convert MIDI note to frequency
function midiToFreq(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// Master gain control
masterGainControl.addEventListener("input", () => {
  const dB = parseFloat(masterGainControl.value);
  const linearGain = Math.pow(10, dB / 20);
  masterGain.gain.setValueAtTime(linearGain, audioContext.currentTime);
  masterGainValue.textContent = `${dB.toFixed(1)} dBFS`;
});

// Start AudioContext on first key press
let contextStarted = false;

document.addEventListener("keydown", (event) => {
  if (!contextStarted) {
    audioContext.resume();
    contextStarted = true;
  }

  const key = event.key;
  if (noteMap.hasOwnProperty(key) && !currentOscillator) {
    const midiNote = noteMap[key];
    const frequency = midiToFreq(midiNote);

    const osc = audioContext.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
    osc.connect(masterGain);
    osc.start();

    currentOscillator = osc;
  }
});

document.addEventListener("keyup", () => {
  if (currentOscillator) {
    currentOscillator.stop();
    currentOscillator.disconnect();
    currentOscillator = null;
  }
});
