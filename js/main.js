let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  IDBHelper.databaseExists(dbName='restaurantsDb', function (yesno) {
    if (yesno) {
      console.log(dbName + " exists? " + yesno);
    } else {
      console.log(dbName + " exists? " + yesno);
      IDBHelper.createNewDatabase();
      IDBHelper.populateDatabase(IDBHelper.dbPromise);
    }
  });

  setTimeout(function() {
    fetchNeighborhoods();
    fetchCuisines();
  }, 3000)
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const fSelect = document.getElementById('fav');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const fValue = fSelect.checked;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  const favorite = fValue;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, favorite, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Image  ${restaurant.name}`;
  li.append(image);

  const name = document.createElement('h2');

  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  	const fav = document.createElement('img');
	fav.classList.add('fav');
	fav.id = restaurant.id;
		if(restaurant.is_favorite === true || restaurant.is_favorite === 'true'){
		fav.setAttribute('src', '/img/faved.png');
		fav.classList.add('faved');
	} else {
		fav.setAttribute('src', '/img/fav.png');
	}

	
	fav.onclick = function toggleFav() {
		
		if(this.classList.contains('fav')) {
			this.src = '/img/fav.png';
			this.classList.remove('fav');
			DBHelper.toggleFav(false, this.id);
		} else {
			this.src = '/img/faved.png';
			this.classList.add('fav');
			DBHelper.toggleFav(true, this.id);
		}
		console.log('Favorize toggled, mode is: ', this.classList.contains('fav') );
	};
		li.append(fav);
  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });

}
/**
add serverWorker
*/
registerServiceWorker = () => {
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', {scope: '/'})
      .then(reg => {
        console.log('sw on main page has been registered')
      }).catch(err => {
      console.log('sw registration fails')
    });
  });
}
};
