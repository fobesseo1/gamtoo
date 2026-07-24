import type { PosterTemplate } from "../../types";

const template: PosterTemplate = {
  schemaVersion: 1,
  id: "graphic-sticker-grid",
  name: "스티커 라벨",
  category: "graphic-only",
  canvasSize: { width: 1080, height: 1350 },
  backgroundColor: "#FFE066",
  layers: [
    {
      id: "bg",
      type: "background",
      zIndex: 0,
      position: { x: 0, y: 0, width: 1080, height: 1350 },
      color: "#FFE066",
    },
    {
      id: "label",
      type: "decoration",
      zIndex: 1,
      position: { x: 140, y: 100, width: 800, height: 140 },
      extraProps: { shape: "pill", color: "#111111" },
    },
    {
      id: "label-text",
      type: "text",
      zIndex: 2,
      position: { x: 140, y: 130, width: 800, height: 90 },
      textField: "userText",
      fontSize: 34,
      fontWeight: 700,
      color: "#FFE066",
      align: "center",
    },
    {
      id: "character",
      type: "decoration",
      zIndex: 1,
      position: { x: 190, y: 400, width: 700, height: 700 },
      useRandomCharacter: true,
    },
    {
      id: "date-badge",
      type: "decoration",
      zIndex: 2,
      position: { x: 780, y: 1180, width: 220, height: 100 },
      extraProps: { shape: "pill", color: "#111111" },
    },
    {
      id: "date",
      type: "text",
      zIndex: 3,
      position: { x: 780, y: 1205, width: 220, height: 60 },
      textField: "date",
      fontSize: 24,
      fontWeight: 700,
      color: "#FFE066",
      align: "center",
    },
  ],
};

export default template;
