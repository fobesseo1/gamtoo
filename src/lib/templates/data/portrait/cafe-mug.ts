import type { PosterTemplate } from "../../types";

const template: PosterTemplate = {
  schemaVersion: 1,
  id: "portrait-cafe-mug",
  name: "카페 무드",
  category: "photo-noremovebg",
  canvasSize: { width: 1080, height: 1350 },
  backgroundColor: "#F1EFEA",
  layers: [
    {
      id: "bg",
      type: "background",
      zIndex: 0,
      position: { x: 0, y: 0, width: 1080, height: 1350 },
      color: "#F1EFEA",
    },
    {
      id: "title",
      type: "text",
      zIndex: 1,
      position: { x: 40, y: 60, width: 1000, height: 300 },
      textField: "custom",
      customText: "coffee",
      fontFamily: "sans-serif",
      fontSize: 220,
      fontWeight: 800,
      color: "#111111",
      align: "left",
    },
    {
      id: "photo",
      type: "image",
      zIndex: 2,
      position: { x: 190, y: 330, width: 700, height: 800 },
      imageSlot: "userPhoto",
      fit: "contain",
      borderRadius: 24,
    },
    {
      id: "date",
      type: "text",
      zIndex: 3,
      position: { x: 60, y: 1170, width: 300, height: 80 },
      textField: "date",
      fontSize: 28,
      fontWeight: 600,
      color: "#111111",
      align: "left",
    },
    {
      id: "caption",
      type: "text",
      zIndex: 3,
      position: { x: 60, y: 1240, width: 960, height: 100 },
      textField: "userText",
      fontSize: 26,
      color: "#4A4A4A",
      align: "left",
    },
  ],
  weightConditions: {
    timeOfDay: ["morning", "afternoon"],
    weight: 1,
  },
};

export default template;
