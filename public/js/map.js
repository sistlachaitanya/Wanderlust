function initMap() {
  const mapElement = document.getElementById("map");

  // 1. Read and parse the coordinates string from our data attribute.
  const coordinates = JSON.parse(mapElement.dataset.coordinates);

  // 2. GeoJSON is [lng, lat], but Google Maps needs {lat, lng}.
  const location = { lat: coordinates[1], lng: coordinates[0] };

  // 3. Create the map, centered instantly on the correct location.
  const map = new google.maps.Map(mapElement, {
    zoom: 15,
    center: location,
  });

  // 4. Create the marker, but without an animation initially.
  const marker = new google.maps.Marker({
    position: location,
    map: map,
    title: "Listing Location", // You can customize this title
  });

  // 5. Add a clickable InfoWindow for a better user experience.
  const infowindow = new google.maps.InfoWindow({
    content: `<p>Location of the listing. Just imagine it's a beautiful afternoon here in Secunderabad around ${new Date().toLocaleTimeString(
      "en-IN",
      { timeZone: "Asia/Kolkata" }
    )}.</p>`,
  });

  marker.addListener("click", () => {
    infowindow.open(map, marker);
  });

  // 6. ADD THE INTERSECTION OBSERVER for the animation effect.
  const observer = new IntersectionObserver(
    (entries) => {
      // This callback function runs when the map's visibility changes.
      if (entries[0].isIntersecting) {
        // If the map is on screen, trigger the drop animation.
        marker.setAnimation(google.maps.Animation.DROP);
        // Crucial: Stop observing so the animation doesn't re-trigger.
        observer.unobserve(mapElement);
      }
    },
    {
      // Trigger when 50% of the map is visible.
      threshold: 0.5,
    }
  );

  // Start watching the map element.
  observer.observe(mapElement);
}
