/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** ที่อยู่หลังบ้าน เช่น http://127.0.0.1:8010 ไม่ต้องมี / ท้าย */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
