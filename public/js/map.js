function initMap() {
  const mapElement = document.getElementById("map");

  // 1. Read and parse data from attributes.
  const coordinates = JSON.parse(mapElement.dataset.coordinates);
  const listingTitle = mapElement.dataset.title;

  // 2. Format location for Google Maps.
  const location = { lat: coordinates[1], lng: coordinates[0] };

  // 3. Create the map.
  const map = new google.maps.Map(mapElement, {
    zoom: 15,
    center: location,
  });

  // 4. Create the marker.
  const marker = new google.maps.Marker({
    position: location,
    map: map,
    title: listingTitle,
  });

  // 5. Determine the dynamic greeting based on the current time in India.
  const now = new Date();
  const timeInIndia = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: false, // Use 24-hour format for easier logic
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });

  const parts = timeInIndia.formatToParts(now).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  const currentHour = parseInt(parts.hour, 10);
  const formattedTime = `${parts.hour}:${parts.minute}:${parts.second}`;
  
  // Apply your custom time rules
  let greeting;
  if (currentHour < 12) {          // Before 12 PM
    greeting = "morning";
  } else if (currentHour < 16) {   // 12 PM to 4 PM (16:00)
    greeting = "afternoon";
  } else if (currentHour < 19) {   // 4 PM to 7 PM (19:00)
    greeting = "evening";
  } else {                         // After 7 PM
    greeting = "night";
  }

  // 6. Create the InfoWindow using the dynamic title and greeting.
  const infowindow = new google.maps.InfoWindow({
    content: `<p>Just imagine it's a beautiful ${greeting} here in ${listingTitle} around ${formattedTime}.</p>`,
  });

  marker.addListener("click", () => {
    infowindow.open(map, marker);
  });

  // 7. Add the Intersection Observer for the animation effect.
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        marker.setAnimation(google.maps.Animation.DROP);
        observer.unobserve(mapElement);
      }
    },
    {
      threshold: 0.5,
    }
  );
  observer.observe(mapElement);
}