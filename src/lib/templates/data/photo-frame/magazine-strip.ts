import type { PosterTemplate } from "../../types";

const template: PosterTemplate = {
  schemaVersion: 1,
  id: "photo-frame-magazine-strip",
  name: "매거진 넘버",
  category: "photo-noremovebg",
  canvasSize: { width: 1080, height: 1350 },
  backgroundColor: "#8C1C2B",
  layers: [
    {
      id: "bg",
      type: "background",
      zIndex: 0,
      position: { x: 0, y: 0, width: 1080, height: 1350 },
      color: "#8C1C2B",
    },
    {
      id: "big-date",
      type: "text",
      zIndex: 1,
      position: { x: 0, y: 150, width: 1080, height: 500 },
      textField: "date",
      dateFormat: "mmdd",
      fontSize: 340,
      fontWeight: 900,
      color: "#A5333F",
      align: "center",
    },
    {
      id: "photo",
      type: "image",
      zIndex: 2,
      position: { x: 240, y: 260, width: 600, height: 800 },
      imageSlot: "userPhoto",
      fit: "cover",
    },
    {
      id: "caption",
      type: "text",
      zIndex: 3,
      position: { x: 80, y: 1130, width: 920, height: 100 },
      textField: "userText",
      fontSize: 30,
      fontWeight: 700,
      color: "#FFFFFF",
      align: "center",
    },
    {
      id: "brand",
      type: "text",
      zIndex: 3,
      position: { x: 60, y: 1260, width: 400, height: 60 },
      textField: "custom",
      customText: "GAMTOO",
      fontSize: 22,
      fontWeight: 700,
      color: "#F1C6CB",
      align: "left",
    },
  ],
  weightConditions: {
    timeOfDay: ["morning"],
    weight: 1,
  },
};

export default template;
