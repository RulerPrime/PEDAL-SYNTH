// effect.js

let delayNode, feedbackGainNode, filterNode;

export function initEffects(audioContext) {
  delayNode = audioContext.createDelay();
  feedbackGainNode = audioContext.createGain();
  filterNode = audioContext.createBiquadFilter();

  delayNode.delayTime.value = 0.3;
  feedbackGainNode.gain.value = 0.3;
  filterNode.type = "lowpass";
  filterNode.frequency.value = 10000;

  delayNode.connect(feedbackGainNode);
  feedbackGainNode.connect(delayNode);

  delayNode.connect(filterNode);
  return filterNode;
}

export function setDelayTime(time) {
  if (delayNode) {
    delayNode.delayTime.setValueAtTime(time, delayNode.context.currentTime);
  }
}

export function setFeedbackGain(gain) {
  if (feedbackGainNode) {
    feedbackGainNode.gain.setValueAtTime(
      gain,
      feedbackGainNode.context.currentTime
    );
  }
}

export function setFilterCutoff(freq) {
  if (filterNode) {
    filterNode.frequency.setValueAtTime(freq, filterNode.context.currentTime);
  }
}
