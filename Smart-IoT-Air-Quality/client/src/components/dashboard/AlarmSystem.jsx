import { useEffect, useRef, useState } from "react";

function AlarmSystem({ aqi }) {
  // ==========================================
  // SETTINGS
  // ==========================================

  const AQI_LIMIT = 200;
  const BUZZER_INTERVAL = 2000;

  // ==========================================
  // STATES
  // ==========================================

  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmMuted, setAlarmMuted] = useState(false);

  // ==========================================
  // REFERENCES
  // ==========================================

  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);

  // ==========================================
  // CURRENT AQI
  // ==========================================

  const currentAQI = Number(aqi) || 0;

  // ==========================================
  // BROWSER AUDIO INITIALIZATION
  // ==========================================

  const enableAlarm = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current =
          new (window.AudioContext ||
            window.webkitAudioContext)();
      }

      if (
        audioContextRef.current.state === "suspended"
      ) {
        await audioContextRef.current.resume();
      }

      setAlarmEnabled(true);

      // Allow alarm to work
      setAlarmMuted(false);

      console.log("🔊 Alarm sound enabled");

      // Test beep
      playBuzzer();

    } catch (error) {
      console.error(
        "Audio initialization failed:",
        error
      );
    }
  };

  // ==========================================
  // BROWSER BUZZER
  // ==========================================

  const playBuzzer = () => {
    try {
      if (!audioContextRef.current) {
        return;
      }

      const audioContext =
        audioContextRef.current;

      // Make sure audio is running
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator =
        audioContext.createOscillator();

      const gainNode =
        audioContext.createGain();

      // Buzzer sound
      oscillator.type = "square";

      oscillator.frequency.setValueAtTime(
        900,
        audioContext.currentTime
      );

      // Volume
      gainNode.gain.setValueAtTime(
        0.25,
        audioContext.currentTime
      );

      // Connect audio
      oscillator.connect(gainNode);

      gainNode.connect(
        audioContext.destination
      );

      // Start
      oscillator.start();

      // Stop after 400ms
      oscillator.stop(
        audioContext.currentTime + 0.4
      );

    } catch (error) {
      console.error(
        "Buzzer error:",
        error
      );
    }
  };

  // ==========================================
  // STOP BUZZER TIMER
  // ==========================================

  const clearAlarmInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // ==========================================
  // AQI ALARM SYSTEM
  // ==========================================

  useEffect(() => {

    // ------------------------------------------
    // ALARM NOT ENABLED
    // ------------------------------------------

    if (!alarmEnabled) {
      clearAlarmInterval();
      setAlarmActive(false);
      return;
    }

    // ------------------------------------------
    // AQI IS SAFE
    // ------------------------------------------

    if (currentAQI <= AQI_LIMIT) {

      clearAlarmInterval();

      setAlarmActive(false);

      // IMPORTANT:
      // Reset mute when AQI becomes safe.
      setAlarmMuted(false);

      return;
    }

    // ------------------------------------------
    // AQI IS DANGEROUS BUT USER MUTED IT
    // ------------------------------------------

    if (alarmMuted) {

      clearAlarmInterval();

      setAlarmActive(false);

      return;
    }

    // ------------------------------------------
    // AQI ABOVE LIMIT
    // ------------------------------------------

    setAlarmActive(true);

    // Prevent multiple intervals
    if (!intervalRef.current) {

      // First beep immediately
      playBuzzer();

      // Continue every 2 seconds
      intervalRef.current = setInterval(() => {
        playBuzzer();
      }, BUZZER_INTERVAL);
    }

    // ------------------------------------------
    // CLEANUP
    // ------------------------------------------

    return () => {
      clearAlarmInterval();
    };

  }, [
    currentAQI,
    alarmEnabled,
    alarmMuted
  ]);

  // ==========================================
  // MUTE CURRENT ALARM
  // ==========================================

  const stopAlarm = () => {

    clearAlarmInterval();

    setAlarmActive(false);

    // Mute until AQI becomes safe
    setAlarmMuted(true);

    console.log(
      "🔇 Alarm muted until AQI becomes safe"
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="card shadow-sm mb-4">

      <div className="card-body">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="d-flex justify-content-between align-items-center">

          <div>

            <h5 className="mb-1">
              🔊 Air Quality Alarm
            </h5>

            <small className="text-muted">
              AQI safety monitoring
            </small>

          </div>

          {/* ====================================
              ENABLE ALARM
          ==================================== */}

          {!alarmEnabled && (

            <button
              className="btn btn-primary"
              onClick={enableAlarm}
            >
              🔊 Enable Alarm
            </button>

          )}

          {/* ====================================
              ENABLED STATUS
          ==================================== */}

          {alarmEnabled && !alarmActive && (

            <span className="badge bg-success">
              🔊 Alarm Enabled
            </span>

          )}

        </div>

        <hr />

        {/* ======================================
            CURRENT AQI
        ====================================== */}

        <div className="mb-3">

          <strong>
            Current AQI:
          </strong>{" "}

          <span
            className={
              currentAQI > AQI_LIMIT
                ? "text-danger fw-bold"
                : "text-success fw-bold"
            }
          >
            {currentAQI}
          </span>

        </div>

        {/* ======================================
            AQI LIMIT
        ====================================== */}

        <div className="mb-3">

          <small className="text-muted">
            Alarm threshold: AQI &gt; {AQI_LIMIT}
          </small>

        </div>

        {/* ======================================
            ALARM ACTIVE
        ====================================== */}

        {alarmActive && (

          <div className="alert alert-danger text-center">

            <h4>
              🚨 AQI LIMIT EXCEEDED
            </h4>

            <p className="mb-2">
              Air quality is unhealthy.
            </p>

            <p className="mb-2">

              Current AQI:

              <strong>
                {" "}
                {currentAQI}
              </strong>

            </p>

            <strong>
              🔊 ALARM ACTIVE
            </strong>

            <br />

            <button
              className="btn btn-dark mt-3"
              onClick={stopAlarm}
            >
              🔇 Mute Alarm
            </button>

          </div>

        )}

        {/* ======================================
            MUTED
        ====================================== */}

        {!alarmActive &&
          alarmMuted &&
          currentAQI > AQI_LIMIT && (

          <div className="alert alert-warning text-center">

            <h5>
              🔇 Alarm Muted
            </h5>

            <p className="mb-0">

              AQI is still above the safe limit.

              <br />

              Alarm will automatically reset
              when AQI becomes ≤ {AQI_LIMIT}.

            </p>

          </div>

        )}

        {/* ======================================
            NORMAL
        ====================================== */}

        {currentAQI <= AQI_LIMIT && (

          <div className="alert alert-success text-center mb-0">

            <h5>
              🟢 Air Quality Normal
            </h5>

            <p className="mb-0">

              AQI is within the safe limit.

            </p>

          </div>

        )}

      </div>

    </div>
  );
}

export default AlarmSystem;