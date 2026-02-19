import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StudentsAPI } from "../api/students.api.js";

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await StudentsAPI.list();
        setStudents(res.data);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load students");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (err) return <div style={{ color: "red" }}>{err}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Students</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Code</th>
            <th>Full Name</th>
            <th>Profile</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.code}</td>
              <td>{s.full_name}</td>
              <td>
                <Link to={`/students/${s.code}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
