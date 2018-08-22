/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */

  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }
  
  static get dbPromise() {
    const dbPromise = idb.open('restaurantsDb', 1);
    return dbPromise;
  }
    static readAllIdbData(dbPromise) {	
    return dbPromise.then(db => {
      return db.transaction('restaurants')
        .objectStore('restaurants').getAll();
    })
  }
  
  static databaseExists(dbname, callback) {
    var req = indexedDB.open(dbname);
    var existed = true;
    req.onsuccess = function () {
      req.result.close();
      if (!existed)
        indexedDB.deleteDatabase(dbname);
      callback(existed);
    }
    req.onupgradeneeded = function () {
      existed = false;
    }
  }
  
      static insertEachTransaction(restaurant, dbPromise) {
    dbPromise.then(db => {
      let tx = db.transaction('restaurants', 'readwrite');
      let store = tx.objectStore('restaurants');
      store.add(restaurant);
      return tx.complete
    });
    console.log('item has been inserted');
    IDBHelper.populateReviews(restaurant.id, dbPromise);
  }
   static createNewDatabase() {
    idb.open('restaurantsDb', 1, function (upgradeDb) {
      if (!upgradeDb.objectStoreNames.contains('restaurants')) {
        upgradeDb.createObjectStore('restaurants', {keypath: 'id', autoIncrement: true});
      }
      console.log('restaurants has been created!');
    });
  };
  /**
   * Initialize data population
   */
  static populateDatabase(dbPromise) {
    fetch(DBHelper.DATABASE_URL)
      .then(res => res.json())
      .then(json => {
        json.map(restaurant => IDBHelper.populateRestaurantsWithReviews(restaurant, dbPromise))
      });
  };
  /**
   * Populate restaurants data including reviews
   */
  static populateRestaurantsWithReviews(restaurant, dbPromise) {
    let id = restaurant.id;
    fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`)
      .then(res => res.json())
      .then(restoReviews => dbPromise.then(
        db => {
          const tx = db.transaction('restaurants', 'readwrite');
          const store = tx.objectStore('restaurants');
          let item = restaurant;
          item.reviews = restoReviews;
          store.put(item);
          tx.complete;
        })
      )
  }
  /**
   * Fetch all restaurants.
   */
    static fetchRestaurants(callback) {
    IDBHelper.readAllIdbData(IDBHelper.dbPromise)
      .then(restaurants => { return callback(null, restaurants) });
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, favorite, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        if (favorite === true) { // filter by favorites
          results = results.filter(r => r.is_favorite == "true");
        }
        callback(null, results);
      }
    });
  }
 
  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }
  	static addReview(review, callback) {

		callback();

		if(!navigator.onLine){
			// store locally
			localStorage.setItem('review', review);
			console.log('Local Storage: Review stored');
		} else {
			IDBHelper.getAPIData('addReview', (data) => console.log(data), null, review);
			console.log('data sent to api');
		}
	}

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
	  if(!restaurant.photograph) restaurant.photograph = 10;
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }
  
  
  
  static openDatabase() {
    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open('restaurantDb', 1, function(upgradeDb){
      var store = upgradeDb.createObjectStore('restaurantDb', {
        keyPath: 'id'
      });
      store.createIndex('by-id', 'id');
    });
  }

  static saveToDatabase(data){
    return IDBHelper.openDatabase().then(function(db){
      if(!db) return;

      var tx = db.transaction('restaurants', 'readwrite');
      var store = tx.objectStore('restaurants');
      data.forEach(function(restaurant){
        store.put(restaurant);
      });
      return tx.complete;
    });
  }
  static deleteOldDatabase() {
    let DBDeleteRequest = window.indexedDB.deleteDatabase("restaurantsDb");
    DBDeleteRequest.onerror = function () {
      console.log("Error deleting database.");
    };
    DBDeleteRequest.onsuccess = function () {
      console.log("Old db successfully deleted!");
    };
  }
  static addRestaurantsFromAPI(){
    return fetch(IDBHelper.DATABASE_URL)
      .then(function(response){
        return response.json();
    }).then(restaurants => {
      IDBHelper.saveToDatabase(restaurants);
      return restaurants;
    });
  }
static saveOfflineReview(event, form) {
    event.preventDefault();
    const body = {
      "restaurant_id": parseInt(form.id.value),
      "name": form.dname.value,
      "rating": parseInt(form.drating.value),
      "comments": form.dreview.value,
      "updatedAt": parseInt(form.ddate.value),
      "flag": form.dflag.value,
    };
    IDBHelper.idbPostReview(form.id.value, body);
    location.reload();
  }
  static getCachedRestaurants() {
    return DBHelper.openDatabase().then(function(db){
      if(!db) return;

      var store = db.transaction('restaurants').objectStore('restaurants');
      return store.getAll();
    });
  }
 static idbToggleFavorite(id, condition) {
    IDBHelper.dbPromise.then(async db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      let val = await store.get(id) || 0;
      val.is_favorite = String(condition);
      store.put(val, id);
      return tx.complete;
    });
  }
  /**
   * add new review in idb restaurant review
   */
  static idbPostReview(id, body) {
    let key = parseInt(id);
    IDBHelper.dbPromise.then(async db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      let val = await store.get(key);
      val.reviews.push(body);
      store.put(val, key);
      return tx.complete;
    });
  }
	static toggleFav(id, condition) {
		fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=${condition}`, { method: 'POST' })
      .then(res => console.log('restaurant favorite has been updated'))
      .then(DBHelper.idbToggleFavorite(id, condition))
      .then(location.reload());
	};
}


