/*
 * AudioInterface constructor
 * Creates an AudioContext, then initializes master output component
 */
function AudioInterface () {
    this.ctx = new AudioContext();
    this.nodes = {};
    this.output = this.initMasterOut();
    this.remoteWidth = null;
    this.remoteHeight = null;
}

/*
 * Set the source frequency and gain value on key press
 */
AudioInterface.prototype.keyDown = function (vel) {
    var now = this.ctx.currentTime;
    this.nodes.oscGain.gain.cancelScheduledValues(now);
    this.nodes.oscGain.gain.setValueAtTime(0.0, now);
    this.nodes.oscGain.gain.linearRampToValueAtTime(1.0, now + 0.1);
};

/*
 * Set the source frequency and gain value on key move
 */
AudioInterface.prototype.keyMove = function (vel) {
    this.nodes.oscGain.gain.value = vel;
};

/*
 * Mute the source gain value on key release
 */
AudioInterface.prototype.keyUp = function () {
    var now = this.ctx.currentTime;
    this.nodes.oscGain.gain.cancelScheduledValues(now);
    this.nodes.oscGain.gain.setValueAtTime(this.nodes.oscGain.gain.value, now);
    this.nodes.oscGain.gain.linearRampToValueAtTime(0.0, now + 0.2);
};

/*
 * Creates a source oscillator with it's own gain control.
 * Sets a default wave type with muted gain value.
 * Start the oscillator playgin once it's muted.
 */
AudioInterface.prototype.initOscillator = function (wave) {
    this.nodes.osc = this.ctx.createOscillator();
    this.nodes.oscGain = this.ctx.createGain();
    this.setOscWave(wave);
    this.nodes.oscGain.gain.value = 0;
};

/*
 * Set the source oscillator wave type value
 */
AudioInterface.prototype.setOscWave = function (wave) {
    this.nodes.osc.type = wave;
};

AudioInterface.prototype.initBiquadFilter = function (type) {
    this.nodes.filter = this.ctx.createBiquadFilter();
    this.setFilterType(type);
    this.setFilterFreq(12000);
    this.setFilterQuality(1);
};

/*
 * Set the source oscillator frequency value
 */
AudioInterface.prototype.setOscFreq = function (freq) {
    this.nodes.osc.frequency.value = freq;
};

/*
 * Set the source oscillator frequency value
 */

AudioInterface.prototype.getTouchFreq = function (x, y) {
    var freq = 12000 - (parseInt(y, 10) * (12000 / this.remoteHeight));
    var q = 10 - (this.remoteWidth - parseInt(x, 10)) / this.remoteWidth * 10;
    freq = Math.min(freq, 12000);
    freq = Math.max(40, freq);
    q = Math.min(q, 10);
    q = Math.max(1, q);
    this.setFilterQuality(Math.round(q));
    this.setFilterFreq(Math.round(freq));
};

AudioInterface.prototype.getFilterType = function (type) {
    return this.nodes.filter.type;
};

AudioInterface.prototype.setFilterType = function (type) {
    this.nodes.filter.type = type;
};

AudioInterface.prototype.setFilterFreq = function (freq) {
    this.nodes.filter.frequency.value = freq;
};

AudioInterface.prototype.getFilterFreq = function () {
    return this.nodes.filter.frequency.value;
};

AudioInterface.prototype.getFilterQuality = function () {
    return this.nodes.filter.Q.value;
};

AudioInterface.prototype.setFilterQuality = function (q) {
    this.nodes.filter.Q.value = q;
};

AudioInterface.prototype.routeComponents = function (out) {
    this.nodes.osc.connect(this.nodes.filter);
    this.nodes.filter.connect(this.nodes.oscGain);
    this.nodes.oscGain.connect(this.output);
    this.nodes.osc.start(0);
};

/*
 * Master output component consists of a dynamics compressor
 * and volume gain mapped to the AudioContext destination.
 */
AudioInterface.prototype.initMasterOut = function () {
    this.nodes.masterComp = this.ctx.createDynamicsCompressor();
    this.nodes.masterGain = this.ctx.createGain();
    this.nodes.masterGain.gain.value = 0.9;
    this.nodes.masterComp.connect(this.nodes.masterGain);
    this.nodes.masterGain.connect(this.ctx.destination);
    return this.nodes.masterComp;
};

/*
 * Holy sh*t stop the noise already!
 */
AudioInterface.prototype.kill = function () {
    this.nodes.osc.stop(0);
    this.nodes.masterGain.disconnect(this.ctx.destination);
};

AudioInterface.prototype.setRemoteInputSize = function (data) {
    this.remoteWidth = data.x;
    this.remoteHeight = data.y;
};
