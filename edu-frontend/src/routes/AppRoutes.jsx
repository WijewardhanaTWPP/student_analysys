import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard.jsx";
import StudentsList from "../pages/StudentsList.jsx";
import StudentProfile from "../pages/StudentProfile.jsx";
import CoursesList from "../pages/CoursesList.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/students" element={<StudentsList />} />
      <Route path="/students/:code" element={<StudentProfile />} />
      <Route path="/courses" element={<CoursesList />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
