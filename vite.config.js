import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" にしておくと、GitHub Pages のプロジェクトサイト
// (https://ユーザー名.github.io/リポジトリ名/) 配下でもそのまま動く
export default defineConfig({
  plugins: [react()],
  base: "./",
});
