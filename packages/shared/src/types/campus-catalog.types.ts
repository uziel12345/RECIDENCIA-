export type CampusStreet = {
  id: string;
  name: string;
  aliases: string[];
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: number | null;
  description?: string | null;
  isVisible: boolean;
};

export type InstitutionalPosition = {
  id: string;
  title: string;
  aliases: string[];
  personName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  buildingId?: string | null;
  buildingName?: string | null;
  officeName?: string | null;
  isPublic: boolean;
  isActive: boolean;
  searchKeywords: string[];
};

export type QuickQueryCategory =
  | "building"
  | "department"
  | "service"
  | "procedure"
  | "person"
  | "position"
  | "classroom";

export type QuickQuery = {
  id: string;
  label: string;
  query: string;
  category: QuickQueryCategory;
  icon?: string | null;
  priority: number;
};
