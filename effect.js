// effect.js
export function initDelay(audioContext) {
  const delay = audioContext.createDelay();
  delay.delayTime.value = 0.5; // Default delay time (500ms)

  const feedbackGain = audioContext.createGain();
  feedbackGain.gain.value = 0.5; // Default feedback level

  delay.connect(feedbackGain);
  feedbackGain.connect(delay);

  return { delay, feedbackGain };
}

export function setDelayTime(delay, time) {
  delay.delayTime.setValueAtTime(time, delay.context.currentTime);
}

export function setFeedbackGain(feedbackGain, gainValue) {
  feedbackGain.gain.setValueAtTime(gainValue, feedbackGain.context.currentTime);
}

// Overdrive effect functions (newly added)
let overdrive = null;

export function initOverdrive(audioContext) {
  overdrive = audioContext.createWaveShaper();
  overdrive.curve = makeDistortionCurve(400); // Default drive value
  overdrive.oversample = "4x"; // To improve quality of distortion
  return overdrive;
}

export function setOverdriveGain(overdrive, gainValue) {
  overdrive.curve = makeDistortionCurve(gainValue);
}

function makeDistortionCurve(gain) {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; i++) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + gain) * x) / (Math.PI + gain * Math.abs(x));
  }
  return curve;
}

// Reverb using ConvolverNode with adjustable wet/dry mix and dummy IR for simplicity
export function initReverb(audioContext) {
  const convolver = audioContext.createConvolver();

  const wetGain = audioContext.createGain();
  const dryGain = audioContext.createGain();

  // Create dummy impulse response
  const impulse = audioContext.createBuffer(
    2,
    audioContext.sampleRate * 3,
    audioContext.sampleRate
  );
  for (let i = 0; i < impulse.numberOfChannels; i++) {
    const channel = impulse.getChannelData(i);
    for (let j = 0; j < channel.length; j++) {
      channel[j] =
        (Math.random() * 2 - 1) * Math.pow(1 - j / channel.length, 2); // Exponential decay
    }
  }

  convolver.buffer = impulse;

  return { convolver, wetGain, dryGain };
}

export function setReverbWetDry(wetGain, dryGain, mixValue) {
  wetGain.gain.value = mixValue;
  dryGain.gain.value = 1 - mixValue;
}

export function setReverbSize(convolver, sizeSeconds, audioContext) {
  const length = sizeSeconds * audioContext.sampleRate;
  const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
  for (let i = 0; i < impulse.numberOfChannels; i++) {
    const channel = impulse.getChannelData(i);
    for (let j = 0; j < channel.length; j++) {
      channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 2); // Exponential decay
    }
  }
  convolver.buffer = impulse;
}
