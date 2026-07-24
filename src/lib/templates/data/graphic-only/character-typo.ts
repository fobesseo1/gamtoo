import type { PosterTemplate } from "../../types";

const template: PosterTemplate = {
  schemaVersion: 1,
  id: "graphic-character-typo",
  name: "캐릭터 인용구",
  category: "graphic-only",
  canvasSize: { width: 1080, height: 1350 },
  backgroundColor: "#FDE8D8",
  layers: [
    {
      id: "bg",
      type: "background",
      zIndex: 0,
      position: { x: 0, y: 0, width: 1080, height: 1350 },
      color: "#FDE8D8",
    },
    {
      id: "character",
      type: "decoration",
      zIndex: 1,
      position: { x: 240, y: 120, width: 600, height: 600 },
      useRandomCharacter: true,
    },
    {
      id: "quote",
      type: "text",
      zIndex: 2,
      position: { x: 80, y: 800, width: 920, height: 300 },
      textField: "userText",
      fontSize: 48,
      fontWeight: 800,
      color: "#3A2A1A",
      align: "center",
      lineHeight: 1.3,
    },
    {
      id: "date",
      type: "text",
      zIndex: 2,
      position: { x: 80, y: 1220, width: 920, height: 60 },
      textField: "date",
      fontSize: 24,
      color: "#8A6A4A",
      align: "center",
    },
  ],
};

export default template;
