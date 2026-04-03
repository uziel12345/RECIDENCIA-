import { MainLayout } from "../components/ui/MainLayout";
import { CampusPage } from "../features/campus/CampusPage";

export default function App() {
  return (
    <MainLayout>
      <CampusPage />
    </MainLayout>
  );
}