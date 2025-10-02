// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import { signOut, useSession } from 'next-auth/react';

// const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes
// const WARNING_TIME = 30 * 1000;         // 30 seconds

// export default function ClientAutoLogout() {
//   const { status } = useSession();
//   const [showWarning, setShowWarning] = useState(false);
//   const [countdown, setCountdown] = useState(WARNING_TIME / 1000);

//   const lastActivityTime = useRef(Date.now());
//   const checkInterval = useRef(null);
//   const countdownInterval = useRef(null);

//   // Track user activity
//   const updateActivity = () => {
//     lastActivityTime.current = Date.now();
//     setShowWarning(false);
//     setCountdown(WARNING_TIME / 1000);
//   };

//   // Start countdown
//   const startCountdown = () => {
//     if (countdownInterval.current) clearInterval(countdownInterval.current);

//     countdownInterval.current = setInterval(() => {
//       setCountdown((prev) => {
//         if (prev <= 1) {
//           clearInterval(countdownInterval.current);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//   };

//   // 🚀 Logout when offline
//   useEffect(() => {
//     const handleOffline = () => {
//       signOut();
//     };
//     window.addEventListener("offline", handleOffline);
//     return () => window.removeEventListener("offline", handleOffline);
//   }, []);

//   // 🚀 Logout on tab close
//   useEffect(() => {
//     const handleUnload = () => {
//       navigator.sendBeacon("/api/logout", JSON.stringify({}));
//     };
//     window.addEventListener("beforeunload", handleUnload);
//     return () => window.removeEventListener("beforeunload", handleUnload);
//   }, []);

//   // 🚀 Inactivity + warning logic
//   useEffect(() => {
//     if (status !== 'authenticated') return;

//     const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
//     events.forEach((event) => window.addEventListener(event, updateActivity));

//     lastActivityTime.current = Date.now();

//     checkInterval.current = setInterval(() => {
//       const now = Date.now();
//       const timeInactive = now - lastActivityTime.current;

//       if (timeInactive >= INACTIVITY_LIMIT) {
//         signOut();
//       } else if (
//         timeInactive >= INACTIVITY_LIMIT - WARNING_TIME &&
//         !showWarning
//       ) {
//         setShowWarning(true);
//         startCountdown();
//       }
//     }, 1000);

//     return () => {
//       events.forEach((event) =>
//         window.removeEventListener(event, updateActivity)
//       );
//       if (checkInterval.current) clearInterval(checkInterval.current);
//       if (countdownInterval.current) clearInterval(countdownInterval.current);
//     };
//   }, [status]);

//   if (status !== 'authenticated') return null;

//   return (
//     <>
//       {showWarning && (
//         <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-40">
//           <div className="bg-white border rounded-lg shadow-2xl p-6 max-w-sm w-full text-center animate-fade-in">
//             <h2 className="text-xl font-semibold text-gray-800 mb-2">
//               Session Expiring
//             </h2>
//             <p className="text-gray-600 mb-4">
//               You will be logged out in{' '}
//               <span className="font-bold text-red-600">{countdown}</span>{' '}
//               seconds due to inactivity.
//             </p>
//             <button
//               onClick={updateActivity}
//               className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//             >
//               Continue Session
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
