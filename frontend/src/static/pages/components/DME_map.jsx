{/*
    refer to this tutorial: https://youtu.be/rg75SAUQfHk?list=PLq48UVVjwoljP0tNV-bIihs5pe3dz4Trq
    reference usage: https://github.com/MONNNNNNNNNNN/project_webinteract/blob/main/shared/locations.js
*/}

{/*
    This is NOT DIRECTLY calling the API from google map, here we use the embeded
    url of the google map instead of calling the google map API (map API is not free)

    In this method... from dmeLocation.js fetch("https://maps.googleapis.com/maps/api/...") is not being called
    this means it is not API calling
*/}

import { LOCATIONS, directionsUrl } from "../../pages/components/dmeLocation.js";

export function ContactMap() {
    const dmeLocation = LOCATIONS.find((location) => location.id === "dme-lab") ?? LOCATIONS[0];
    
    if (!dmeLocation) {
        return (
            <section className="contact-map-error-section">
                <p className="contact-map-error-message">
                    The location information is unavailable
                </p>
            </section>
        );
    }

    return (
        <section className="contact-map-section">
            {/* Embedded another HTML document or external web inside this page */}
            {/* From what I search, iframe is good for googlemap*/}
            <iframe className="contact-map-iframe" src={dmeLocation.mapEmbed} title={`${dmeLocation.fullName} map`}  loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />

            <a className="contact-map-direction-link" href={directionsUrl(dmeLocation)} target="_blank" rel="noreferrer">
                Get direction 
            </a>
        
        </section>
    );
}