// Notes (matching HotCollections approach):
// - Stick with the jQuery Owl plugin so the markup matches theme CSS exactly.
// - Do NOT change the card structure.
// - Show skeletons first; only mount Owl once real data is in (avoids StrictMode issues).
// - Arrows: inject characters via navText using `.hc-arrow` classes. All visual styling
//   (size/weight/position/overlap) comes from the same global CSS HotCollections uses.

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import $ from "jquery";

// Fallbacks (same concept as before)
import AuthorImage from "../../images/author_thumbnail.jpg";
import nftImage from "../../images/nftImage.jpg";

const API = "https://us-central1-nft-cloud-functions.cloudfunctions.net/newItems";

// Expose jQuery to Owl (same as HotCollections)
if (typeof window !== "undefined") {
  window.$ = window.jQuery = $;
}
try {
  require("owl.carousel");
} catch {
  try {
    require("owl.carousel/dist/owl.carousel");
  } catch {
   
  }
}

// Normalize the API payload into what the card needs
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

  // expiryDate can be seconds or ms; normalize to ms; 0 means "absent"
  const unix = Number(raw?.expiryDate ?? raw?.expiry ?? 0);
  const expiryMs = unix ? (unix > 1e12 ? unix : unix * 1000) : 0;

  const nftId = raw?.nftId ?? raw?.id ?? idx;
  const authorId = raw?.authorId ?? raw?.author?.id ?? idx;

  return { cover, avatar, title, price, likes, expiryMs, nftId, authorId };
}

// Small countdown (hh mm ss). Renders nothing if no end, "EXPIRED" when past.
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

  // Fetch all items
  useEffect(() => {
    let alive = true;
    setLoading(true);

    axios
      .get(API, { timeout: 8000 })
      .then(({ data }) => {
        if (!alive) return;
        const arr = Array.isArray(data) ? data : [];
        let usable = arr.map(normalize);

        // Ensure >=4 so loop feels right on small datasets
        if (usable.length > 0 && usable.length < 4) {
          while (usable.length < 4) usable = usable.concat(usable);
          usable = usable.slice(0, 4);
        }

        setItems(usable);
      })
      .catch(() => {
        setItems([]); // skeletons will show
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);


  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const $el = $(el);

    if (loading || items.length === 0) {
      if ($el.hasClass("owl-loaded")) {
        try {
          $el.trigger("destroy.owl.carousel");
          $el.find(".owl-stage-outer").children().unwrap();
          $el.removeClass("owl-loaded");
        } catch {}
      }
      return;
    }

    // Safety destroy before init (StrictMode)
    if ($el.hasClass("owl-loaded")) {
      try {
        $el.trigger("destroy.owl.carousel");
        $el.find(".owl-stage-outer").children().unwrap();
        $el.removeClass("owl-loaded");
      } catch {}
    }

    $el.owlCarousel({
      items: 4,
      slideBy: 1,
      loop: true,
      margin: 10,
      dots: false,
      nav: true,
      smartSpeed: 400,
      // Use the exact same arrow elements HotCollections uses.
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

    const HOLD_DELAY = 250;
    const STEP_INTERVAL = 160;

    const bindPressHold = ($btn, dir) => {
      let holdTimer = null;
      let repeatTimer = null;

      const start = () => {
        clearTimeout(holdTimer);
        holdTimer = setTimeout(() => {
          clearInterval(repeatTimer);
          repeatTimer = setInterval(() => {
            $el.trigger(dir === "next" ? "next.owl.carousel" : "prev.owl.carousel");
          }, STEP_INTERVAL);
        }, HOLD_DELAY);
      };

      const stop = () => {
        clearTimeout(holdTimer);
        clearInterval(repeatTimer);
        holdTimer = null;
        repeatTimer = null;
      };

      $btn.on("mousedown.owlHold touchstart.owlHold", start);
      $btn.on("mouseleave.owlHold blur.owlHold", stop);
      $(document).on("mouseup.owlHold touchend.owlHold touchcancel.owlHold", stop);

      return () => {
        stop();
        $btn.off(".owlHold");
        $(document).off(".owlHold");
      };
    };

    const $prev = $el.find(".owl-nav .owl-prev");
    const $next = $el.find(".owl-nav .owl-next");
    const unbindPrev = bindPressHold($prev, "prev");
    const unbindNext = bindPressHold($next, "next");

    return () => {
      try {
        unbindPrev && unbindPrev();
        unbindNext && unbindNext();
        if ($el.hasClass("owl-loaded")) {
          $el.trigger("destroy.owl.carousel");
        }
      } catch {}
    };
  }, [loading, items.length]);

  const showSkeleton = loading || items.length === 0;

  return (
    <section id="section-items" className="no-bottom">
      <div className="container">
        {/* Title */}
        <div className="row" data-aos="fade" style={{ visibility: "visible"}}>
          <div className="col-lg-12">
            <div className="text-center">
              <h2 data-aos="fade" style={{ visibility: "visible"}}>New Items</h2>
              <div className="small-border bg-color-2"></div>
            </div>
          </div>
        </div>

        {/* Skeletons */}
        {showSkeleton ? (
          <div className="row g-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12" key={`sk-${i}`}>
                <div className="nft__item">
                  <div className="author_list_pp">
                    <div className="skeleton-box" style={{ width: 42, height: 42, borderRadius: "50%" }} />
                  </div>
                  <div className="skeleton-box" style={{ width: "100%", height: 220, borderRadius: 12, marginTop: 8, marginBottom: 12 }} />
                  <div className="nft__item_info">
                    <div className="skeleton-box" style={{ width: "55%", height: 18, borderRadius: 9, marginBottom: 10 }} />
                    <div className="skeleton-box" style={{ width: 120, height: 14, borderRadius: 7, marginBottom: 8 }} />
                    <div className="skeleton-box" style={{ width: 80, height: 14, borderRadius: 7 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Data state: exact card markup inside Owl slides
          <div className="owl-carousel owl-theme" ref={carouselRef}>
            {items.map(
              ({ cover, avatar, title, price, likes, expiryMs, nftId, authorId }, idx) => (
                <div key={nftId ?? idx}>
                  <div className="nft__item">
                    {/* Author avatar → /author/:id */}
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

                    {/* Timer (hidden entirely if no expiry) */}
                    {expiryMs ? (
                      <div className="de_countdown">
                        <Countdown end={expiryMs} />
                      </div>
                    ) : null}

                    {/* Main preview → /item-details/:id */}
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
    </section>
  );
};

export default NewItems;
