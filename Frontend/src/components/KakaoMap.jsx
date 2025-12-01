import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";

const KakaoMap = forwardRef(({ markers }, ref) => {
  const mapRef = useRef();
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // 기본값: 서울
  const [myPosition, setMyPosition] = useState(null);
  const [hoveredMarkerIndex, setHoveredMarkerIndex] = useState(null); // index 또는 'me'

  // 외부에서 panTo 호출 가능
  useImperativeHandle(ref, () => ({
    panTo: (lat, lng) => {
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        setCenter({ lat, lng });
      }
    },
  }));

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const current = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(current);
          setMyPosition(current);
        },
        (error) => {
          console.warn("위치 정보를 가져올 수 없습니다.", error);
        }
      );
    }
  }, []);

  return (
    <Map
      center={center}
      style={{ width: "100%", height: "100%" }}
      level={7}
      ref={mapRef}
    >
      {/* 내 위치 마커 */}
      {myPosition && (
        <MapMarker
          position={myPosition}
          image={{
            src: "/imageupload/my_location.png",
            size: { width: 40, height: 40 },
          }}
          onMouseOver={() => setHoveredMarkerIndex("me")}
          onMouseOut={() => setHoveredMarkerIndex(null)}
        >
          {hoveredMarkerIndex === "me" && (
            <div style={{ fontSize: "12px", color: "#000", padding: "5px" }}>
              📍 내 위치
            </div>
          )}
        </MapMarker>
      )}

      {/* 보호소 마커들 */}
      {markers
        .filter((m) => m.latitude && m.longitude)
        .map((marker, index) => (
          <MapMarker
            key={index}
            position={{ lat: marker.latitude, lng: marker.longitude }}
            onMouseOver={() => setHoveredMarkerIndex(index)}
            onMouseOut={() => setHoveredMarkerIndex(null)}
            image={{
              src: "/imageupload/shelters_location.png",
              size: { width: 30, height: 35 },
            }}
          >
            {hoveredMarkerIndex === index && (
              <div style={{ fontSize: "12px", padding: "5px" }}>
                <strong>{marker.name}</strong>
                <br />
                {marker.phone}
              </div>
            )}
          </MapMarker>
        ))}
    </Map>
  );
});

export default KakaoMap;
