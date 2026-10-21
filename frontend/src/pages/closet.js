import { deleteItem, getItems, saveItem } from "../data/closet-store.js";

const categories = ["tops", "pants", "skirts", "dresses", "accessories"];
const closetGrid = document.querySelector("#closet-grid");
const photoInput = document.querySelector("#photo-input");
const toast = document.querySelector("#toast");
const wornImages = Object.fromEntries(
  categories.map((category) => [category, document.querySelector(`#worn-${category}`)]),
);

let items = [];
let activeCategory = "tops";
let toastTimer;
let hasLoadedItems = false;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function renderCloset() {
  closetGrid.replaceChildren();
  const shownItems = items.filter((item) => item.category === activeCategory);
  const upload = document.createElement("button");

  upload.className = "upload-tile";
  upload.type = "button";
  upload.setAttribute("aria-label", "Upload photos to your closet");
  upload.innerHTML = '<span class="upload-icon" aria-hidden="true"></span><img src="assets/upload img text.png" alt="">';
  upload.addEventListener("click", () => photoInput.click());
  closetGrid.append(upload);

  for (const item of shownItems) {
    const card = document.createElement("article");
    const image = document.createElement("img");
    const name = document.createElement("span");
    const remove = document.createElement("button");

    card.className = `item-card${item.worn ? " selected" : ""}`;
    image.src = item.image;
    image.alt = item.name;
    image.loading = "lazy";
    name.className = "item-name";
    name.textContent = item.name;
    remove.className = "delete-item";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${item.name}`);
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      handleDelete(item);
    });
    card.append(image, name, remove);
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Try on ${item.name}`);
    card.addEventListener("click", () => wearItem(item));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        wearItem(item);
      }
    });
    closetGrid.append(card);
  }
}

async function handleDelete(item) {
  try {
    await deleteItem(item.id);
    items = items.filter((storedItem) => storedItem.id !== item.id);
    if (item.worn) clearWorn(item.category);
    renderCloset();
  } catch (error) {
    showToast(`Couldn't delete that item: ${error.message}`);
  }
}

function clearWorn(category) {
  wornImages[category].removeAttribute("src");
  wornImages[category].classList.remove("visible");
}

async function wearItem(item) {
  try {
    const outfitCategories = item.category === "accessories"
      ? []
      : ["tops", "pants", "skirts", "dresses"];
    const previous = items.filter((storedItem) =>
      storedItem.worn && (storedItem.category === item.category || outfitCategories.includes(storedItem.category)),
    );

    await Promise.all(previous.map((storedItem) => {
      storedItem.worn = false;
      return saveItem(storedItem);
    }));
    item.worn = true;
    await saveItem(item);
    items = items.map((storedItem) => ({
      ...storedItem,
      worn: storedItem.id === item.id
        ? true
        : previous.some((previousItem) => previousItem.id === storedItem.id) ? false : storedItem.worn,
    }));
    previous.forEach((storedItem) => clearWorn(storedItem.category));

    const wornImage = wornImages[item.category];
    wornImage.src = item.image;
    wornImage.alt = item.name;
    wornImage.classList.add("visible");
    renderCloset();
  } catch (error) {
    showToast(`Couldn't put that item on the doll: ${error.message}`);
  }
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      const maxSide = 720;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");

      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      try {
        resolve(canvas.toDataURL("image/webp", 0.78));
      } catch (error) {
        reject(new Error(`This image couldn't be prepared: ${error.message}`));
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name} couldn't be opened as an image.`));
    };
    image.src = url;
  });
}

async function addPhotos(fileList, uploadCategory) {
  let added = 0;

  for (const file of Array.from(fileList)) {
    if (!file.type.startsWith("image/")) {
      showToast(`${file.name} isn't an image, so it was skipped.`);
      continue;
    }
    if (file.size > 15 * 1024 * 1024) {
      showToast(`${file.name} is over 15 MB. Choose a smaller photo.`);
      continue;
    }

    try {
      const image = await readImage(file);
      const item = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, "").slice(0, 48) || "my new favorite",
        category: uploadCategory,
        image,
        worn: false,
      };

      await saveItem(item);
      items.push(item);
      added += 1;
    } catch (error) {
      showToast(`Couldn't add ${file.name}: ${error.message}`);
    }
  }

  renderCloset();
  if (added) showToast(`${added} ${added === 1 ? "piece is" : "pieces are"} tucked into your closet.`);
}

function chooseRandom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

async function randomizeOutfit(temperature, isRainy) {
  const available = (category) => items.filter((item) => item.category === category);
  const dresses = available("dresses");
  const tops = available("tops");
  const pants = available("pants");
  const skirts = available("skirts");
  const bottoms = [...pants, ...skirts];
  const picked = [];
  const isCold = temperature !== null && temperature < 12;
  const isWarm = temperature !== null && temperature >= 25;
  const preferDress = isWarm ? Math.random() < 0.75 : Math.random() < 0.5;

  if (dresses.length && (!tops.length || (preferDress && !isCold))) {
    picked.push(chooseRandom(dresses));
  } else {
    if (tops.length) picked.push(chooseRandom(tops));
    const preferredBottoms = isRainy || isCold
      ? (pants.length ? pants : bottoms)
      : isWarm ? (skirts.length ? skirts : bottoms) : bottoms;
    if (preferredBottoms.length) picked.push(chooseRandom(preferredBottoms));
  }

  const accessories = available("accessories");
  if (accessories.length && Math.random() < 0.65) picked.push(chooseRandom(accessories));
  if (picked.length === 0) picked.push(chooseRandom(items));

  try {
    await Promise.all(items.filter((item) => item.worn).map((item) => {
      item.worn = false;
      return saveItem(item);
    }));
    await Promise.all(picked.map((item) => {
      item.worn = true;
      return saveItem(item);
    }));

    for (const category of categories) clearWorn(category);
    for (const item of picked) {
      const image = wornImages[item.category];
      image.src = item.image;
      image.alt = item.name;
      image.classList.add("visible");
    }
    items = items.map((item) => ({ ...item, worn: picked.some((pickedItem) => pickedItem.id === item.id) }));
    renderCloset();
    const weatherTip = temperature === null ? "" : ` It's ${toFahrenheit(temperature)}°F where you are.`;
    showToast(`A little outfit picked just for you!${weatherTip}`);
  } catch (error) {
    showToast(`Couldn't save this outfit: ${error.message}`);
  }
}

function toFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

async function getWeather() {
  const storedLocation = localStorage.getItem("thimbley-location");
  let location;

  if (storedLocation) {
    location = JSON.parse(storedLocation);
  } else {
    if (!navigator.geolocation) throw new Error("Location isn't available in this browser.");
    location = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
        () => reject(new Error("Location was not shared. You can still randomize an outfit without weather.")),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
      );
    });
    localStorage.setItem("thimbley-location", JSON.stringify(location));
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: "temperature_2m,precipitation,weather_code",
    temperature_unit: "celsius",
  }).toString();
  const response = await fetch(url);

  if (!response.ok) throw new Error("The weather service couldn't be reached.");
  const data = await response.json();

  return {
    temperature: data.current.temperature_2m,
    isRainy: data.current.precipitation > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(data.current.weather_code),
  };
}

async function handleRandomize() {
  if (items.length === 0) {
    showToast("Add a few favorite pieces first, and then I'll make you an outfit!");
    return;
  }

  try {
    const weather = await getWeather();
    document.querySelector("#weather-label").textContent = `${toFahrenheit(weather.temperature)}°F today`;
    document.querySelector("#weather-attribution").hidden = false;
    await randomizeOutfit(weather.temperature, weather.isRainy);
  } catch (error) {
    document.querySelector("#weather-label").textContent = "Weather unavailable";
    document.querySelector("#weather-attribution").hidden = true;
    showToast(`${error.message} Picking a just-for-fun outfit instead.`);
    await randomizeOutfit(null, false);
  }
}

export function mountClosetPage({ navigate }) {
  const homeButton = document.querySelector("#home-button");
  const creditsButton = document.querySelector("#credits-button");
  const randomizeButton = document.querySelector("#randomize-button");
  const categoryTabs = document.querySelectorAll(".category-tab");

  const handleHome = () => navigate("/home");
  const handleCredits = () => navigate("/credits");
  const handleRandomizeClick = () => randomizeOutfitForWeather();
  const handleCategoryChange = (event) => {
    const tab = event.currentTarget;
    activeCategory = tab.dataset.category;
    categoryTabs.forEach((categoryTab) => {
      const isActive = categoryTab === tab;
      categoryTab.classList.toggle("active", isActive);
      categoryTab.setAttribute("aria-pressed", String(isActive));
    });
    renderCloset();
  };
  const handlePhotoChange = async () => {
    await addPhotos(photoInput.files, activeCategory);
    photoInput.value = "";
  };

  async function randomizeOutfitForWeather() {
    await handleRandomize();
  }

  homeButton.addEventListener("click", handleHome);
  creditsButton.addEventListener("click", handleCredits);
  randomizeButton.addEventListener("click", handleRandomizeClick);
  categoryTabs.forEach((tab) => tab.addEventListener("click", handleCategoryChange));
  photoInput.addEventListener("change", handlePhotoChange);

  if (!hasLoadedItems) {
    hasLoadedItems = true;
    getItems().then((storedItems) => {
      items = storedItems;
      renderCloset();
      for (const item of items) {
        if (!item.worn) continue;
        const image = wornImages[item.category];
        if (image) {
          image.src = item.image;
          image.alt = item.name;
          image.classList.add("visible");
        }
      }
    }).catch((error) => showToast(`Browser storage couldn't be opened. Your new items may not be saved: ${error.message}`));
  } else {
    renderCloset();
  }

  return () => {
    homeButton.removeEventListener("click", handleHome);
    creditsButton.removeEventListener("click", handleCredits);
    randomizeButton.removeEventListener("click", handleRandomizeClick);
    categoryTabs.forEach((tab) => tab.removeEventListener("click", handleCategoryChange));
    photoInput.removeEventListener("change", handlePhotoChange);
  };
}
