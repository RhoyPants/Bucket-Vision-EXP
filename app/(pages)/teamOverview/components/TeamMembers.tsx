import { Box, Grid, Paper, Typography } from "@mui/material";
import MemberCard from "./MemberCard";

const members = [
  {
    name: "Liam Davis",
    role: "Developer",
    project: "Company Website",
    current: "Integrating Email",
    status: "In Progress",
  },
  {
    name: "Fiona Sy",
    role: "UI/UX Designer",
    project: "Website UI/UX",
    current: "Color Palette",
    status: "Done",
  },
  {
    name: "James Smith",
    role: "Developer",
    project: "Company Website",
    current: "Integrating Email",
    status: "In Progress",
  },
  {
    name: "Michael Lee",
    role: "QA",
    project: "Company Website",
    current: "Responsiveness",
    status: "In Progress",
  },
  {
    name: "Glivia Wilson",
    role: "Developer",
    project: "Company Website",
    current: "Navigation Bar",
    status: "In Progress",
  },
  {
    name: "Grace Taylor",
    role: "Developer",
    project: "Company Website",
    current: "Footer",
    status: "In Progress",
  },
];

export default function TeamMembers() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 6px 18px rgba(15,15,15,0.03)",
        backgroundColor: "#fff",
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 2 }}>Team Members</Typography>

      {/* Grid of member cards - two columns on md, one on xs */}
      <Grid container spacing={1}>
        {members.map((m) => (
          <Grid key={m.name} size={{ xs: 12, sm: 6, md: 4}}>
            <MemberCard {...m} />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
