export interface LightingSyncAdapter {
  initialize: () => Promise<void>;
  sendBeat: (bpm: number) => Promise<void>;
}

export const lightingSyncPlaceholder: LightingSyncAdapter = {
  async initialize() {
    return;
  },
  async sendBeat(_bpm: number) {
    return;
  }
};
