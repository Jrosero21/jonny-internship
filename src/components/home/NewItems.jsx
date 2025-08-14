// src/components/home/NewItems.jsx
// quick notes from me:
// - Skeleton matches our Hot Collections pattern: simple shimmer blocks, 4-up grid, no Owl.
// - When items arrive, we init Owl (4-up, slideBy 1, loop). Clean destroy on unmount/reinit.
// - Countdown stays: hide if no expiry, EXPIRED if past, else hh mm ss.

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import $ from "jquery";

import AuthorImage from "../../images/author_thumbnail.jpg";
import nftImage from "../../images/nftImage.jpg";

const API = "https://us-central1-nft-cloud-functions.cloudfunctions.net/newItems";

// expose jQuery for Owl (same as Hot Collections)
if (typeof window !== "undefined") {
  window.$ = window.jQuery = $;
}
try {
  require("owl.carousel");
} catch {
  try {
    require("owl.carousel/dist/owl.carousel");
  } catch {
    // if this fails, $().owlCarousel will be undefined at runtime
  }
}

function normalize(raw, idx) {
  const cover =
    raw?.nftImage || raw?.image || raw?.cover || raw?.banner || nftImage;
  const avatar =
    raw?.authorImage || raw?.author?.avatar || raw?.avatar || AuthorImage;
  const title = raw?.title || raw?.name || raw?.collectionName || "Untitled";
  const price =
    typeof raw?.price === "number" ? raw.price : Number(raw?.price) || 0;
  const likes =
    typeof raw?.likes === "number" ? raw.likes : Number(raw?.likes) || 0;

  // expiryDate may be seconds or ms; normalize to ms; 0 means "absent"
  const unix = Number(raw?.expiryDate ?? raw?.expiry ?? 0);
  const expiryMs = unix ? (unix > 1e12 ? unix : unix * 1000) : 0;

  const nftId = raw?.nftId ?? raw?.id ?? idx;
  const authorId = raw?.authorId ?? raw?.author?.id ?? idx;

  return { cover, avatar, title, price, likes, expiryMs, nftId, authorId };
}

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

const NewItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);

  // fetch
  useEffect(() => {
    let alive = true;

    axios
      .get(API, { timeout: 8000 })
      .then(({ data }) => {
        if (!alive) return;
        const arr = Array.isArray(data) ? data.slice(0, 12) : [];
        let usable = arr.map(normalize);

        // ensure >= 4 so the loop feels right
        if (usable.length > 0 && usable.length < 4) {
          while (usable.length < 4) usable = usable.concat(usable);
          usable = usable.slice(0, 4);
        }

        setItems(usable);
      })
      .catch(() => {
        setItems([]); // skeleton will show
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // owl init/destroy (don’t run while skeleton is showing)
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    // if still loading or empty → make sure Owl is not mounted
    if (loading || items.length === 0) {
      const $maybe = $(el);
      if ($maybe.hasClass("owl-loaded")) {
        try {
          $maybe.trigger("destroy.owl.carousel");
          $maybe.find(".owl-stage-outer").children().unwrap();
          $maybe.removeClass("owl-loaded");
        } catch {}
      }
      return;
    }

    const $el = $(el);

    // clean destroy before re-init (StrictMode safety)
    if ($el.hasClass("owl-loaded")) {
      try {
        $el.trigger("destroy.owl.carousel");
        $el.find(".owl-stage-outer").children().unwrap();
        $el.removeClass("owl-loaded");
      } catch {}
    }

    $el.owlCarousel({
      items: 4,
      margin: 14,
      loop: true,
      nav: true,
      dots: false,
      slideBy: 1,
      smartSpeed: 400,
      navText: [
        '<span aria-label="Previous"></span>',
        '<span aria-label="Next"></span>',
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
        try {
          $el.trigger("destroy.owl.carousel");
        } catch {}
      }
    };
  }, [loading, items.length]);

  const showSkeleton = loading || items.length === 0;

  return (
    <section id="section-items" className="no-bottom">
      <div className="container">
        {/* Title */}
        <div className="row">
          <div className="col-lg-12">
            <div className="text-center">
              <h2>New Items</h2>
              <div className="small-border bg-color-2"></div>
            </div>
          </div>
        </div>

        {/* Skeleton grid (no Owl) */}
        {showSkeleton ? (
          <div className="row g-3">
            {new Array(4).fill(0).map((_, i) => (
              <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12" key={`sk-${i}`}>
                <div className="nft__item">
                  <div className="author_list_pp">
                    <div className="sk-circle" />
                  </div>
                  {/* no countdown pill while loading to keep it clean */}
                  <div className="sk-media" />
                  <div className="nft__item_info">
                    <div className="sk-title" />
                    <div className="sk-line w-120" />
                    <div className="sk-line w-80" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Owl carousel with real items
          <div className="owl-carousel owl-theme" ref={carouselRef}>
            {items.map(
              ({ cover, avatar, title, price, likes, expiryMs, nftId, authorId }, idx) => (
                <div key={nftId ?? idx}>
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

                    {/* Only render countdown if expiry exists */}
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
                        <img className="lazy nft__item_preview" src={cover} alt={title} />
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
          </div>
        )}
      </div>

      {/* Scoped styles: skeleton + arrows (same arrow look as Hot Collections) */}
      <style>{`
        /* skeleton blocks (same vibe as Hot Collections) */
        .sk-media,
        .sk-title,
        .sk-line,
        .sk-circle {
          position: relative;
          overflow: hidden;
          background: #f1f3f5;
          border-radius: 12px;
        }
        .sk-circle {
          width: 42px; height: 42px; border-radius: 9999px;
        }
        .sk-media { height: 220px; margin-top: 8px; margin-bottom: 12px; }
        .sk-title { height: 18px; width: 60%; border-radius: 6px; margin-bottom: 10px; }
        .sk-line { height: 14px; border-radius: 6px; margin-bottom: 8px; }
        .sk-line.w-120 { width: 120px; }
        .sk-line.w-80 { width: 80px; }

        .sk-media::after,
        .sk-title::after,
        .sk-line::after,
        .sk-circle::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }

        /* Owl arrows cloned from the other section */
        #section-items .owl-nav button.owl-prev,
        #section-items .owl-nav button.owl-next {
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          background: #fff !important;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 4px 10px rgba(0,0,0,0.06);
          position: absolute;
          top: 40%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #section-items .owl-nav button.owl-prev { left: -8px; }
        #section-items .owl-nav button.owl-next { right: -8px; }
        #section-items .owl-nav button.owl-prev::before,
        #section-items .owl-nav button.owl-next::before {
          font-weight: 300;
          font-size: 18px;
          line-height: 1;
          display: block;
          position: relative;
          top: -1px;
        }
        #section-items .owl-nav button.owl-prev::before { content: '‹'; }
        #section-items .owl-nav button.owl-next::before { content: '›'; }
        #section-items .owl-nav button span { display: none; }
      `}</style>
    </section>
  );
};

export default NewItems;
