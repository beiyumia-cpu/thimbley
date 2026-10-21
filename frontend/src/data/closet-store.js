const databasePromise = new Promise((resolve, reject) => {
  const request = indexedDB.open("thimbley-closet", 1);

  request.onupgradeneeded = () => {
    request.result.createObjectStore("items", { keyPath: "id" });
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

function runTransaction(mode, operation) {
  return databasePromise.then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction("items", mode);
    const request = operation(transaction.objectStore("items"));
    let result;

    request.onsuccess = () => {
      result = request.result;
    };

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error("The closet could not be saved."));
  }));
}

export function getItems() {
  return runTransaction("readonly", (store) => store.getAll());
}

export function saveItem(item) {
  return runTransaction("readwrite", (store) => store.put(item));
}

export function deleteItem(id) {
  return runTransaction("readwrite", (store) => store.delete(id));
}
