import { useEffect, useRef, useState } from "react";

function AQIAlert({ aqi }) {
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);

  const isDanger = aqi > 200;
  const isWarning = aqi > 100 && aqi <= 200;

  useEffect(() => {
    if (!isDanger || muted) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      return;
    }

    if (audioRef.current) {
      audioRef.current.loop = true;

      audioRef.current.play().catch(() => {
        console.log(
          "Browser blocked automatic audio playback."
        );
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isDanger, muted]);

  function toggleMute() {
    setMuted((previous) => !previous);
  }

  return (
    <div className="card shadow mt-4">
      <div className="card-body">

        <h4 className="mb-3">
          AQI Alert System
        </h4>

        <audio
          ref={audioRef}
          src="/alert.mp3"
        />

        {aqi <= 100 && (
          <div className="alert alert-success">
            🟢 Air quality is currently within
            the safe monitoring range.
          </div>
        )}

        {isWarning && (
          <div className="alert alert-danger">
            🔴 Warning: AQI has crossed 100.
            Increased pollution detected.
          </div>
        )}

        {isDanger && (
          <div className="alert alert-danger">

            <h5>
              🚨 HIGH AQI ALERT
            </h5>

            <p className="mb-3">
              AQI is {aqi}. Immediate attention
              is recommended.
            </p>

            <button
              className="btn btn-dark"
              onClick={toggleMute}
            >
              {muted ? "🔊 Enable Alarm" : "🔇 Mute Alarm"}
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

export default AQIAlert;