import type { PosterTemplate } from "../../types";

const template: PosterTemplate = {
  schemaVersion: 1,
  id: "photo-frame-color-block",
  name: "컬러 블록",
  category: "photo-noremovebg",
  canvasSize: { width: 1080, height: 1350 },
  backgroundColor: "#1F6F5C",
  layers: [
    {
      id: "bg",
      type: "background",
      zIndex: 0,
      position: { x: 0, y: 0, width: 1080, height: 1350 },
      color: "#1F6F5C",
    },
    {
      id: "photo",
      type: "image",
      zIndex: 1,
      position: { x: 0, y: 240, width: 1080, height: 870 },
      imageSlot: "userPhoto",
      fit: "cover",
    },
    {
      id: "location",
      type: "text",
      zIndex: 2,
      position: { x: 60, y: 60, width: 600, height: 60 },
      textField: "location",
      fontSize: 26,
      fontWeight: 700,
      color: "#FFFFFF",
      align: "left",
    },
    {
      id: "date",
      type: "text",
      zIndex: 2,
      position: { x: 60, y: 120, width: 600, height: 60 },
      textField: "date",
      fontSize: 20,
      color: "#CFE9E1",
      align: "left",
    },
    {
      id: "caption",
      type: "text",
      zIndex: 2,
      position: { x: 60, y: 1160, width: 960, height: 140 },
      textField: "userText",
      fontSize: 28,
      color: "#FFFFFF",
      align: "left",
      lineHeight: 1.3,
    },
  ],
};

export default template;
