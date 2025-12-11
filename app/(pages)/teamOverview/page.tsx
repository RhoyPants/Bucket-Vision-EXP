import { Box, Grid } from "@mui/material";
import OverviewStats from "./components/OverviewStats";
import TeamMembers from "./components/TeamMembers";
import TaskStatus from "./components/TaskStatus";
import TeamRoles from "./components/TeamRoles";
import Layout from "@/app/components/shared/Layout";

export default function TeamOverviewPage() {
  return (
    <Layout>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Top stats */}
        <Box>
          <OverviewStats />
        </Box>

        {/* Main content: left (members) + right (status + roles) */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TeamMembers />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TaskStatus />
              <TeamRoles />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}
