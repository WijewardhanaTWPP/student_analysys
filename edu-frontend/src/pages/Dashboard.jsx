import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  colors,
  Stack,
  Divider
} from "@mui/material";

// Icons
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import GitHubIcon from "@mui/icons-material/GitHub";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AnalyticsIcon from "@mui/icons-material/Analytics";

export default function Dashboard() {
  const navigate = useNavigate();

  const modules = [
    { title: "Students", icon: <SchoolIcon sx={{ fontSize: 40 }} />, path: "/students", color: "#2e7d32" },
    { title: "Courses", icon: <MenuBookIcon sx={{ fontSize: 40 }} />, path: "/courses", color: "#1976d2" },
    { title: "Enrollments", icon: <AssignmentIcon sx={{ fontSize: 40 }} />, path: "/enrollments", color: "#ed6c02" },
    { title: "Attendance", icon: <EventAvailableIcon sx={{ fontSize: 40 }} />, path: "/attendance", color: "#9c27b0" },
    { title: "Participation", icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />, path: "/participation", color: "#0288d1" },
    { title: "Predictions", icon: <AnalyticsIcon sx={{ fontSize: 40 }} />, path: "/predict", color: "#d32f2f" },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/*NAVIBAR */}
      <AppBar position="sticky" elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e0e0e0' }}>
        <Container>
          <Toolbar disableGutters>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnalyticsIcon /> EduAnalytics
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton color="primary"><NotificationsIcon /></IconButton>
              <IconButton color="primary"><AccountCircleIcon /></IconButton>
              <Button variant="outlined" size="small" sx={{ borderRadius: 2 }}>Log in</Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/*CONTENT*/}
      <Box
        sx={{
          flexGrow: 1,
          background: "linear-gradient(135deg, #48a8f1 0%, #eaf874 100%)",
          py: 8,
        }}
      >
        <Container>
          <Typography variant="h3" align="center" color="#011385" fontWeight="bold" gutterBottom sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
            Educational Analytics System
          </Typography>

          <Typography variant="h6" align="center" color="#0138c5" sx={{ mb: 6, opacity: 0.9 }}>
            Student Performance Monitoring & Predicting
          </Typography>

          <Grid container spacing={4}>
            {modules.map((module, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ borderRadius: 4, boxShadow: "0 8px 40px rgba(0,0,0,0.12)", transition: "0.3s", "&:hover": { transform: "translateY(-5px)", boxShadow: "0 12px 50px rgba(0,0,0,0.2)" } }}>
                  <CardActionArea onClick={() => navigate(module.path)}>
                    <CardContent sx={{ textAlign: "center", py: 5 }}>
                      <Box sx={{ color: module.color, mb: 2 }}>{module.icon}</Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: "#333" }}>
                        {module.title}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}