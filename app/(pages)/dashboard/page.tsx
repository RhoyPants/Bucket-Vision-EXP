import Layout from "@/app/components/shared/Layout";
import SCurveChart from "@/app/components/shared/Scurved/SCurveChart";

export default function DashboardPage() {
  // TODO: Replace 'yourProjectId' with the actual project ID value or fetch it as needed
  const projectId = "b313946c-05b2-486f-8b5c-0cca11630795";

  return (
    <Layout>
      <div>Dashboard Works!</div>
      <SCurveChart projectId={projectId} />
    </Layout>
  );
}
