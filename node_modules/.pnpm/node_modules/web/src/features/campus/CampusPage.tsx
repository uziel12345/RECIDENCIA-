import { CampusViewer } from "../../components/viewer/CampusViewer";
import { BuildingSidebar } from "../buildings/components/BuildingSidebar";
import { BuildingSearch } from "../buildings/components/BuildingSearch";

export function CampusPage() {
  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        width: "100%",
        height: "100vh",
      }}
    >
      <div>
        <BuildingSidebar />
      </div>

      <section style={{ position: "relative", width: "100%", height: "100%" }}>
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 20,
            width: "280px",
            background: "rgba(255,255,255,0.95)",
            padding: "12px",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          <BuildingSearch />
        </div>

        <CampusViewer />
      </section>
    </main>
  );
}