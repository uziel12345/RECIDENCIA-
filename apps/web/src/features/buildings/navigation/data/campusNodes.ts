import type { CampusNode } from "../types/campus-node";

export const campusNodes: CampusNode[] = [
  {
    id: "n-entrada-principal",
    x: 0,
    y: 0,
    z: 0,
    neighbors: ["n-direccion", "n-biblioteca"],
  },
  {
    id: "n-direccion",
    x: 12,
    y: 0,
    z: 8,
    neighbors: ["n-entrada-principal", "n-centro-computo"],
  },
  {
    id: "n-biblioteca",
    x: -10,
    y: 0,
    z: 14,
    neighbors: ["n-entrada-principal", "n-centro-computo"],
  },
  {
    id: "n-centro-computo",
    x: 18,
    y: 0,
    z: 18,
    neighbors: ["n-direccion", "n-biblioteca", "n-edificio-h"],
  },
  {
    id: "n-edificio-h",
    x: 28,
    y: 0,
    z: 28,
    neighbors: ["n-centro-computo", "n-edificio-i"],
  },
  {
    id: "n-edificio-i",
    x: 38,
    y: 0,
    z: 38,
    neighbors: ["n-edificio-h", "n-edificio-j"],
  },
  {
    id: "n-edificio-j",
    x: 48,
    y: 0,
    z: 48,
    neighbors: ["n-edificio-i"],
  },
];