/**
 * Common database helper functions.
 */
if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
}

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Create IDB
   **/

  static openDB(dbOpen){
    // Makes sure indexedDB works across different browsers
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
  
    // Open (or create) restaurant database
    return indexedDB.open("restaurantDB", 1);
  }

  static createDB(restaurants) {
    var dbPromise = DBHelper.openDB();

    dbPromise.onupgradeneeded = function() {
      var db = dbPromise.result;
      var store = db.createObjectStore("RestaurantObjectStore", {keyPath: "id"});
      var index = store.createIndex("by-id", "id");
    }

    dbPromise.onerror = function() {
      console.log("could not create indexedDB");
    }

    dbPromise.onsuccess = function() {
      // Start a new DB transaction
      var db = dbPromise.result;
      var tx = db.transaction("RestaurantObjectStore", "readwrite");
      var store = tx.objectStore("RestaurantObjectStore");

      // Store restaurants in DB
      restaurants.forEach(function(restaurant){
        store.put(restaurant);
        // console.log("added restaurant: " + restaurant.id);
      });

      // Close the db when the transaction is done
      tx.oncomplete = function(event) {
        // console.log("transaction complete: " + event)
          db.close();
      };
    }
  }
  
  static getCachedData(callback){
    // Start a new DB transaction
    var dbPromise = DBHelper.openDB();
    dbPromise.onsuccess = function() {
      var db = dbPromise.result;
      var tx = db.transaction("RestaurantObjectStore", "readwrite");
      var store = tx.objectStore("RestaurantObjectStore");

      // get cached restaurants from DB
      var cached = store.getAll();

      cached.onsuccess = () => {
        callback(null, cached.result);
      }

      // Close the db when the transaction is done
      tx.oncomplete = function() {
          db.close();
      };
    }
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();

    if(navigator.onLine) {
      xhr.open('GET', DBHelper.DATABASE_URL);
    
      xhr.onload = function() {
        if (xhr.status === 200) { // Got a success response from server!
          const restaurantsJSON = JSON.parse(xhr.responseText);
          DBHelper.createDB(restaurantsJSON); // Cache restaurant in IDB
          callback(null, restaurantsJSON);
        } else { // Oops!. Got an error from server.
          const error = (`Request failed. Returned status of ${xhr.status}`);
          callback(error, null);
        }
      };
      xhr.send();
    } else {
      console.log("Unable to reach server. Currently using cached data.")
      DBHelper.getCachedData(function(error, restaurants){
        if(restaurants.length > 0){          
          callback(null, restaurants);
        }
      })
    }
    
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
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
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
    return (`/img/${restaurant.id}.jpg`);
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

}

let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error("Can't fetch neightborhoods" + error);
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

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      setLazyLoadImage();
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

let restaurantImage = (restaurant) => {
  const image = document.createElement('img');
  image.className = 'restaurant-img lazy-img';
  image.alt = `${restaurant.name} profile photo`;

  const defaultImage = DBHelper.imageUrlForRestaurant(restaurant);
  if (defaultImage) {
    const withoutExtensions = defaultImage.replace(/\.[^/.]+$/, '');
    // image.sizes = '28vw';
    image.src = `${withoutExtensions}.jpg`;
    image.srcset = `${withoutExtensions}_250.webp 250w, ${withoutExtensions}_150.webp 150w`;
    image.classList.add('lazy-img');
  }
  return image;
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const article = document.createElement('article');
  article.setAttribute('role','navigation')
  li.append(article);

  // article.append(restaurantImage(restaurant));
  const defaultImage = DBHelper.imageUrlForRestaurant(restaurant);
  const image = document.createElement('img');
  const withoutExtensions = defaultImage.replace(/\.[^/.]+$/, '');
  image.alt = `${restaurant.name} profile photo`;
  image.className = 'restaurant-img lazy-img';
  image.src = `${withoutExtensions}.webp`;
  image.datasrc = `${withoutExtensions}.webp`;
  // image.srcset = `${withoutExtensions}-1x.jpg`;
  article.append(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  article.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  article.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  article.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View ' + restaurant.name;
  more.href = DBHelper.urlForRestaurant(restaurant);
  article.append(more)

  return li
}

/**
 * Set up lazy load images using Image Observer
 */


let setLazyLoadImage = () => {
  let lazyImages = [].slice.call(document.querySelectorAll('img.lazy-img'));

  if ("IntersectionObserver" in window && "IntersectionObserverEntry" in window && "intersectionRatio" in window.IntersectionObserverEntry.prototype) {
    lazyImages.forEach(lazyImage => lazyImageObserver.observe(lazyImage));
  }  else {
    console.log('~~~~~~~~~~~~~~~~~ no IntersectionObserver ~~~~~~~~~~~~~~~~~');
    return;
  }
}

let lazyImageObserver = new IntersectionObserver( entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      let lazyImage = entry.target;
      // lazyImage.src = lazyImage.dataset.src;
      // lazyImage.srcset = lazyImage.dataset.srcset;
      lazyImage.classList.remove('lazy-img');
      lazyImageObserver.unobserve(lazyImage);
    }
  });


});

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

document.addEventListener('DOMContentLoaded', (event) => {
  lazyLoadImages();
});
/**
 * Lazy load images
 */
lazyLoadImages = () => {
  var lazyImages = [].slice.call(document.querySelectorAll(".lazy-img"));

  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // Possibly fall back to a more compatible method here
  }
}
let restaurant;
var map;


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      console.log('there"s a map!');
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      fillMetaDesc();
      callback(null, restaurant)
    });
  }
}

/**
 * Add meta description to page
 */
fillMetaDesc = (restaurant = self.restaurant) => {
  document.querySelector('meta[name=description]').setAttribute("content",restaurant.name);
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.setAttribute('aria-label','restaurant name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.setAttribute('aria-label','restaurant address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.name + ' Profile Image';
  // image.setAttribute("srcset", "");

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.setAttribute('aria-label','cuisine type');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('th');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.setAttribute('id','reviews-header');
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex','0');
  
  const art = document.createElement('article');
  art.setAttribute('role','article');
  art.setAttribute('aria-label','review by '+review.name);
  li.append(art);

  const rev = document.createElement('div');
  rev.className = 'review-title';
  art.appendChild(rev);

  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.className = 'reviewer';
  art.setAttribute('aria-label','reviewer');
  rev.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  date.className = 'reviewDate';
  date.setAttribute('aria-label','review date');
  rev.appendChild(date);

  const ratingDiv = document.createElement('div');
  ratingDiv.className = 'rating';
  art.appendChild(ratingDiv);

  const rating = document.createElement('p');
  rating.className = 'ratings';
  rating.setAttribute('aria-label','rating');
  rating.innerHTML = `Rating: ${review.rating}`;
  ratingDiv.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'comments';
  comments.innerHTML = review.comments;
  comments.setAttribute('aria-label','comment');
  art.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.setAttribute('aria-current','page');
  link.href = '#';
  link.innerHTML = restaurant.name;
  li.append(link);
  // li.innerHTML = '<a href="#" aria-current="page">'+restaurant.name+'</a>';
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js', {scope: '/'})
        .then(function(reg){
            console.log('Service worker registration succeeded.');
        }).catch(function(error){
            console.log('Registration failed with ' + error);
        });
    });
}