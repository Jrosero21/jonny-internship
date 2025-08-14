// Notes:
// - Switched to server-side filtering: I call the Explore API with ?filter=<value>
//   so we’re not sorting on the client anymore.
// - Kept the original markup/classes intact so theme CSS continues to line up.
// - I show 8 items on first render, then +4 per "Load more" (if available).
// - Added a tiny cache per filter so toggling between filters is snappy.
// - Countdown matches NewItems: hidden if no expiry, shows "EXPIRED" if past.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import AuthorImage from "../../images/author_thumbnail.jpg";
import NftImage from "../../images/nftImage.jpg";

const API = "https://us-central1-nft-cloud-functions.cloudfunctions.net/explore";

// Map API → the exact props our card needs
function normalize(raw, idx) {
  const cover =
    raw?.nftImage || raw?.image || raw?.cover || raw?.banner || NftImage;
  const avatar =
    raw?.authorImage || raw?.author?.avatar || raw?.avatar || AuthorImage;
  const title = raw?.title || raw?.name || "Untitled";
  const price =
    typeof raw?.price === "number" ? raw.price : Number(raw?.price) || 0;
  const likes =
    typeof raw?.likes === "number" ? raw.likes : Number(raw?.likes) || 0;

  // expiryDate can be seconds or ms; normalize to ms (0 means "absent")
  const unix = Number(raw?.expiryDate ?? raw?.expiry ?? 0);
  const expiryMs = unix ? (unix > 1e12 ? unix : unix * 1000) : 0;

  const nftId = raw?.nftId ?? raw?.id ?? idx;
  const authorId = raw?.authorId ?? raw?.author?.id ?? idx;

  return { cover, avatar, title, price, likes, expiryMs, nftId, authorId };
}

// Same countdown as NewItems (HH:MM:SS; EXPIRED when past; hidden if no end)
const Countdown = ({ end }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!end) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [end]);

  if (!end) return null;

  const delta = end - now;
  if (delta <= 0) return <span>EXPIRED</span>;

  const totalSec = Math.floor(delta / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return <span>{pad(h)}h {pad(m)}m {pad(s)}s</span>;
};

const ExploreItems = () => {
  const [items, setItems] = useState([]);        // current list for the active filter
  const [visible, setVisible] = useState(8);     // show 8 first, then +4
  const [filter, setFilter] = useState("");      // "", "price_low_to_high", "price_high_to_low", "likes_high_to_low"
  const [loading, setLoading] = useState(true);

  // Simple in-memory cache per filter so switching is instant
  const cacheRef = useRef(new Map()); // key: filter string -> normalized array


  const fetchFor = async (flt) => {
    setLoading(true);
    try {
      // If we already have it, use cache and skip the network
      if (cacheRef.current.has(flt)) {
        setItems(cacheRef.current.get(flt));
        setVisible(8);
        return;
      }

      const url = flt ? `${API}?filter=${encodeURIComponent(flt)}` : API;
      const { data } = await axios.get(url, { timeout: 8000 });
      const list = (Array.isArray(data) ? data : []).map(normalize);

      cacheRef.current.set(flt, list);
      setItems(list);
      setVisible(8);
    } catch (err) {
      console.warn("Explore fetch failed:", err?.message || err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load (default filter)
  useEffect(() => {
    fetchFor("");
 
  }, []);

  // When filter changes, refetch with the correct URL (or flip to cache if we have it)
  const handleFilterChange = (e) => {
    const next = e.target.value;
    setFilter(next);
    fetchFor(next);
  };

  const render = useMemo(() => items.slice(0, visible), [items, visible]);

  const handleLoadMore = (e) => {
    e.preventDefault();
    setVisible((v) => Math.min(v + 4, items.length));
  };

  return (
    <>
      <div>
        <select
          id="filter-items"
          value={filter}
          onChange={handleFilterChange}
          disabled={loading}
        >
          <option value="">Default</option>
          <option value="price_low_to_high">Price, Low to High</option>
          <option value="price_high_to_low">Price, High to Low</option>
          <option value="likes_high_to_low">Most liked</option>
        </select>
      </div>

      {/* Skeletons while loading — keep footprint identical to cards */}
      {loading
        ? Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="d-item col-lg-3 col-md-6 col-sm-6 col-xs-12"
              style={{ display: "block", backgroundSize: "cover" }}
            >
              <div className="nft__item">
                <div className="author_list_pp">
                  <div
                    className="skeleton-box"
                    style={{ width: 42, height: 42, borderRadius: "50%" }}
                  />
                </div>

                <div
                  className="skeleton-box"
                  style={{
                    width: 110,
                    height: 28,
                    borderRadius: 9999,
                    marginLeft: "auto",
                  }}
                />

                <div className="nft__item_wrap" style={{ marginTop: 8 }}>
                  <div
                    className="skeleton-box"
                    style={{ width: "100%", height: 240, borderRadius: 12 }}
                  />
                </div>

                <div className="nft__item_info" style={{ marginTop: 12 }}>
                  <div
                    className="skeleton-box"
                    style={{ width: "55%", height: 18, borderRadius: 6 }}
                  />
                  <div
                    className="skeleton-box"
                    style={{
                      width: 90,
                      height: 14,
                      borderRadius: 6,
                      marginTop: 10,
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        : render.map(
            ({ cover, avatar, title, price, likes, expiryMs, nftId, authorId }, index) => (
              <div
                key={nftId ?? index}
                className="d-item col-lg-3 col-md-6 col-sm-6 col-xs-12"
                style={{ display: "block", backgroundSize: "cover" }}
              >
                <div className="nft__item">
                  <div className="author_list_pp">
                    <Link
                      to={authorId != null ? `/author/${authorId}` : "/author"}
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title="Creator"
                    >
                      <img className="lazy" src={avatar} alt={`${title} author`} />
                      <i className="fa fa-check"></i>
                    </Link>
                  </div>

                  {/* Only show the purple pill if we have an expiry */}
                  {expiryMs ? (
                    <div className="de_countdown">
                      <Countdown end={expiryMs} />
                    </div>
                  ) : null}

                  <div className="nft__item_wrap">
                    <div className="nft__item_extra">
                      <div className="nft__item_buttons">
                        <button>Buy Now</button>
                        <div className="nft__item_share">
                          <h4>Share</h4>
                          <a href="#" target="_blank" rel="noreferrer">
                            <i className="fa fa-facebook fa-lg"></i>
                          </a>
                          <a href="#" target="_blank" rel="noreferrer">
                            <i className="fa fa-twitter fa-lg"></i>
                          </a>
                          <a href="#">
                            <i className="fa fa-envelope fa-lg"></i>
                          </a>
                        </div>
                      </div>
                    </div>

                    <Link to={nftId != null ? `/item-details/${nftId}` : "/item-details"}>
                      <img src={cover} className="lazy nft__item_preview" alt={title} />
                    </Link>
                  </div>

                  <div className="nft__item_info">
                    <Link to={nftId != null ? `/item-details/${nftId}` : "/item-details"}>
                      <h4>{title}</h4>
                    </Link>
                    <div className="nft__item_price">{price} ETH</div>
                    <div className="nft__item_like">
                      <i className="fa fa-heart"></i>
                      <span>{likes}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

      {!loading && visible < items.length && (
        <div className="col-md-12 text-center">
          <Link to="" id="loadmore" className="btn-main lead" onClick={handleLoadMore}>
            Load more
          </Link>
        </div>
      )}
    </>
  );
};

export default ExploreItems;
