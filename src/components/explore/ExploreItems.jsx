// Notes from me while wiring this up:
//
// - I’m keeping the original card markup/classes exactly as-is so the global CSS
//   continues to style things correctly. Only swapping static content for API data.
// - Data flow: fetch once → store full list → render a window of items.
//   We start with 8 visible, and each “Load more” click adds +4.
// - The filter <select> is hooked up (price asc/desc, likes desc). On filter change
//   I reset the window back to 8 so the UX stays predictable.


import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import AuthorImage from "../../images/author_thumbnail.jpg";
import NftImage from "../../images/nftImage.jpg";

const API = "https://us-central1-nft-cloud-functions.cloudfunctions.net/explore";

// Quick normalizer so each card has what it needs, even if the API is missing fields.
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

  // Useful ids for routing
  const nftId = raw?.nftId ?? raw?.id ?? idx;
  const authorId = raw?.authorId ?? raw?.author?.id ?? idx;

  return { cover, avatar, title, price, likes, nftId, authorId };
}

const ExploreItems = () => {
  const [items, setItems] = useState([]);        // full dataset
  const [visible, setVisible] = useState(8);     // 8 first, then +4 per click
  const [filter, setFilter] = useState("");      // "", price_low_to_high, price_high_to_low, likes_high_to_low
  const [loading, setLoading] = useState(true);  // simple guard; skeletons can be added later

  // Fetch once on mount
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await axios.get(API, { timeout: 8000 });
        if (!alive) return;

        const list = (Array.isArray(data) ? data : []).map(normalize);
        setItems(list);
        setVisible(8); // reset window on successful load
      } catch (err) {
        console.warn("Explore API failed:", err?.message || err);
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Sorting derived from current filter (kept separate from raw list)
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
        // "Default" = whatever order the API gave us
        break;
    }
    return clone;
  }, [items, filter]);

  // What to render right now
  const render = sorted.slice(0, visible);

  // Load more = reveal the next row of 4 (if we have more)
  const handleLoadMore = (e) => {
    e.preventDefault(); // keep Link markup but prevent navigation
    setVisible((v) => Math.min(v + 4, sorted.length));
  };

  // When filter changes, show the first 8 again so we don’t jump around
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

      {/* Grid — exact same structure/classes  */}
      {render.map(({ cover, avatar, title, price, likes, nftId, authorId }, index) => (
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

            {/* Leaving countdown out for now 
                when added, render this only when we actually have a value. */}
            {/* <div className="de_countdown">…</div> */}

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
      ))}

      {/* Load more button — same markup, just hooked into state now */}
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
