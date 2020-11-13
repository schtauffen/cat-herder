import typescript from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import pkg from "./package.json";

// const extensions = [".js", ".ts"];
const input = "src/index.ts";

const plugins = [
  commonjs(),
  typescript({
    typescript: require("typescript"),
  }),
];

export default [
  {
    input,
    output: {
      file: pkg.module,
      format: "esm",
      sourcemap: true,
    },
    plugins,
  },
  {
    input,
    output: {
      file: pkg.main,
      format: "cjs",
      sourcemap: true,
    },
    plugins,
  },
  {
    input,
    output: {
      name: "CatHerder",
      file: pkg.umd,
      format: "umd",
      sourcemap: true,
    },
    plugins: [
      commonjs(),
      nodeResolve(),
      typescript({
        typescript: require("typescript"),
      }),
    ],
  },
];
