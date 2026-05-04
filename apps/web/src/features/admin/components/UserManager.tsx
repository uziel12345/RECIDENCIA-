import { useState } from "react";
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, ShieldIcon, UserIcon } from "../../shared/Icons";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  department: string;
  isActive: boolean;
  lastLogin: string;
}

const mockUsers: MockUser[] = [
  {
    id: "1",
    name: "Carlos Martinez",
    email: "carlos.martinez@ito.edu.mx",
    role: "admin",
    department: "Sistemas",
    isActive: true,
    lastLogin: "Hace 2 horas",
  },
  {
    id: "2",
    name: "Maria Garcia",
    email: "maria.garcia@ito.edu.mx",
    role: "staff",
    department: "Servicios Escolares",
    isActive: true,
    lastLogin: "Hace 1 dia",
  },
  {
    id: "3",
    name: "Juan Lopez",
    email: "juan.lopez@ito.edu.mx",
    role: "staff",
    department: "Recursos Humanos",
    isActive: true,
    lastLogin: "Hace 3 dias",
  },
  {
    id: "4",
    name: "Ana Rodriguez",
    email: "ana.rodriguez@ito.edu.mx",
    role: "staff",
    department: "Mantenimiento",
    isActive: false,
    lastLogin: "Hace 2 semanas",
  },
];

export function UserManager() {
  const [search, setSearch] = useState("");
  const [users] = useState<MockUser[]>(mockUsers);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="user-manager">
      <header className="user-manager__header">
        <div className="user-manager__title">
          <h1>Gestion de Usuarios</h1>
          <p>Administra los usuarios del sistema</p>
        </div>
        <button className="user-manager__add-btn">
          <PlusIcon size={18} />
          <span>Agregar Usuario</span>
        </button>
      </header>

      <div className="user-manager__toolbar">
        <div className="user-manager__search">
          <SearchIcon size={18} />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="user-manager__summary">
          <span>{users.filter((u) => u.isActive).length} activos</span>
          <span className="user-manager__summary-divider">|</span>
          <span>{users.filter((u) => !u.isActive).length} inactivos</span>
        </div>
      </div>

      <div className="user-manager__content">
        <div className="user-manager__grid">
          {filteredUsers.map((user) => (
            <div key={user.id} className={`user-card ${!user.isActive ? "is-inactive" : ""}`}>
              <div className="user-card__header">
                <div className="user-card__avatar">
                  {user.role === "admin" ? <ShieldIcon size={20} /> : <UserIcon size={20} />}
                </div>
                <div className="user-card__info">
                  <span className="user-card__name">{user.name}</span>
                  <span className="user-card__email">{user.email}</span>
                </div>
                <span className={`user-card__role ${user.role === "admin" ? "is-admin" : ""}`}>
                  {user.role === "admin" ? "Admin" : "Personal"}
                </span>
              </div>

              <div className="user-card__details">
                <div className="user-card__detail">
                  <span className="user-card__detail-label">Departamento</span>
                  <span className="user-card__detail-value">{user.department}</span>
                </div>
                <div className="user-card__detail">
                  <span className="user-card__detail-label">Ultimo acceso</span>
                  <span className="user-card__detail-value">{user.lastLogin}</span>
                </div>
              </div>

              <div className="user-card__footer">
                <span className={`user-card__status ${user.isActive ? "is-active" : "is-inactive"}`}>
                  {user.isActive ? "Activo" : "Inactivo"}
                </span>
                <div className="user-card__actions">
                  <button className="user-card__action" title="Editar">
                    <EditIcon size={16} />
                  </button>
                  <button className="user-card__action user-card__action--danger" title="Eliminar">
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
