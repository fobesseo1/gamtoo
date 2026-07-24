import type { PosterTemplate } from "../../types";

const template: PosterTemplate = {
  schemaVersion: 1,
  id: "photo-frame-polaroid",
  name: "폴라로이드",
  category: "photo-noremovebg",
  canvasSize: { width: 1080, height: 1350 },
  backgroundColor: "#EDEDED",
  layers: [
    {
      id: "bg",
      type: "background",
      zIndex: 0,
      position: { x: 0, y: 0, width: 1080, height: 1350 },
      color: "#EDEDED",
    },
    {
      id: "frame",
      type: "decoration",
      zIndex: 1,
      position: { x: 120, y: 160, width: 840, height: 980 },
      extraProps: { shape: "rect", color: "#FFFFFF", shadow: true },
    },
    {
      id: "photo",
      type: "image",
      zIndex: 2,
      position: { x: 160, y: 200, width: 760, height: 760 },
      imageSlot: "userPhoto",
      fit: "cover",
    },
    {
      id: "caption",
      type: "text",
      zIndex: 3,
      position: { x: 160, y: 1000, width: 760, height: 100 },
      textField: "userText",
      fontFamily: "cursive",
      fontSize: 34,
      color: "#333333",
      align: "center",
    },
    {
      id: "date",
      type: "text",
      zIndex: 3,
      position: { x: 160, y: 1080, width: 760, height: 60 },
      textField: "date",
      fontSize: 22,
      color: "#777777",
      align: "center",
    },
  ],
};

export default template;
