import { useState } from "react";
import { LayersIcon, PlusIcon, NavigationIcon, InfoIcon } from "../../shared/Icons";

export function NavigationEditor() {
  const [selectedTool, setSelectedTool] = useState<"view" | "add" | "connect">("view");

  return (
    <div className="navigation-editor">
      <header className="navigation-editor__header">
        <div className="navigation-editor__title">
          <h1>Editor de Navegacion</h1>
          <p>Administra los puntos y rutas de navegacion del campus</p>
        </div>
      </header>

      <div className="navigation-editor__toolbar">
        <div className="navigation-editor__tools">
          <button
            className={`navigation-editor__tool ${selectedTool === "view" ? "is-active" : ""}`}
            onClick={() => setSelectedTool("view")}
          >
            <LayersIcon size={18} />
            <span>Ver Nodos</span>
          </button>
          <button
            className={`navigation-editor__tool ${selectedTool === "add" ? "is-active" : ""}`}
            onClick={() => setSelectedTool("add")}
          >
            <PlusIcon size={18} />
            <span>Agregar Nodo</span>
          </button>
          <button
            className={`navigation-editor__tool ${selectedTool === "connect" ? "is-active" : ""}`}
            onClick={() => setSelectedTool("connect")}
          >
            <NavigationIcon size={18} />
            <span>Conectar</span>
          </button>
        </div>
      </div>

      <div className="navigation-editor__content">
        <div className="navigation-editor__info-panel">
          <div className="navigation-editor__info-icon">
            <InfoIcon size={24} />
          </div>
          <h3>Editor de Navegacion</h3>
          <p>
            Selecciona una herramienta para comenzar a editar los puntos de navegacion.
            Los nodos definen los puntos por donde los usuarios pueden caminar, y las
            conexiones establecen las rutas posibles entre ellos.
          </p>
          <div className="navigation-editor__tips">
            <div className="navigation-editor__tip">
              <strong>Ver Nodos:</strong> Visualiza todos los puntos de navegacion existentes
            </div>
            <div className="navigation-editor__tip">
              <strong>Agregar Nodo:</strong> Haz clic en el mapa para agregar un nuevo punto
            </div>
            <div className="navigation-editor__tip">
              <strong>Conectar:</strong> Selecciona dos nodos para crear una conexion entre ellos
            </div>
          </div>
        </div>

        <div className="navigation-editor__stats">
          <div className="navigation-editor__stat">
            <span className="navigation-editor__stat-value">45</span>
            <span className="navigation-editor__stat-label">Nodos totales</span>
          </div>
          <div className="navigation-editor__stat">
            <span className="navigation-editor__stat-value">78</span>
            <span className="navigation-editor__stat-label">Conexiones</span>
          </div>
          <div className="navigation-editor__stat">
            <span className="navigation-editor__stat-value">40</span>
            <span className="navigation-editor__stat-label">Entradas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
