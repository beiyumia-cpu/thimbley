export function mountCreditsPage({ navigate }) {
  const backButton = document.querySelector("#back-to-closet");
  const handleBack = () => navigate("/closet");

  backButton.addEventListener("click", handleBack);

  return () => backButton.removeEventListener("click", handleBack);
}
