import { api } from "./client";

export const StudentsAPI = {
  list: () => api.get("/api/students"),
  getByCode: (code) => api.get(`/api/students/code/${code}`),
  create: (data) => api.post("/api/students", data),
};
