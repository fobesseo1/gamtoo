import type { PosterTemplate } from "../../types";

const template: PosterTemplate = {
  schemaVersion: 1,
  id: "graphic-minimal-quote",
  name: "타이포 포스터",
  category: "graphic-only",
  canvasSize: { width: 1080, height: 1350 },
  backgroundColor: "#111111",
  layers: [
    {
      id: "bg",
      type: "background",
      zIndex: 0,
      position: { x: 0, y: 0, width: 1080, height: 1350 },
      color: "#111111",
    },
    {
      id: "quote",
      type: "text",
      zIndex: 1,
      position: { x: 80, y: 320, width: 920, height: 600 },
      textField: "userText",
      fontSize: 64,
      fontWeight: 900,
      color: "#FFFFFF",
      align: "left",
      lineHeight: 1.2,
    },
    {
      id: "character",
      type: "decoration",
      zIndex: 2,
      position: { x: 860, y: 1140, width: 160, height: 160 },
      useRandomCharacter: true,
    },
    {
      id: "date",
      type: "text",
      zIndex: 2,
      position: { x: 80, y: 1200, width: 400, height: 60 },
      textField: "date",
      fontSize: 24,
      color: "#999999",
      align: "left",
    },
  ],
};

export default template;
