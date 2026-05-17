import { useEffect, useRef } from "react";

interface WaveformCanvasProps {
  waveform: number[];
  progress: number;
  color?: string;
}

export function WaveformCanvas({ waveform, progress, color = "#52d0ff" }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0f141d";
    ctx.fillRect(0, 0, width, height);

    if (!waveform.length) {
      ctx.fillStyle = "#67758a";
      ctx.fillText("No waveform", 10, 18);
      return;
    }

    const barWidth = width / waveform.length;
    ctx.fillStyle = color;

    waveform.forEach((value, index) => {
      const h = Math.max(2, value * height * 1.8);
      const y = (height - h) / 2;
      ctx.fillRect(index * barWidth, y, Math.max(1, barWidth - 1), h);
    });

    const x = Math.max(0, Math.min(1, progress)) * width;
    ctx.strokeStyle = "#ffbb54";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }, [progress, waveform, color]);

  return <canvas ref={canvasRef} width={420} height={80} style={{ width: "100%", borderRadius: 8 }} />;
}
