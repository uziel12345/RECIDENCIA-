import type { MindboxConfig, MindboxRawStudentSchedule, StudentSchedule } from "./mindbox.types.js";
import { adaptStudentSchedule } from "./mindbox.adapter.js";

export class MindboxService {
  constructor(private readonly config: MindboxConfig) {}

  async getStudentSchedule(controlNumber: string): Promise<StudentSchedule> {
    const url = `${this.config.baseUrl}/horario/${encodeURIComponent(controlNumber)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Mindbox ${res.status}: ${text}`);
    }

    const raw = (await res.json()) as MindboxRawStudentSchedule;
    return adaptStudentSchedule(raw);
  }
}

// Singleton configurado desde variables de entorno
// Variables requeridas: MINDBOX_BASE_URL, MINDBOX_API_TOKEN
let _instance: MindboxService | null = null;

export function getMindboxService(): MindboxService {
  if (!_instance) {
    const baseUrl = process.env.MINDBOX_BASE_URL;
    const apiToken = process.env.MINDBOX_API_TOKEN;

    if (!baseUrl || !apiToken) {
      throw new Error(
        "Variables de entorno requeridas: MINDBOX_BASE_URL, MINDBOX_API_TOKEN"
      );
    }

    _instance = new MindboxService({ baseUrl, apiToken });
  }
  return _instance;
}
