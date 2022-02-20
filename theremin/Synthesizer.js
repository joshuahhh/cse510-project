function Synthesizer() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext ||
        window.mozAudioContext || window.oAudioContext || window.msAudioContext)();

    this.osc = this.audioCtx.createOscillator();
    this.osc.type = 'sine';

    this.gain = this.audioCtx.createGain();
    this.osc.connect(this.gain);
    this.gain.gain.value = 0;
    this.gain.connect(this.audioCtx.destination);

    this.started = false;
}

Synthesizer.prototype.play = function(volume, freq) {
    // Constrain volume to [0, 100]
    volume = Math.max(0, Math.min(100, volume));

    // Constrain frequency to [0, 1000]
    freq = Math.max(0, Math.min(1000, freq));

    this.osc.frequency.value = freq;
    this.gain.gain.value = Math.pow(volume / 100, 3);

    if (!this.started) {
        this.osc.start();
        this.started = true;
    }
}

Synthesizer.prototype.muted = function(muted) {
    if (muted) {
        this.audioCtx.suspend();
    } else {
        this.audioCtx.resume();
    }
}