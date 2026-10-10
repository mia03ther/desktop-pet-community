import React from "react";
import { createRoot } from "react-dom/client";
import { StudioApp } from "./studio/StudioApp.js";

const root = document.getElementById("root");
if (!root) throw new Error("工作室挂载节点缺失。");
createRoot(root).render(<React.StrictMode><StudioApp /></React.StrictMode>);
