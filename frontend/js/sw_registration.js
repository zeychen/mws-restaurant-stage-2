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