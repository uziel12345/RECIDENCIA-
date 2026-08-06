import { describe, expect, it } from "vitest";
import { CampusStreetLabels } from "./CampusStreetLabels";
import { getVisibleCampusStreets } from "./street-label-visibility";

const streets = Array.from({ length: 4 }, (_, index) => ({
  id: String(index),
  name: `Calle ${index}`,
  aliases: [],
  position: { x: index, y: 1, z: index },
  isVisible: index !== 3,
}));

describe("street label visibility", () => {
  it("shows every enabled label on desktop", () => {
    expect(getVisibleCampusStreets(streets, false)).toHaveLength(3);
  });

  it("limits labels on mobile", () => {
    expect(getVisibleCampusStreets(streets, true)).toHaveLength(2);
  });

  it("hides the complete street layer when requested", () => {
    expect(CampusStreetLabels({ streets, hidden: true })).toBeNull();
  });

  it("prioritizes the streets closest to the camera instead of cutting by array order", () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      name: `Calle ${index}`,
      aliases: [],
      position: { x: index * 10, y: 1, z: 0 },
      isVisible: true,
    }));
    const nearCameraAtEnd = getVisibleCampusStreets(many, false, { x: 110, z: 0 });
    expect(nearCameraAtEnd.map((street) => street.id)).toContain("11");
    expect(nearCameraAtEnd).toHaveLength(10);
  });
});
