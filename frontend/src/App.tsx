import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import MainPage from "./pages/MainPage";
import TutorsPage from "./pages/TutorsPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterFormPage from "./pages/RegisterFormPage";
import RegisterTutorPage from "./pages/RegisterTutorPage";
import EditProfilePage from "./pages/EditProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import NotificationsPage from "./pages/NotificationsPage";
import LessonsPage from "./pages/LessonsPage";
import MyTutorsPage from "./pages/MyTutorsPage";
import MyTuteesPage from "./pages/MyTuteesPage";
import SessionExpiredModal from "./components/SessionExpiredModal";
import TestTimeControl from "./components/TestTimeControl";
import { apiLogout, apiRefreshToken, SESSION_EXPIRED_EVENT } from "./lib/api";

export default function App() {
  const navigate = useNavigate();
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSessionWorking, setIsSessionWorking] = useState(false);

  useEffect(() => {
    const handler = () => setIsSessionModalOpen(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, handler as EventListener);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler as EventListener);
  }, []);

  const handleExtendSession = async () => {
    setIsSessionWorking(true);
    try {
      const ok = await apiRefreshToken();
      if (ok) {
        setIsSessionModalOpen(false);
        navigate(0);
        return;
      }

      await apiLogout();
      setIsSessionModalOpen(false);
      navigate("/login", { replace: true });
    } finally {
      setIsSessionWorking(false);
    }
  };

  const handleLogout = async () => {
    setIsSessionWorking(true);
    try {
      await apiLogout();
      setIsSessionModalOpen(false);
      navigate("/login", { replace: true });
    } finally {
      setIsSessionWorking(false);
    }
  };

  return (
    <>
      <SessionExpiredModal
        open={isSessionModalOpen}
        isWorking={isSessionWorking}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
      {import.meta.env.VITE_ENABLE_TIME_TRAVEL === "true" && <TestTimeControl />}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/tutors" element={<TutorsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-form" element={<RegisterFormPage />} />
        <Route path="/tutor-signup/:token" element={<RegisterTutorPage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/my-tutors" element={<MyTutorsPage />} />
        <Route path="/my-tutees" element={<MyTuteesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
