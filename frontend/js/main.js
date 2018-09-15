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
  updateRestaurants();
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
      setLazyLoadMap();
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
  // addMarkersToMap();
}

let createImg = (restaurant) => {
  const image = document.createElement('img');
  image.className = 'restaurant-img lazy-img';
  image.alt = `${restaurant.name} profile photo`;

  const defaultImage = DBHelper.imageUrlForRestaurant(restaurant);
  if (defaultImage) {
    const withoutExtensions = defaultImage.replace(/\.[^/.]+$/, '');
    image.dataset.src = `${withoutExtensions}.webp`;
    image.dataset.srcset = `${withoutExtensions}_250.webp 250w, ${withoutExtensions}_150.webp 150w`;
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

  article.append(createImg(restaurant));

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
      lazyImage.src = lazyImage.dataset.src;
      // lazyImage.srcset = lazyImage.dataset.srcset;
      lazyImage.classList.remove('lazy-img');
      lazyImageObserver.unobserve(lazyImage);
    }
  });
});


/**
 * Initialize Google map, called from HTML.
 */

initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  // updateRestaurants();
  addMarkersToMap();
}

let setLazyLoadMap = () => {
  let lazyMap = document.getElementById('map');

  if ("IntersectionObserver" in window && "IntersectionObserverEntry" in window && "intersectionRatio" in window.IntersectionObserverEntry.prototype) {
    lazyMapObserver.observe(lazyMap);
  }  else {
    console.log('~~~~~~~~~~~~~~~~~ no IntersectionObserver ~~~~~~~~~~~~~~~~~');
    return;
  }
}

let lazyMapObserver = new IntersectionObserver( entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
    let lazyMap = entry.target;
    var mapsJS = document.createElement('script');
    mapsJS.src = 'https://maps.googleapis.com/maps/api/js?callback=initMap&key=AIzaSyDEwOJQAdsxaQFqXkFTvxAWQaOkF_j4Lo8';
    document.getElementsByTagName('head')[0].appendChild(mapsJS)
    lazyMapObserver.unobserve(lazyMap);
  }
  })
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
