import React from 'react';
import { PureRenderMixin } from 'react/addons';
import io from 'socket.io-client';
import Oscillator from './oscillator';
import BiquadFilter from './biquad-filter';
import Envelope from './envelope';
import Keyboard from './keyboard';
import StatusIndicator from './status';
import AudioEngine from '../synth/engine';

export default React.createClass({
    mixins: [PureRenderMixin],
    getInitialState: function() {
        return {
            osc1Detune: this.props.data.osc1.detune,
            osc2Detune: this.props.data.osc2.detune,
            freq: this.props.data.filter.freq,
            q: this.props.data.filter.q,
            attack: this.props.data.env.attack,
            release: this.props.data.env.release,
            status: 'disconnected',
            currentKey: null
        };
    },
    componentWillMount: function() {
        this.engine = new AudioEngine();
        this.engine.loadPreset(this.props.data);
        this.osc = this.engine.getSource();
        this.filter = this.engine.getFilter();
        this.env = this.engine.getEnv();
    },
    componentDidMount: function() {
        let socket = io();

        socket.on('connect', () => {
            let id = document.getElementById('synth').dataset.id;
            socket.emit('room', id);
            socket.on('remote-resize', this.filter.setRemoteSize.bind(this.filter));
            socket.on('remote-filter-start', this.setFilterState);
            socket.on('remote-filter-move', this.setFilterState);
            socket.on('remote-status', this.updateStatusIndicator);
        });

        document.addEventListener('keydown', this.handleKeyDown, true);
        document.addEventListener('keyup', this.handleKeyUp, true);
    },
    updateStatusIndicator: function(data) {
        this.setState({
            status: data.connection
        });
    },
    setFilterState: function(data) {
        this.filter.setValuesFromTouch(data.x, data.y);
        this.setState({
            freq: this.filter.getFreq(),
            q: this.filter.getQuality()
        });
    },
    handleOsc1WaveChange: function(e) {
        this.osc.setOsc1Wave(e.target.value);
    },
    handleOsc2WaveChange: function(e) {
        this.osc.setOsc2Wave(e.target.value);
    },
    handleOsc1DetuneChange: function(e) {
        let value = e.target.value;
        this.osc.setOsc1Detune(value);
        this.setState({
            osc1Detune : value
        });
    },
    handleOsc2DetuneChange: function(e) {
        let value = e.target.value;
        this.osc.setOsc2Detune(value);
        this.setState({
            osc2Detune : value
        });
    },
    handleFilterTypeChange: function(e) {
        this.filter.setType(e.target.value);
    },
    handleFilterFreqChange: function(e) {
        this.setState({
            freq: e.target.value
        });
        this.filter.setFreq(e.target.value);
    },
    handleFilterQualityChange: function(e) {
        this.setState({
            q: e.target.value
        });
        this.filter.setQuality(e.target.value);
    },
    handleEnvAttackChange: function(e) {
        this.setState({
            attack: e.target.value
        });
        this.env.setAttack(e.target.value);
    },
    handleEnvReleaseChange: function(e) {
        this.setState({
            release: e.target.value
        });
        this.env.setRelease(e.target.value);
    },
    handleMouseDown: function(e) {
        e.preventDefault();
        let key = e.target.dataset.note;
        let freq = this.engine.getFreqFromNote(key);

        this.osc.setFreq(freq);
        this.engine.noteStart();
        this.currentFreq = freq;
        this.setState({
            currentKey: key
        });
    },
    handleMouseMove: function(e) {
        e.preventDefault();
        let key = e.target.dataset.note;
        let freq = this.engine.getFreqFromNote(key);

        if (this.currentFreq && this.currentFreq !== freq) {
            this.osc.setFreq(freq);
            this.engine.noteMove(1);
            this.currentFreq = freq;
            this.setState({
                currentKey: key
            });
        }
    },
    handleMouseUp: function(e) {
        e.preventDefault();
        if (this.currentFreq) {
            this.engine.noteEnd();
            this.currentFreq = null;
            this.setState({
                currentKey: null
            });
        }
    },
    handleKeyDown: function(e) {
        let key = this.props.data.chars[e.key];
        if (key) {
            e.preventDefault();
            let freq = this.engine.getFreqFromNote(key);
            this.osc.setFreq(freq);
            this.engine.noteStart();
            this.currentFreq = freq;
            this.setState({
                currentKey: key
            });
        }
    },
    handleKeyUp: function(e) {
        if (this.currentFreq) {
            e.preventDefault();
            this.engine.noteEnd();
            this.currentFreq = null;
            this.setState({
                currentKey: null
            });
        }
    },
    render: function() {
        return (
            <div>
                <StatusIndicator
                    status={this.state.status} />
                <Oscillator
                    data={this.props.data.osc1}
                    waves={this.props.data.waves}
                    detune={this.state.osc1Detune}
                    onWaveChange={this.handleOsc1WaveChange}
                    onDetuneChange={this.handleOsc1DetuneChange} />
                <Oscillator
                    data={this.props.data.osc2}
                    waves={this.props.data.waves}
                    detune={this.state.osc2Detune}
                    onWaveChange={this.handleOsc2WaveChange}
                    onDetuneChange={this.handleOsc2DetuneChange} />
                <BiquadFilter
                    data={this.props.data.filter}
                    freq={this.state.freq}
                    q={this.state.q}
                    filters={this.props.data.filters}
                    onFilterTypeChange={this.handleFilterTypeChange}
                    onFilterFreqChange={this.handleFilterFreqChange}
                    onFilterQualityChange={this.handleFilterQualityChange} />
                <Envelope
                    data={this.props.data.env}
                    attack={this.state.attack}
                    release={this.state.release}
                    onEnvAttackChange={this.handleEnvAttackChange}
                    onEnvReleaseChange={this.handleEnvReleaseChange} />
                <Keyboard
                    current={this.state.currentKey}
                    keys={this.props.data.keys}
                    onMouseDown={this.handleMouseDown}
                    onMouseMove={this.handleMouseMove}
                    onMouseUp={this.handleMouseUp} />
            </div>
        );
    }
});
