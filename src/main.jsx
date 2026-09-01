import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <App />,
//   }
// ])

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
  // <RouterProvider router={router} />
);
