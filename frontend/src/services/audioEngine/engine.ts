export class AudioEngine {
  private audioContext: AudioContext | null = null;

  init(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  getStatus(): string {
    if (!this.audioContext) {
      return "idle";
    }
    return this.audioContext.state;
  }
}

export const audioEngine = new AudioEngine();
