import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import axios from 'axios';
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import markerIconPng from "leaflet/dist/images/marker-icon.png";

const MyMap = () => {
    const [currentLocation, setCurrentLocation] = useState("");
    const [destination, setDestination] = useState("");
    const [route, setRoute] = useState([]);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");

    const handleRoute = async () => {
        const startCoords = await geocodeLocation(currentLocation);
        const endCoords = await geocodeLocation(destination);

        if (startCoords && endCoords) {
            setRoute([startCoords, endCoords]);
            await getRouteFromOSRM(startCoords, endCoords);
            setErrorMessage(""); 
        } else {
            setErrorMessage("Please enter valid locations!"); 
        }
    };

    const geocodeLocation = async (location) => {
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: location,
                    format: "json",
                    limit: 1
                }
            });

            if (response.data.length > 0) {
                const { lat, lon } = response.data[0];
                return [lat, lon];
            }
        } catch (error) {
            console.error(error);
        }
        return null;
    };

    const customIcon = L.icon({
        iconUrl: markerIconPng,
        iconSize: [30, 50],
        iconAnchor: [15, 50]
    });

    const getRouteFromOSRM = async (start, end) => {
        try {
            const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}`, {
                params: {
                    overview: "full",
                    geometries: "geojson"
                }
            });
            if (response.data.routes.length > 0) {
                const coordinates = response.data.routes[0].geometry.coordinates;
                const latLngs = coordinates.map((coord) => [coord[1], coord[0]]);
                setRouteCoordinates(latLngs);
                setErrorMessage(""); // Clear error message on successful route
            } else {
                setErrorMessage("Unable to find a route between the specified locations.");
            }
        } catch (error) {
            console.error(error);
            setErrorMessage("An error occurred while retrieving the route.");
        }
    };

    return (
        <div className="flex flex-col items-center h-screen bg-gray-200">
            <h1 className="text-4xl font-bold text-center text-green-600 mt-6 mb-4">
                MapMyJourney - Navigate Your Way with Ease!
            </h1>

            <div className="flex flex-col mt-4 items-center bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md">
                <input
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="mb-3 w-full text-center h-12 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                    type="text"
                    placeholder="Enter your current location"
                />
                <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="mb-3 w-full text-center h-12 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                    type="text"
                    placeholder="Enter your destination"
                />
                {errorMessage && (
                    <p className="text-red-600 text-center mb-3">{errorMessage}</p>
                )}
                <button
                    onClick={handleRoute}
                    className="h-12 w-full rounded-lg bg-green-500 text-white font-bold hover:bg-green-700 transition duration-200"
                >
                    Submit
                </button>
            </div>

            <div className="mt-6 w-full flex-grow" style={{ height: "600px" }}>
                <MapContainer center={[44.7866, 20.4489]} zoom={6} style={{ height: "100%", width: "100%", borderRadius: '0 0 12px 12px' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {route.length > 0 && (
                        <>
                            <Marker position={route[0]} icon={customIcon} />
                            <Marker position={route[1]} icon={customIcon} />
                            {routeCoordinates.length > 0 && (
                                <Polyline positions={routeCoordinates} color="blue" />
                            )}
                        </>
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default MyMap;
