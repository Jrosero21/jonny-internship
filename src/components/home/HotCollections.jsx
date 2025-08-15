// src/components/home/HotCollections.jsx
// Notes for future me:
// - Keeping card markup/styles exactly as-is.
// - Only change here is making the author link robust by reading all common ID shapes.
// - If the API item doesn’t include an author id, we fall back to "/author".

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import $ from "jquery";

import AuthorImage from "../../images/author_thumbnail.jpg";
import nftImage from "../../images/nftImage.jpg";

const API =
  "https://us-central1-nft-cloud-functions.cloudfunctions.net/hotCollections";

// Expose jQuery for Owl (unchanged)
if (typeof window !== "undefined") {
  window.$ = window.jQuery = $;
}
try {
  require("owl.carousel");
} catch {
  try {
    require("owl.carousel/dist/owl.carousel");
  } catch {}
}

// --- Helpers ---
function normalizeItem(raw, idx) {
  const cover =
    raw?.nftImage || raw?.image || raw?.cover || raw?.banner || nftImage;

  const avatar =
    raw?.authorImage || raw?.author?.avatar || raw?.avatar || AuthorImage;

  const title =
    raw?.name || raw?.title || raw?.collectionName || "Pinky Ocean";

  // Keep codes consistent (e.g., "ERC-192")
  const codeRaw = raw?.code || raw?.symbol || raw?.standard || "ERC-192";
  const codeStr = String(codeRaw);
  const code =
    codeStr.toUpperCase().includes("ERC") ? codeStr.toUpperCase() : `ERC-${codeStr}`;

  const nftId = raw?.nftId ?? raw?.id ?? idx;

  // 👇 Make authorId ultra-robust: cover common shapes the demo APIs use
  const authorId =
    raw?.authorId ??      // most common
    raw?.author_id ??     // snake_case variant
    raw?.author?.id ??    // nested object
    raw?.author ??        // sometimes it's just the id value
    null;

  return { cover, avatar, title, code, nftId, authorId };
}

const HotCollections = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    axios
      .get(API, { timeout: 8000 })
      .then(({ data }) => {
        if (!alive) return;
        const arr = Array.isArray(data) ? data : [];
        setItems(arr.map(normalizeItem));
      })
      .catch((err) => {
        console.warn("hotCollections axios failed:", err?.message || err);
        setItems([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loading || items.length === 0) return;

    const $el = $(carouselRef.current);
    if (!$el.length) return;

    if ($el.hasClass("owl-loaded")) {
      $el.trigger("destroy.owl.carousel");
      $el.find(".owl-stage-outer").children().unwrap();
      $el.removeClass("owl-loaded");
    }

    $el.owlCarousel({
      items: 4,
      slideBy: 1,
      loop: true,
      margin: 10,
      dots: false,
      nav: true,
      smartSpeed: 400,
      navText: [
        '<span class="hc-arrow hc-arrow--prev" aria-label="Previous">‹</span>',
        '<span class="hc-arrow hc-arrow--next" aria-label="Next">›</span>',
      ],
      responsive: {
        0: { items: 1 },
        576: { items: 2 },
        992: { items: 3 },
        1200: { items: 4 },
      },
    });

    return () => {
      if ($el.hasClass("owl-loaded")) {
        $el.trigger("destroy.owl.carousel");
      }
    };
  }, [loading, items.length]);

  return (
    <section id="section-collections" className="no-bottom" >
      <div className="container">
        {/* Title */}
        <div className="row" data-aos="fade" style={{ visibility: "visible"}} >
          <div className="col-lg-12">
            <div className="text-center">
              <h2>Hot Collections</h2>
              <div className="small-border bg-color-2"></div>
            </div>
          </div>
        </div>

        {/* Skeletons while loading */}
        {loading ? (
          <div className="row g-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                className="col-lg-3 col-md-6 col-sm-6 col-xs-12"
                key={`sk-${i}`}
              >
                <div className="nft_coll">
                  <div className="nft_wrap">
                    <div
                      className="skeleton-box"
                      style={{ width: "100%", height: 220, borderRadius: 12 }}
                    />
                  </div>
                  <div className="nft_coll_pp">
                    <div
                      className="skeleton-box"
                      style={{ width: 50, height: 50, borderRadius: "50%" }}
                    />
                    <i className="fa fa-check" />
                  </div>
                  <div className="nft_coll_info">
                    <div
                      className="skeleton-box"
                      style={{
                        width: "45%",
                        height: 18,
                        borderRadius: 9,
                        margin: "8px auto",
                      }}
                    />
                    <div
                      className="skeleton-box"
                      style={{
                        width: "28%",
                        height: 14,
                        borderRadius: 7,
                        margin: "0 auto 12px",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Data slides inside Owl
          <div className="owl-carousel owl-theme" ref={carouselRef}>
            {items.map(({ cover, avatar, title, code, nftId, authorId }, idx) => {
              // Build the author path safely; fall back to /author if ID missing
              const authorPath =
                authorId !== null && authorId !== undefined && `${authorId}` !== ""
                  ? `/author/${authorId}`
                  : "/author";

              return (
                <div key={nftId ?? idx}>
                  <div className="nft_coll">
                    <div className="nft_wrap">
                      <Link to={nftId ? `/item-details/${nftId}` : "/item-details"}>
                        <img src={cover} className="lazy img-fluid" alt={title} />
                      </Link>
                    </div>

                    <div className="nft_coll_pp">
                      <Link to={authorPath} data-bs-toggle="tooltip" data-bs-placement="top" title="Creator">
                        <img className="lazy pp-coll" src={avatar} alt={`${title} author`} />
                      </Link>
                      <i className="fa fa-check" />
                    </div>

                    <div className="nft_coll_info">
                      <Link to="/explore">
                        <h4>{title}</h4>
                      </Link>
                      <span>{code}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default HotCollections;
