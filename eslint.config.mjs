import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // 排除不需要檢查的目錄和文件
    ignores: [
      ".next/**", 
      "node_modules/**",
      "**/*.min.js",
      "**/dist/**"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 從.eslintrc.json移植的規則
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      
      // 添加其他優化規則
      "react-hooks/exhaustive-deps": "warn", // 檢查useEffect依賴項
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_", 
        "varsIgnorePattern": "^_" 
      }], // 忽略以_開頭的未使用變數
      "jsx-a11y/alt-text": "error", // 強制要求alt文本提高可訪問性
    }
  }
];

export default eslintConfig;
