import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { regionData } from "@/utils/regionData";
import KakaoMap from "@/components/KakaoMap";
import Banner from '@/components/Mainpage/Banner';
import Breadcrumb from "@/components/Breadcrumb";

export default function Shelters() {
  const mapRef = useRef();
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [keyword, setKeyword] = useState("");

  const [allResults, setAllResults] = useState([]);
  const [visibleResults, setVisibleResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [filterVisible, setFilterVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const hasFetchedOnce = useRef(false);

  const pageGroupSize = 5;
  const startPage = Math.floor((currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });
      },
      (err) => {
        console.warn("❌ 위치 정보 가져오기 실패", err);
      }
    );
  }, []);

  const fetchAllPages = async () => {
    let allItems = [];
    let page = 1;
    const size = 500;

    while (true) {
      const res = await axios.get(`/api/shelters`, {
        params: { page, size },
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      const parsed = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      const items = parsed?.response?.body?.items?.item || [];

      allItems = [...allItems, ...items];
      if (items.length < size) break;
      page++;
    }

    return allItems;
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const rawItems = await fetchAllPages();
      console.log("📦 총 데이터 수:", rawItems.length);

      const formatted = rawItems.map((shelter) => {
        const address = shelter.careAddr || "";
        const region = address.split(" ")[0] || "";
        const district = address.split(" ")[1] || "";

        return {
          name: shelter.careNm,
          phone: shelter.careTel,
          address: shelter.careAddr,
          region,
          district,
          latitude: parseFloat(shelter.lat),
          longitude: parseFloat(shelter.lng),
        };
      });

      const valid = formatted.filter((shelter) => {
        const validCoords = !isNaN(shelter.latitude) && !isNaN(shelter.longitude);
        if (!validCoords) {
          console.warn("❌ 좌표 NaN 보호소:", shelter.name, "/", shelter.address);
        }
        return validCoords;
      });

      // 🔍 프론트에서 필터링
      const filtered = valid.filter((shelter) => {
        const matchesRegion =
          selectedRegion === "" || shelter.address.includes(selectedRegion);
        const matchesDistrict =
          selectedDistrict === "" || shelter.address.includes(selectedDistrict);
        const matchesKeyword =
          keyword === "" ||
          shelter.name?.toLowerCase().includes(keyword.toLowerCase()) ||
          shelter.address?.toLowerCase().includes(keyword.toLowerCase());

        return matchesRegion && matchesDistrict && matchesKeyword;
      });

      let sorted = filtered;
      if (userLocation) {
        sorted = [...filtered].sort((a, b) => {
          const dA = getDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
          const dB = getDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
          return dA - dB;
        });
      }

      setAllResults(sorted);
      setTotalPages(Math.ceil(sorted.length / itemsPerPage));
      setCurrentPage(1);
      setVisibleResults(sorted.slice(0, itemsPerPage));
    } catch (err) {
      console.error("❌ 보호소 데이터 불러오기 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation && !hasFetchedOnce.current) {
      fetchData();
      hasFetchedOnce.current = true;
    }
  }, [userLocation]);

  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setVisibleResults(allResults.slice(start, end));
  }, [currentPage, allResults]);

  const handleSearch = () => {
    console.log("🔍 검색 실행됨");
    console.log("선택한 지역:", selectedRegion, "/", selectedDistrict);
    console.log("입력한 키워드:", keyword);

    hasFetchedOnce.current = true;
    fetchData();
  };

  return (
    <div>
      <div style={{ position: "relative", textAlign: "center" }}>
        {/* 상단 배너 */}
        <Banner
          text="보호소 찾기"
        />
      </div>

      <Breadcrumb />

      <div style={{ position: "relative", height: "90vh", display: "flex" }}>
        <KakaoMap ref={mapRef} markers={visibleResults} />

        {/* 필터 패널 */}
        <div style={{
          position: "absolute", top: "1rem", bottom: "1rem",
          left: filterVisible ? "1rem" : "-380px", width: "360px", maxHeight: "85vh",
          overflowY: "auto", padding: "1.2rem", backgroundColor: "#fff",
          borderRadius: "10px", boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
          transition: "left 0.3s ease-in-out", zIndex: 55,
        }}>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "1rem", fontWeight: "bold" }}>보호소 검색</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <select value={selectedRegion} 
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedDistrict("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }} 
              style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}>
              <option value="">행정구역 선택</option>
              {Object.keys(regionData).map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            <select value={selectedDistrict} 
              onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedRegion}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}>
              <option value="">시/군/구 선택</option>
              {regionData[selectedRegion]?.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <input type="text" placeholder="보호소명 또는 주소 입력" value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }} />

            <button onClick={handleSearch}
              style={{ padding: "0.6rem", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
              검색
            </button>
          </div>

          <hr style={{ margin: "1.2rem 0" }} />
          <p style={{ fontWeight: "bold" }}>총 <span style={{ color: "#007BFF" }}>{allResults.length}</span>건의 보호소</p>

          {isLoading ? (
            <p style={{ textAlign: "center", marginTop: "2rem" }}>로딩 중...</p>
          ) : (
            <>
              {visibleResults.map((s, i) => (
                <div key={i}
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.panTo(s.latitude, s.longitude);
                    }
                  }}
                  style={{
                    cursor: "pointer", border: "1px solid #e0e0e0",
                    borderRadius: "8px", padding: "1rem", marginBottom: "1rem",
                    backgroundColor: "#f9f9f9", boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <h4 style={{ margin: "0 0 0.5rem", color: "#333" }}>{s.name}</h4>
                  <p style={{ margin: "0.2rem 0" }}>📍 <strong>{s.address}</strong></p>
                  <p style={{ margin: "0.2rem 0" }}>📞 {s.phone || "정보 없음"}</p>
                </div>
              ))}

              <div style={{
                textAlign: "center", marginTop: "1rem", display: "flex",
                justifyContent: "center", flexWrap: "wrap"
              }}>
                {startPage > 1 && (
                  <button onClick={() => setCurrentPage(startPage - 1)} style={navBtnStyle}>&lt;</button>
                )}
                {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                  const pageNum = startPage + i;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                      style={{
                        margin: "0 0.3rem", padding: "0.4rem 0.8rem",
                        backgroundColor: currentPage === pageNum ? "#000" : "#eee",
                        color: currentPage === pageNum ? "#fff" : "#000",
                        border: "none", borderRadius: "4px", cursor: "pointer",
                      }}>
                      {pageNum}
                    </button>
                  );
                })}
                {endPage < totalPages && (
                  <button onClick={() => setCurrentPage(endPage + 1)} style={navBtnStyle}>&gt;</button>
                )}
              </div>
            </>
          )}
        </div>

        <button onClick={() => setFilterVisible(prev => !prev)}
          style={{
            position: "absolute", top: "20rem", left: filterVisible ? "411px" : "1rem", zIndex: 100,
            background: "#fff", border: "none", borderRadius: "15%", width: "34px", height: "40px",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "left 0.3s ease-in-out",
            cursor: "pointer", fontWeight: "bold",
          }}>
          {filterVisible ? "<" : ">"}
        </button>
      </div>
    </div>
  );
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const navBtnStyle = {
  margin: "0 0.3rem",
  padding: "0.4rem 0.8rem",
  border: "1px solid #ccc",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "#fff",
  color: "#000",
};
