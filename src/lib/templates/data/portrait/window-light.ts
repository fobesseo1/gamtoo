import type { PosterTemplate } from "../../types";

const template: PosterTemplate = {
  schemaVersion: 1,
  id: "portrait-window-light",
  name: "잔잔한 하루",
  category: "photo-noremovebg",
  canvasSize: { width: 1080, height: 1350 },
  backgroundColor: "#FFFFFF",
  layers: [
    {
      id: "bg",
      type: "background",
      zIndex: 0,
      position: { x: 0, y: 0, width: 1080, height: 1350 },
      color: "#FFFFFF",
    },
    {
      id: "heading",
      type: "text",
      zIndex: 1,
      position: { x: 0, y: 70, width: 1080, height: 100 },
      textField: "custom",
      customText: "오늘의 감탄",
      fontSize: 40,
      fontWeight: 600,
      color: "#222222",
      align: "center",
    },
    {
      id: "photo",
      type: "image",
      zIndex: 2,
      position: { x: 140, y: 220, width: 800, height: 850 },
      imageSlot: "userPhoto",
      fit: "contain",
      borderRadius: 12,
    },
    {
      id: "caption",
      type: "text",
      zIndex: 3,
      position: { x: 100, y: 1120, width: 880, height: 120 },
      textField: "userText",
      fontSize: 30,
      color: "#333333",
      align: "center",
      lineHeight: 1.4,
    },
    {
      id: "date",
      type: "text",
      zIndex: 3,
      position: { x: 100, y: 1250, width: 880, height: 60 },
      textField: "date",
      fontSize: 22,
      color: "#999999",
      align: "center",
    },
  ],
};

export default template;
