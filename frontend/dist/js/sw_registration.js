// register service worker
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', function() {
//         navigator.serviceWorker.register('sw.js', {scope: 'dist/'})
//         .then(function(reg){
//             console.log('Service worker registration succeeded.');
//         }).catch(function(error){
//             console.log('Registration failed with ' + error);
//         });
//     });
// }


const registerServiceWorker = () => {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('sw.js', {
			scope: './'
		}).then((registration) => {
      var serviceWorker;
      if (registration.installing) {
          serviceWorker = registration.installing;
          console.log('installing cache');
      } else if (registration.waiting) {
          serviceWorker = registration.waiting;
          console.log('cache waiting');
      } else if (registration.active) {
          serviceWorker = registration.active;
          console.log('cache active');
      }
      if (serviceWorker) {
          serviceWorker.addEventListener('statechange', function (e) {
              console.log(e.target.state);
          });
      }
    }).catch(error => {
      console.log("register sw error: " + error);
    });
	}
}

registerServiceWorker();