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
