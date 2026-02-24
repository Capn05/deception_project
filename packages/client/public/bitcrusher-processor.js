class BitcrusherProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'bitDepth', defaultValue: 8, minValue: 1, maxValue: 16 },
      { name: 'frequencyReduction', defaultValue: 4, minValue: 1, maxValue: 32 },
    ];
  }

  constructor() {
    super();
    this._lastSample = 0;
    this._counter = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0]) return true;

    const bitDepth = parameters.bitDepth[0] || 8;
    const freqReduction = parameters.frequencyReduction[0] || 4;
    const step = Math.pow(0.5, bitDepth);

    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      for (let i = 0; i < inputChannel.length; i++) {
        this._counter++;
        if (this._counter >= freqReduction) {
          this._counter = 0;
          this._lastSample = step * Math.floor(inputChannel[i] / step + 0.5);
        }
        outputChannel[i] = this._lastSample;
      }
    }

    return true;
  }
}

registerProcessor('bitcrusher-processor', BitcrusherProcessor);
