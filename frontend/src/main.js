import { createRouter } from "./router.js";
import { mountHomePage } from "./pages/home.js";
import { mountLoadingPage } from "./pages/loading.js";
import { mountClosetPage } from "./pages/closet.js";
import { mountCreditsPage } from "./pages/credits.js";

const router = createRouter([
  { path: "/home", element: "#home-screen", mount: mountHomePage },
  { path: "/loading", element: "#loading-screen", mount: mountLoadingPage },
  { path: "/closet", element: "#closet-screen", mount: mountClosetPage },
  { path: "/credits", element: "#credits-screen", mount: mountCreditsPage },
]);

router.start();
