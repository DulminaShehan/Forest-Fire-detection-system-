import { useState, useEffect } from "react";

const START_PERCENT = 100; // change this to set the starting battery level

function toVoltage(percent) {
  return parseFloat((3.0 + (percent / 100) * 1.2).toFixed(2)); // 3.0V–4.2V
}

function toStatus(percent) {
  if (percent > 79) return "Good";
  if (percent > 39) return "Normal";
  if (percent > 19) return "Low";
  return "Critical";
}

export function useFakeBattery() {
  const [percent, setPercent] = useState(START_PERCENT);

  useEffect(() => {
    const timer = setInterval(() => {
      setPercent(p => Math.max(0, p - 1));
    }, 60 * 1000); // 1 minute
    return () => clearInterval(timer);
  }, []);

  return {
    percent,
    voltage: toVoltage(percent),
    status:  toStatus(percent),
  };
}
