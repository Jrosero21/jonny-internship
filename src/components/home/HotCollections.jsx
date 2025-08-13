// src/components/home/HotCollections.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import $ from "jquery";

import AuthorImage from "../../images/author_thumbnail.jpg";
import nftImage from "../../images/nftImage.jpg";

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

const API =
  "https://us-central1-nft-cloud-functions.cloudfunctions.net/hotCollections";

function normalizeItem(raw, idx) {
  const cover =
    raw?.nftImage || raw?.image || raw?.cover || raw?.banner || nftImage;
  const avatar =
    raw?.authorImage || raw?.author?.avatar || raw?.avatar || AuthorImage;
  const title = raw?.name || raw?.title || raw?.collectionName || "Pinky Ocean";
  const codeRaw = raw?.code || raw?.symbol || raw?.standard || "ERC-192";
  const codeStr = String(codeRaw);
  const code = codeStr.toUpperCase().includes("ERC")
    ? codeStr.toUpperCase()
    : `ERC-${codeStr}`;
  const nftId = raw?.nftId ?? raw?.id ?? idx;
  const authorId = raw?.authorId ?? raw?.author?.id ?? idx;
  return { cover, avatar, title, code, nftId, authorId };
}

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function slideHTML({ cover, avatar, title, code, nftId, authorId }) {
  return `
    <div>
      <div class="nft_coll">
        <div class="nft_wrap">
          <a href="/item-details/${esc(nftId)}">
            <img src="${esc(cover)}" class="lazy img-fluid" alt="${esc(
    title
  )}" />
          </a>
        </div>
        <div class="nft_coll_pp">
          <a href="/author/${esc(authorId)}">
            <img class="lazy pp-coll" src="${esc(avatar)}" alt="${esc(
    title
  )} author" />
          </a>
          <i class="fa fa-check"></i>
        </div>
        <div class="nft_coll_info">
          <a href="/explore"><h4>${esc(title)}</h4></a>
          <span>${esc(code)}</span>
        </div>
      </div>
    </div>
  `;
}

const HotCollections = () => {
  const [items, setItems] = useState([]);
  const carouselRef = useRef(null);

  useEffect(() => {
    let alive = true;
    axios
      .get(API, { timeout: 8000 })
      .then(({ data }) => {
        if (!alive) return;
        const arr = Array.isArray(data) ? data.slice(0, 12) : [];
        setItems(arr.map(normalizeItem));
      })
      .catch((err) => {
        console.warn("hotCollections axios failed:", err?.message || err);
        setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const $el = $(el);

    const data =
      items.length > 0
        ? items.slice(0, 12)
        : new Array(4).fill(0).map((_, i) => normalizeItem({}, i));

    if (typeof $el.owlCarousel === "function" && $el.data("owl.carousel")) {
      $el.trigger("destroy.owl.carousel");
    }
    $el.empty();
    $el.html(data.map(slideHTML).join(""));

    if (typeof $el.owlCarousel === "function") {
      $el.owlCarousel({
        items: 4,
        margin: 10,
        loop: true,
        nav: true,
        dots: false,
        slideBy: 1,
        smartSpeed: 400,
        // THIN arrows (‹ ›) instead of heavy FA chevrons
        navText: [
          '<span class="hc-arrow" aria-hidden="true">&#8249;</span>',
          '<span class="hc-arrow" aria-hidden="true">&#8250;</span>',
        ],
        responsive: {
          0: { items: 1 },
          576: { items: 2 },
          992: { items: 3 },
          1200: { items: 4 },
        },
      });
    }

    return () => {
      if ($el.data("owl.carousel")) $el.trigger("destroy.owl.carousel");
      $el.empty();
    };
  }, [items]);

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

        <div className="owl-carousel owl-theme" ref={carouselRef} />

        {/* Scoped arrow-only tweak */}
        <style>{`
          #section-collections .owl-nav button.owl-prev,
  #section-collections .owl-nav button.owl-next{
    display: inline-flex;              /* centers contents inside the white circle */
    align-items: center;
    justify-content: center;
  }

  #section-collections .owl-nav .hc-arrow{
    font-size: 22px;                   /* was 20px */
    line-height: 1;                    /* no extra vertical offset */
    font-weight: 600;                  /* still slim, not bold */
    display: inline-block;
          }
        `}</style>
      </div>
    </section>
  );
};

export default HotCollections;
