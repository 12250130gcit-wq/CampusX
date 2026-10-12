import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
export default function CameraScanner({ mode = "qr", onScan, onClose }) {
  const video = useRef(null),
    canvas = useRef(null),
    callback = useRef(onScan);
  const [message, setMessage] = useState("Starting camera…");
  callback.current = onScan;
  useEffect(() => {
    let stopped = false,
      stream,
      frame;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play();
        setMessage(
          mode === "qr"
            ? "Point the camera at the student QR/card code."
            : "Compare the student with their identity card, then confirm below.",
        );
        if (mode === "qr") frame = requestAnimationFrame(scan);
      } catch (error) {
        if (!stopped)
          setMessage(
            `Camera unavailable: ${error.message}. Use manual search.`,
          );
      }
    }
    function scan() {
      if (stopped) return;
      const v = video.current,
        c = canvas.current;
      if (v && c && v.readyState >= 2) {
        c.width = Math.min(v.videoWidth, 960);
        c.height = Math.round((c.width * v.videoHeight) / v.videoWidth);
        const context = c.getContext("2d", { willReadFrequently: true });
        context.drawImage(v, 0, 0, c.width, c.height);
        const result = jsQR(
          context.getImageData(0, 0, c.width, c.height).data,
          c.width,
          c.height,
        );
        if (result && callback.current(result.data)) {
          setMessage("Student identified.");
          return;
        }
      }
      frame = requestAnimationFrame(scan);
    }
    start();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [mode]);
  return (
    <div className="card card-pad">
      <video ref={video} autoPlay playsInline muted className="camera-video" />
      <canvas ref={canvas} hidden />
      <p role="status">{message}</p>
      <button type="button" className="btn btn-outline" onClick={onClose}>
        Stop Camera
      </button>
    </div>
  );
}
