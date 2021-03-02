// Setting variable for database
var db;

// Creating request to open budget database
var request = indexedDB.open('budget', 1);

// Request for error event in case of error(s)
request.onerror = function (event) {
    console.log("ERROR! " + event.target.errorCode);
};

// Request for success event if no errors
request.onsuccess = function (event) {
    db = event.target.result;
    // checking if app is online before reading from database
    if (navigator.onLine) {
        checkDatabase();
    }
};

// Creating object store for database called "pending" and set autoIncrement to true
request.onupgradeneeded = function (event) {
    var db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

// Creating function to save record to database
function saveRecord(record) {
    // creates a transaction on the pending database using readwrite access
    var transaction = db.transaction(["pending"], "readwrite");

    // accesses pending object store
    var store = transaction.objectStore("pending");

    // adds records to store
    store.add(record);
}

// Creating function to check database 
function checkDatabase() {
    // opens a transaction on the pending database
    var transaction = db.transaction(["pending"], "readwrite");
    // accesses the pending object store
    var store = transaction.objectStore("pending");
    // getting all records from store and setting as a variable
    var getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(() => {
                    // upon success, opens a transaction on the pending database
                    var transaction = db.transaction(["pending"], "readwrite");

                    // accesses the pending object store
                    var store = transaction.objectStore("pending");

                    // clears all records in store
                    store.clear();
                });
        }
    };
}

// eventlistener for when app comes online
window.addEventListener("online", checkDatabase);