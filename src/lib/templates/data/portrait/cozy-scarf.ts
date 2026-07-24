import type { PosterTemplate } from "../../types";

const template: PosterTemplate = {
  schemaVersion: 1,
  id: "portrait-cozy-scarf",
  name: "포근한 인용구",
  category: "photo-noremovebg",
  canvasSize: { width: 1080, height: 1350 },
  backgroundColor: "#3B2E27",
  layers: [
    {
      id: "bg",
      type: "background",
      zIndex: 0,
      position: { x: 0, y: 0, width: 1080, height: 1350 },
      color: "#3B2E27",
    },
    {
      id: "photo",
      type: "image",
      zIndex: 1,
      position: { x: 380, y: 0, width: 700, height: 1350 },
      imageSlot: "userPhoto",
      fit: "contain",
    },
    {
      id: "quote",
      type: "text",
      zIndex: 2,
      position: { x: 50, y: 120, width: 320, height: 500 },
      textField: "userText",
      fontFamily: "serif",
      fontSize: 46,
      fontWeight: 700,
      color: "#F5EFE6",
      align: "left",
      lineHeight: 1.3,
    },
    {
      id: "date",
      type: "text",
      zIndex: 2,
      position: { x: 50, y: 1220, width: 320, height: 60 },
      textField: "date",
      fontSize: 24,
      color: "#D8C9B8",
      align: "left",
    },
  ],
  weightConditions: {
    timeOfDay: ["evening", "night"],
    weight: 1,
  },
};

export default template;
