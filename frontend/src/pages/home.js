export function mountHomePage({ navigate }) {
  const startButton = document.querySelector("#start-button");
  const handleStart = () => navigate("/loading");

  startButton.addEventListener("click", handleStart);

  return () => startButton.removeEventListener("click", handleStart);
}
