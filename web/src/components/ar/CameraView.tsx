import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface CameraViewProps {
  /** Called with the MediaStreamError when the stream can't be opened. */
  onError: (error: Error) => void;
  /** Called once the first frame has arrived (useful for hiding skeletons). */
  onReady?: (video: HTMLVideoElement) => void;
}

export interface CameraViewHandle {
  /** Access the underlying <video> element — used by the detection service. */
  getVideoElement: () => HTMLVideoElement | null;
}

/**
 * Full-screen environment-facing camera feed. Tears down the MediaStream on
 * unmount so the camera light turns off as soon as we leave the AR screen.
 */
export const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(
  function CameraView({ onError, onReady }, ref) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        getVideoElement: () => videoRef.current,
      }),
      [],
    );

    useEffect(() => {
      let cancelled = false;
      let stream: MediaStream | null = null;

      (async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          const video = videoRef.current;
          if (video) {
            video.srcObject = stream;
            const handleLoaded = () => {
              onReady?.(video);
              video.removeEventListener('loadeddata', handleLoaded);
            };
            video.addEventListener('loadeddata', handleLoaded);
          }
        } catch (err) {
          if (!cancelled) {
            onError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      })();

      return () => {
        cancelled = true;
        if (stream) stream.getTracks().forEach((t) => t.stop());
      };
    }, [onError, onReady]);

    return (
      <video
        ref={videoRef}
        id="camera-feed"
        autoPlay
        playsInline
        muted
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover bg-black"
      />
    );
  },
);
