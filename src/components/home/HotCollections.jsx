// Notes for future-me (and anyone touching this next):
// - I’m sticking with the jQuery Owl plugin on purpose so we keep the exact
//   markup/classes our theme CSS expects. React wrappers tweak markup and then
//   little style regressions creep in.
// - I’m NOT changing the card structure. Same .nft_coll / .nft_wrap / .nft_coll_pp etc.
// - I show skeletons first, then mount Owl once data is in. That avoids the
//   StrictMode double-mount “removeChild” error we saw earlier.
// - Arrows: the characters are injected via navText; their look (size/weight/position)
//   is handled purely in CSS on `.hc-arrow` (we already have those styles in the app).

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import $ from "jquery";

// Local fallbacks in case the API misses fields
import AuthorImage from "../../images/author_thumbnail.jpg";
import nftImage from "../../images/nftImage.jpg";

// Make sure Owl sees jQuery the way it wants
if (typeof window !== "undefined") {
  window.$ = window.jQuery = $;
}

// Load the Owl plugin after jQuery is on window.
// Using require() so I can run the assignments above without tripping ESLint import/first.
try {
  require("owl.carousel");
} catch {
  try {
    require("owl.carousel/dist/owl.carousel");
  } catch {
    // If this still fails, $().owlCarousel will be undefined.
    // That would be a dependency issue, not a runtime bug here.
  }
}

const API =
  "https://us-central1-nft-cloud-functions.cloudfunctions.net/hotCollections";

// Normalize the API into the exact props our card needs.
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
  const authorId = raw?.authorId ?? raw?.author?.id ?? idx;

  return { cover, avatar, title, code, nftId, authorId };
}

const HotCollections = () => {
  const [items, setItems] = useState([]);       // the actual data
  const [loading, setLoading] = useState(true); // toggles skeletons
  const carouselRef = useRef(null);            

  // Pull data with axios. I cap at 12 so loop feels good without being endless.
  useEffect(() => {
    let alive = true;
    setLoading(true);

    axios
      .get(API, { timeout: 8000 })
      .then(({ data }) => {
        if (!alive) return;
        const arr = Array.isArray(data) ? data.slice(0, 12) : [];
        setItems(arr.map(normalizeItem));
      })
      .catch((err) => {
        // Non-fatal: we’ll show empty carousel state after skeletons
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

  // Initialize Owl once we have real slides (not during skeletons).
  // Also destroy on cleanup to avoid duplicate markup in StrictMode.
  useEffect(() => {
    if (loading || items.length === 0) return;

    const $el = $(carouselRef.current);
    if (!$el.length) return;

    // Safety: if Owl already mounted, tear it down first
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
      // The visuals come from CSS on .hc-arrow; these are just the glyphs.
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
    <section id="section-collections" className="no-bottom">
      <div className="container">
      
        <div className="row">
          <div className="col-lg-12">
            <div className="text-center">
              <h2>Hot Collections</h2>
              <div className="small-border bg-color-2"></div>
            </div>
          </div>
        </div>

        {loading ? (
          // Skeleton state: 4 placeholders with the same footprint as real cards.
          // Using .skeleton-box (already styled globally) to keep it consistent.
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
                      style={{
                        width: "100%",
                        height: 220,
                        borderRadius: 12,
                      }}
                    />
                  </div>

                  <div className="nft_coll_pp">
                    <Link to="/author">
                      <div
                        className="skeleton-box"
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: "50%",
                        }}
                      />
                    </Link>
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
          // Data state: exact same card markup inside Owl slides.
          <div className="owl-carousel owl-theme" ref={carouselRef}>
            {items.slice(0, 12).map(({ cover, avatar, title, code, nftId, authorId }, idx) => (
              <div key={nftId ?? idx}>
                <div className="nft_coll">
                  <div className="nft_wrap">
                    <Link to={nftId ? `/item-details/${nftId}` : "/item-details"}>
                      <img src={cover} className="lazy img-fluid" alt={title} />
                    </Link>
                  </div>

                  
                  <div className="nft_coll_pp">
                    <Link to={authorId ? `/author/${authorId}` : "/author"}>
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HotCollections;
