// Carousel implementation for Hot Collections using react-slick.
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Slider from "react-slick";
import { Link } from "react-router-dom";

// Include slick styles once in the app 
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Local fallback images (used if API doesn't provide these values)
import AuthorFallback from "../../images/author_thumbnail.jpg";
import NftFallback from "../../images/nftImage.jpg";

// API endpoint for fetching hot NFT collections
const API =
  "https://us-central1-nft-cloud-functions.cloudfunctions.net/hotCollections";

// Custom arrow component to match the round white arrows from the mock
const ArrowButton = ({ onClick, direction }) => {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? "Previous" : "Next"}
      className="hot-collections-arrow"
      style={{
        width: 44,
        height: 44,
        borderRadius: "9999px",
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
        position: "absolute",
        top: "38%",
        zIndex: 2,
        left: isPrev ? -8 : "auto",
        right: isPrev ? "auto" : -8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <i
        className={`fa fa-chevron-${isPrev ? "left" : "right"}`}
        style={{ fontSize: 16 }}
      />
    </button>
  );
};

const HotCollections = () => {
  // Store collections from the API
  const [collections, setCollections] = useState([]);
  // Loading state to show placeholders before data arrives
  const [loading, setLoading] = useState(true);
  // Error message state if API request fails
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    // Fetch data from the Hot Collections API
    (async () => {
      try {
        const { data } = await axios.get(API, { timeout: 5000 });
        if (!mounted) return;

       
        const input = Array.isArray(data) ? data : [];

        // If fewer than 4 items are returned, duplicate until we reach 4+
        // so the carousel can loop and still show 4 slides at once.
        let usable = [...input];
        if (usable.length > 0 && usable.length < 4) {
          while (usable.length < 4) usable = usable.concat(input);
        }

        setCollections(usable);
      } catch (e) {
        if (mounted) setErr("Could not load hot collections.");
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
    };
  }, []);

  // Slider configuration: 4 visible, scroll 1, infinite loop, custom arrows
  const sliderSettings = useMemo(
    () => ({
      infinite: true,
      speed: 400,
      slidesToShow: 4,
      slidesToScroll: 1,
      arrows: true,
      dots: false,
      nextArrow: <ArrowButton direction="next" />,
      prevArrow: <ArrowButton direction="prev" />,
   
      responsive: [
        { breakpoint: 1200, settings: { slidesToShow: 3 } },
        { breakpoint: 992, settings: { slidesToShow: 2 } },
        { breakpoint: 576, settings: { slidesToShow: 1 } },
      ],
    }),
    []
  );

  return (
    <section id="section-collections" className="no-bottom">
      <div className="container">
        {/* Title row is separate from slider so layout matches existing sections */}
        <div className="row">
          <div className="col-lg-12">
            <div className="text-center">
              <h2>Hot Collections</h2>
              <div className="small-border bg-color-2"></div>
            </div>
          </div>
        </div>

        {/* Replace the previous grid with a full-width carousel wrapper */}
        <div className="position-relative" style={{ marginTop: 12 }}>
          {/* Loading state: show a temporary 4-up slider with skeleton cards */}
          {loading && (
            <Slider {...sliderSettings}>
              {new Array(4).fill(0).map((_, i) => (
                <div key={`skeleton-${i}`} style={{ padding: "0 14px" }}>
                  <div className="nft_coll">
                    <div
                      className="nft_wrap"
                      style={{
                        background: "#f3f3f3",
                        height: 200,
                        borderRadius: 12,
                      }}
                    />
                    <div className="nft_coll_pp">
                      <div
                        className="pp-coll"
                        style={{
                          width: 52,
                          height: 52,
                          background: "#eee",
                          borderRadius: "9999px",
                        }}
                      />
                    </div>
                    <div className="nft_coll_info">
                      <div
                        style={{
                          width: 140,
                          height: 18,
                          background: "#eee",
                          marginBottom: 8,
                          borderRadius: 6,
                        }}
                      />
                      <div
                        style={{
                          width: 70,
                          height: 14,
                          background: "#f1f1f1",
                          borderRadius: 6,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          )}

          {/* Error state */}
          {!loading && err && (
            <p className="text-center text-danger mb-0">{err}</p>
          )}

          {/* Data state: build slides from the full dataset */}
          {!loading && !err && collections.length > 0 && (
            <Slider {...sliderSettings}>
              {collections.map((c, index) => {
                // Resolve collection image, avatar, title, and code with fallbacks
                const coverImg =
                  c?.nftImage || c?.image || c?.cover || c?.banner || NftFallback;
                const avatar =
                  c?.authorImage || c?.author?.avatar || c?.avatar || AuthorFallback;
                const title =
                  c?.name || c?.title || c?.collectionName || "Untitled";
                const code =
                  c?.code || c?.symbol || c?.standard || "ERC-721";
                const nftId = c?.nftId ?? c?.id;
                const authorId = c?.authorId ?? c?.author?.id;

                return (
                  <div key={nftId ?? index} style={{ padding: "0 14px" }}>
                    <div className="nft_coll">
                      <div
                        className="nft_wrap"
                        style={{ borderRadius: 12, overflow: "hidden" }}
                      >
                        <Link
                          to={nftId ? `/item-details/${nftId}` : "/item-details"}
                        >
                          <img
                            src={coverImg}
                            className="lazy img-fluid"
                            alt={title}
                            style={{ display: "block", width: "100%" }}
                          />
                        </Link>
                      </div>

                      <div className="nft_coll_pp">
                        <Link to={authorId ? `/author/${authorId}` : "/author"}>
                          <img
                            className="lazy pp-coll"
                            src={avatar}
                            alt={`${title} author`}
                          />
                        </Link>
                        <i className="fa fa-check"></i>
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
            </Slider>
          )}
        </div>
      </div>

      {/* Scoped styles that nudge spacing and arrow appearance to match the screenshot without touching globals */}
      <style>{`
        #section-collections.no-bottom { padding-bottom: 0; }

        .nft_coll { background: #fff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); }
        .nft_wrap img { border-radius: 12px; }

        .nft_coll_pp { margin-top: -26px; display: flex; align-items: center; padding-left: 18px; }
        .pp-coll { width: 52px; height: 52px; border-radius: 9999px; border: 3px solid #fff; object-fit: cover; }

        .nft_coll_info { padding: 10px 18px 18px; }
        .nft_coll_info h4 { margin: 8px 0 6px; }

        /* Remove default slick arrow glyphs because custom buttons are used */
        .slick-prev:before, .slick-next:before { content: none; }
      `}</style>
    </section>
  );
};

export default HotCollections;
