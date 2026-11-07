// import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react";
// import { dirname, resolve } from "node:path";
// import { fileURLToPath } from "node:url";

// export default defineConfig(({ mode }) => {
//   const frontendRoot = dirname(fileURLToPath(import.meta.url));
//   const projectRoot = resolve(frontendRoot, "..");
//   const rootEnv = loadEnv(mode, projectRoot, "PORT");
//   const localEnv = loadEnv(mode, frontendRoot, "VITE_");
//   const backendOrigin =
//     localEnv.VITE_BACKEND_ORIGIN || `http://localhost:${rootEnv.PORT || "3000"}`;

//   return {
//     plugins: [
//       react(),
//       {
//         name: "admin-login-url",
//         configureServer(server) {
//           server.httpServer?.once("listening", () => {
//             const address = server.httpServer.address();
//             if (!address || typeof address === "string") return;
//             const configuredHost = server.config.server.host;
//             const hostname = configuredHost && !["0.0.0.0", "::"].includes(configuredHost)
//               ? configuredHost
//               : "localhost";
//             console.log(`Admin sign-in: http://${hostname}:${address.port}/admin`);
//           });
//         },
//       },
//     ],
//     server: {
//       host: "127.0.0.1",
//       proxy: {
//         "/v1": { target: backendOrigin, changeOrigin: true },
//         "/health": { target: backendOrigin, changeOrigin: true },
//       },
//     },
//   };
// });
// import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react";
// import { dirname, resolve } from "node:path";
// import { fileURLToPath } from "node:url";

// export default defineConfig(({ mode }) => {
//   const frontendRoot = dirname(fileURLToPath(import.meta.url));
//   const projectRoot = resolve(frontendRoot, "..");
//   const localEnv = loadEnv(mode, frontendRoot, "VITE_");
  
//   // Updated to point to your Render backend
//   const backendOrigin = "https://e-com-rvs2.onrender.com";

//   return {
//     plugins: [
//       react(),
//       {
//         name: "admin-login-url",
//         configureServer(server) {
//           server.httpServer?.once("listening", () => {
//             const address = server.httpServer.address();
//             if (!address || typeof address === "string") return;
//             const configuredHost = server.config.server.host;
//             const hostname = configuredHost && !["0.0.0.0", "::"].includes(configuredHost)
//               ? configuredHost
//               : "localhost";
//             console.log(`Admin sign-in: http://${hostname}:${address.port}/admin`);
//           });
//         },
//       },
//     ],
//     server: {
//       host: "127.0.0.1",
//       proxy: {
//         "/v1": { target: backendOrigin, changeOrigin: true },
//         "/health": { target: backendOrigin, changeOrigin: true },
//       },
//     },
//   };
// });


import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const frontendRoot = dirname(fileURLToPath(import.meta.url));
  const projectRoot = resolve(frontendRoot, "..");
  const localEnv = loadEnv(mode, frontendRoot, "VITE_");
  
  const backendOrigin = "https://e-com-rvs2.onrender.com";

  return {
    plugins: [
      react(),
      {
        name: "admin-login-url",
        configureServer(server) {
          server.httpServer?.once("listening", () => {
            const address = server.httpServer.address();
            if (!address || typeof address === "string") return;
            const configuredHost = server.config.server.host;
            const hostname = configuredHost && !["0.0.0.0", "::"].includes(configuredHost)
              ? configuredHost
              : "localhost";
            console.log(`Admin sign-in: http://${hostname}:${address.port}/admin`);
          });
        },
      },
    ],
    server: {
      host: "127.0.0.1",
      proxy: {
        "/v1": { target: backendOrigin, changeOrigin: true },
        "/health": { target: backendOrigin, changeOrigin: true },
      },
    },
  };
});