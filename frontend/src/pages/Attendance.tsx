import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Attendance = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isStreaming, setIsStreaming] = useState(false);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Failed to access camera. Please check permissions.",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const captureAndRecognize = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      try {
        import { api } from "@/lib/api";

        const response = await fetch(api("/api/recognize"), {
         method: "POST",
         body: formData,
      });

        const data = await response.json();

        if (data.success) {
          setUserName(data.name);
          setStatus({
            type: "success",
            message: `Attendance Marked for ${data.name}!`,
          });
          setTimeout(() => setStatus({ type: null, message: "" }), 3000);
        } else if (data.error === "already_marked") {
          setStatus({
            type: "info",
            message: "Attendance already recorded.",
          });
          setTimeout(() => setStatus({ type: null, message: "" }), 3000);
        } else {
          setStatus({
            type: "error",
            message: "Unknown User. Please contact Admin.",
          });
          setTimeout(() => setStatus({ type: null, message: "" }), 3000);
        }
      } catch (error) {
        setStatus({
          type: "error",
          message: "Connection error. Please try again.",
        });
      }
    }, "image/jpeg");
  };

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      captureAndRecognize();
    }, 2000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Camera className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Attendance System</h1>
          </div>
          <p className="text-muted-foreground">
            Stand in front of the camera to mark your attendance
          </p>
        </div>

        <div className="relative bg-card rounded-lg overflow-hidden shadow-lg border">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
          />
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <p className="text-muted-foreground">Initializing camera...</p>
            </div>
          )}
        </div>

        {status.type && (
          <Alert
            variant={status.type === "error" ? "destructive" : "default"}
            className="animate-in fade-in slide-in-from-top-2"
          >
            {status.type === "success" && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {status.type === "error" && <XCircle className="h-5 w-5" />}
            {status.type === "info" && (
              <AlertCircle className="h-5 w-5 text-blue-600" />
            )}
            <AlertDescription className="text-lg font-semibold">
              {status.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center">
          <a
            href="/admin/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
