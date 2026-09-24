// The physical rooms the programme teaches in.
//
// Used by the Contact page (map + directions) and the 3D World page (walkthrough
// picker). One definition rather than two, because the moment they disagree the
// map sends a visitor to a different floor than the label promises.
//
// On the map fields: `mapEmbed` comes from Google Maps' own Share -> Embed a map,
// and the opaque `pb` string carries a place ID. That matters — an embed built
// from bare coordinates makes Google reverse-geocode the point, and for the CDLC
// it resolved to "Lomalan Coffee", the nearest business. Coordinates identify a
// spot; only the place ID identifies the place.
//
// `mapDestination` is a name rather than a place ID because the directions URL
// (`?api=1`) expects a ChIJ-style ID, while the embed exposes only the older
// 0x... form. Naming the place makes Google resolve it correctly; both names
// below were checked by opening the URL and reading the destination field.

export const LOCATIONS = [
  {
    id: "cdlc",
    name: "CDLC",
    fullName: "Creative Digital Learning Center",
    building: "Phiawijit Building",
    floor: "2nd floor",
    blurb:
      "Mac desktops with the production software used across the programme — 3D, video and audio work all happen here.",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d495.3344153240752!2d102.82312442027947!3d16.472300533294014!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31228a8be5184eb5%3A0x7316d55af70bec92!2z4LiV4Li24LiB4LmA4Lie4Li14Lii4Lij4Lin4Li04LiI4Li04LiV4LijIOC4hOC4k-C4sOC4p-C4tOC4qOC4p-C4geC4o-C4o-C4oeC4qOC4suC4quC4leC4o-C5jCDguKHguKvguLLguKfguLTguJfguKLguLLguKXguLHguKLguILguK3guJnguYHguIHguYjguJk!5e1!3m2!1sen!2sth!4v1788425549528!5m2!1sen!2sth",
    mapDestination: "ตึกเพียรวิจิตร คณะวิศวกรรมศาสตร์ มหาวิทยาลัยขอนแก่น",
    mapPlace: "https://maps.app.goo.gl/wcvcusCcbYPBwi28A",
    modelUrl: "/3d/Base_floor_model.glb",
  },
  {
    id: "dme-lab",
    name: "DME Lab",
    fullName: "Digital Media Engineering Lab",
    building: "Department of Computer Engineering",
    floor: "4th floor",
    blurb: "The Digital Media Engineering lab, in the Computer Engineering building.",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1329.989489982757!2d102.8236987379223!3d16.472776976272165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31228a8b77f56587%3A0x2a7f9799ab4e99ad!2sDepartment%20of%20Computer%20Engineering!5e1!3m2!1sen!2sth!4v1788426490383!5m2!1sen!2sth",
    mapDestination: "Department of Computer Engineering Khon Kaen University",
    mapPlace: null,
    // No walkthrough yet. The 3D World page reads this and shows an explicit
    // "not scanned yet" state rather than quietly reusing the CDLC model under
    // a different name, which would be a lie a visitor could not detect.
    // Drop a .glb into public/3d/ and set the path here to enable it.
    modelUrl: null,
  },
];

/** "https://www.google.com/maps/dir/?api=1&destination=..." — no origin, so Google routes from the user. */
export function directionsUrl(location) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.mapDestination)}`;
}