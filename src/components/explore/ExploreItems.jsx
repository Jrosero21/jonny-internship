import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import AuthorImage from "../../images/author_thumbnail.jpg";
import NftImage from "../../images/nftImage.jpg";

const API = "https://us-central1-nft-cloud-functions.cloudfunctions.net/explore";

// Normalize API → what each card needs 
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

  // New: normalize expiry → ms (0 means “absent” so we won't render the pill)
  const unix = Number(raw?.expiryDate ?? raw?.expiry ?? 0);
  const expiryMs = unix ? (unix > 1e12 ? unix : unix * 1000) : 0;

  const nftId = raw?.nftId ?? raw?.id ?? idx;
  const authorId = raw?.authorId ?? raw?.author?.id ?? idx;

  return { cover, avatar, title, price, likes, expiryMs, nftId, authorId };
}

// Same countdown we used in NewItems (hh mm ss; EXPIRED when past; hides when no end)
const Countdown = ({ end }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!end) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [end]);

  if (!end) return null; // no purple pill if no expiry

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
  const [items, setItems] = useState([]);        // full dataset
  const [visible, setVisible] = useState(8);     // show 8 initially
  const [filter, setFilter] = useState("");      // "", price_low_to_high, price_high_to_low, likes_high_to_low
  const [loading, setLoading] = useState(true);  

  // Fetch once (keep markup intact; just swap in dynamic data)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await axios.get(API, { timeout: 8000 });
        if (!alive) return;
        const list = (Array.isArray(data) ? data : []).map(normalize);
        setItems(list);
        setVisible(8);
      } catch (err) {
        console.warn("Explore API failed:", err?.message || err);
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  // Sort window (don’t mutate original list)
  const sorted = useMemo(() => {
    if (!items.length) return [];
    const clone = [...items];
    switch (filter) {
      case "price_low_to_high":
        clone.sort((a, b) => a.price - b.price);
        break;
      case "price_high_to_low":
        clone.sort((a, b) => b.price - a.price);
        break;
      case "likes_high_to_low":
        clone.sort((a, b) => b.likes - a.likes);
        break;
      default:
        // API order
        break;
    }
    return clone;
  }, [items, filter]);

  const render = sorted.slice(0, visible);

  const handleLoadMore = (e) => {
    e.preventDefault();
    setVisible((v) => Math.min(v + 4, sorted.length));
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setVisible(8);
  };

  return (
    <>
      <div>
        <select
          id="filter-items"
          value={filter}
          onChange={handleFilterChange}
          disabled={loading || !items.length}
        >
          <option value="">Default</option>
          <option value="price_low_to_high">Price, Low to High</option>
          <option value="price_high_to_low">Price, High to Low</option>
          <option value="likes_high_to_low">Most liked</option>
        </select>
      </div>

      {render.map(
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

              {/* Countdown: only render the purple pill when expiry exists */}
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

      {!loading && visible < sorted.length && (
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
