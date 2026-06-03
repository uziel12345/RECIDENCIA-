import type { Request, Response } from "express";
import { ApiError } from "../shared/errors/api-error.js";
import { sendSuccess } from "../shared/http/response.js";
import { auditLog } from "../shared/services/audit.service.js";
import {
  calculateNavigationRoute,
  invalidateNavigationCache,
} from "../modules/navigation/navigation.service.js";
import { NavigationRepository } from "../modules/navigation/navigation.repository.js";

const repo = new NavigationRepository();

function getParam(req: Request, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

// ── Read handlers ─────────────────────────────────────────────────────────────

export async function getNavigationNodes(_req: Request, res: Response) {
  const nodes = await repo.findAllActiveNodes();

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ success: true, data: nodes });
}

export async function getNavigationEdges(_req: Request, res: Response) {
  const rows = await repo.findAllActiveEdges();

  const data = rows.map((edge) => ({
    id: edge.id,
    from_node_id: edge.from_node_id,
    to_node_id: edge.to_node_id,
    distance: Number(edge.distance),
    is_bidirectional: Boolean(edge.is_bidirectional),
    is_accessible: Boolean(edge.is_accessible),
    path_type: edge.path_type,
    is_active: Boolean(edge.is_active),
    metadata: edge.metadata,
    dx: Math.abs(Number(edge.from_x) - Number(edge.to_x)),
    dz: Math.abs(Number(edge.from_z) - Number(edge.to_z)),
  }));

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ success: true, data });
}

export async function getBuildingEntrances(_req: Request, res: Response) {
  const entrances = await repo.findAllEntrances();
  return res.status(200).json({ success: true, data: entrances });
}

// ── Write handlers ────────────────────────────────────────────────────────────

export async function createNavigationNode(req: Request, res: Response) {
  const id = await repo.insertNode(req.body);

  invalidateNavigationCache();
  const node = await repo.findNodeById(id);
  auditLog({
    req, action: "CREATE_NAV_NODE", userId: req.authUser?.id,
    resourceType: "navigation_node", resourceId: id,
    details: { code: req.body.code },
  });
  return sendSuccess(res, node, 201, "Nodo creado correctamente");
}

export async function createNavigationEdge(req: Request, res: Response) {
  const { from_node_id, to_node_id } = req.body;

  if (from_node_id === to_node_id) {
    throw new ApiError(400, "El nodo origen y destino no pueden ser el mismo");
  }

  const nodes = await repo.findNodesByIds([from_node_id, to_node_id]);

  if (nodes.length !== 2) {
    throw new ApiError(400, "Los nodos origen y destino deben existir y estar activos");
  }

  const from = nodes.find((n) => n.id === from_node_id)!;
  const to   = nodes.find((n) => n.id === to_node_id)!;
  const distance =
    req.body.distance ??
    Math.hypot(Number(from.x) - Number(to.x), Number(from.z) - Number(to.z));

  await repo.upsertEdge({ ...req.body, distance });

  const id = await repo.findEdgeByFromTo(from_node_id, to_node_id);
  invalidateNavigationCache();
  const edge = id ? await repo.findEdgeById(id) : null;
  auditLog({
    req, action: "CREATE_NAV_EDGE", userId: req.authUser?.id,
    resourceType: "navigation_edge", resourceId: id ?? undefined,
    details: { from: from_node_id, to: to_node_id },
  });
  return sendSuccess(res, edge, 201, "Arista creada correctamente");
}

export async function createBuildingEntrance(req: Request, res: Response) {
  const { building_id, node_id } = req.body;

  await repo.insertEntrance(req.body);

  invalidateNavigationCache();
  const entrance = await repo.findEntranceByBuildingAndNode(building_id, node_id);
  auditLog({
    req, action: "CREATE_BUILDING_ENTRANCE", userId: req.authUser?.id,
    resourceType: "building_entrance", resourceId: entrance?.id,
    details: { building_id, node_id },
  });
  return sendSuccess(res, entrance, 201, "Entrada creada correctamente");
}

// ── Delete handlers ───────────────────────────────────────────────────────────

export async function deleteNavigationNode(req: Request, res: Response) {
  const id = getParam(req, "id");

  await repo.deactivateEdgesForNode(id);
  await repo.deactivateEntrancesForNode(id);
  await repo.deactivateNode(id);

  invalidateNavigationCache();
  auditLog({
    req, action: "DELETE_NAV_NODE", userId: req.authUser?.id,
    resourceType: "navigation_node", resourceId: id,
  });
  return sendSuccess(res, { id }, 200, "Nodo desactivado correctamente");
}

export async function deleteNavigationEdge(req: Request, res: Response) {
  const id = getParam(req, "id");

  await repo.deactivateEdge(id);

  invalidateNavigationCache();
  auditLog({
    req, action: "DELETE_NAV_EDGE", userId: req.authUser?.id,
    resourceType: "navigation_edge", resourceId: id,
  });
  return sendSuccess(res, { id }, 200, "Arista desactivada correctamente");
}

// ── Route / cache ─────────────────────────────────────────────────────────────

export async function getNavigationRoute(req: Request, res: Response) {
  const fromNodeId = String(req.query.fromNodeId ?? "").trim();
  const toNodeId   = String(req.query.toNodeId   ?? "").trim();

  if (!fromNodeId || !toNodeId) {
    throw new ApiError(400, "Los parámetros fromNodeId y toNodeId son obligatorios");
  }

  const route = await calculateNavigationRoute(fromNodeId, toNodeId);

  if (!route) {
    throw new ApiError(404, "No se encontró una ruta entre los nodos indicados");
  }

  return res.status(200).json({ success: true, data: route });
}

export async function invalidateNavigationCacheController(
  _req: Request,
  res: Response
) {
  invalidateNavigationCache();
  return res.status(200).json({
    success: true,
    message: "Cache de navegación invalidado correctamente",
  });
}

export async function resetAllNavigationController(req: Request, res: Response) {
  await repo.deleteAllData();

  invalidateNavigationCache();
  auditLog({ req, action: "RESET_ALL_NAVIGATION", userId: req.authUser?.id });
  return sendSuccess(res, null, 200, "Todas las tablas de navegación limpiadas");
}
