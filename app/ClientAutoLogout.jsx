'use client';

import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

const INACTIVITY_LIMIT = 5 * 60 * 1000; 
const WARNING_TIME = 30 * 1000; 

export default function ClientAutoLogout() {
  const { data: session, status } = useSession();
  const [showWarning, setShowWarning] = useState(true);
  const [countdown, setCountdown] = useState(WARNING_TIME / 1000);
  const warningTimer = useRef(null);
  const logoutTimer = useRef(null);
  const countdownInterval = useRef(null);

  const resetTimers = () => {
    clearTimeout(warningTimer.current);
    clearTimeout(logoutTimer.current);
    clearInterval(countdownInterval.current);
    setShowWarning(false);
    setCountdown(WARNING_TIME / 1000);

    // Only start timers if user is authenticated
    if (status === 'authenticated') {
      warningTimer.current = setTimeout(() => {
        setShowWarning(true);
        startCountdown();
      }, INACTIVITY_LIMIT - WARNING_TIME);

      logoutTimer.current = setTimeout(() => {
        signOut();
      }, INACTIVITY_LIMIT);
    }
  };

  const startCountdown = () => {
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (status !== 'authenticated') return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const activityHandler = () => resetTimers();

    events.forEach((event) => window.addEventListener(event, activityHandler));
    resetTimers(); // Start timers on mount if logged in

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, activityHandler)
      );
      clearTimeout(warningTimer.current);
      clearTimeout(logoutTimer.current);
      clearInterval(countdownInterval.current);
    };
  }, [status]);

  if (status !== 'authenticated') return null;

  return (
    <>
    {showWarning && (
  <div className="fixed inset-0  z-50 flex justify-center items-center">
    <div className="bg-white border rounded-lg shadow-2xl p-6 max-w-sm w-full text-center animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Session Expiring</h2>
      <p className="text-gray-600 mb-4">
        You will be logged out in <span className="font-bold text-red-600">{countdown}</span> seconds due to inactivity.
      </p>
     
    </div>
  </div>
)}
    </>
  );
}

