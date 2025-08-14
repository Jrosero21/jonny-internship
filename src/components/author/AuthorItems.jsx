import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

import AuthorImageFallback from "../../images/author_thumbnail.jpg";
import NftImageFallback from "../../images/nftImage.jpg";

const API = "https://us-central1-nft-cloud-functions.cloudfunctions.net/authors";

// find the items array regardless of how the CF wraps it
function getItems(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const keys = ["nftItems", "nftCollection", "items", "nfts", "created"];
    for (const k of keys) if (Array.isArray(data[k])) return data[k];
    // last resort: first array property we can find
    for (const k of Object.keys(data)) {
      if (Array.isArray(data[k])) return data[k];
    }
  }
  return [];
}

// normalize one card’s props
function normalizeItem(raw, idx, authorMeta) {
  const cover =
    raw?.nftImage || raw?.image || raw?.cover || raw?.banner || NftImageFallback;
  const title = raw?.title || raw?.name || "Untitled";
  const price =
    typeof raw?.price === "number" ? raw.price : Number(raw?.price) || 0;
  const likes =
    typeof raw?.likes === "number" ? raw.likes : Number(raw?.likes) || 0;
  const nftId = raw?.nftId ?? raw?.id ?? idx;

  return {
    cover,
    title,
    price,
    likes,
    nftId,
    author: {
      id: raw?.authorId ?? raw?.author?.id ?? authorMeta.id ?? null,
      avatar:
        raw?.authorImage ||
        raw?.author?.avatar ||
        authorMeta.avatar ||
        AuthorImageFallback,
    },
  };
}

const AuthorItems = () => {
  const { id } = useParams(); // /author/:id
  const [items, setItems] = useState([]);
  const [authorMeta, setAuthorMeta] = useState({
    id: null,
    avatar: AuthorImageFallback,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);

    axios
      .get(API, {
        timeout: 8000,
        params: { author: id }, // <- no quotes; API expects raw id
      })
      .then(({ data }) => {
        if (!alive) return;

        const rawItems = getItems(data);

        // lift page-level author meta if present, else infer from the first item
        const meta = { id, avatar: AuthorImageFallback };
        if (data && typeof data === "object") {
          meta.id = data.authorId ?? data.id ?? id;
          meta.avatar = data.authorImage || data.avatar || meta.avatar;
        }
        if (rawItems.length) {
          const f = rawItems[0] || {};
          meta.id = f.authorId ?? f.author?.id ?? meta.id;
          meta.avatar = f.authorImage || f.author?.avatar || meta.avatar;
        }
        setAuthorMeta(meta);

        setItems(rawItems.map((r, i) => normalizeItem(r, i, meta)));
      })
      .catch((err) => {
        console.warn("Author items fetch failed:", err?.message || err);
        setItems([]);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="row">
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
                    height: 220,
                    borderRadius: 12,
                    marginTop: 8,
                    marginBottom: 12,
                  }}
                />
                <div className="nft__item_info">
                  <div
                    className="skeleton-box"
                    style={{
                      height: 18,
                      width: "60%",
                      borderRadius: 6,
                      marginBottom: 10,
                    }}
                  />
                  <div
                    className="skeleton-box"
                    style={{ height: 14, width: 80, borderRadius: 6 }}
                  />
                </div>
              </div>
            </div>
          ))
        : items.map(({ cover, title, price, likes, nftId, author }, index) => (
            <div
              key={nftId ?? index}
              className="d-item col-lg-3 col-md-6 col-sm-6 col-xs-12"
              style={{ display: "block", backgroundSize: "cover" }}
            >
              <div className="nft__item">
                {/* Author avatar (clickable back to author page) */}
                <div className="author_list_pp">
                  <Link
                    to={
                      (author?.id ?? authorMeta.id) != null
                        ? `/author/${author?.id ?? authorMeta.id}`
                        : "/author"
                    }
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Creator"
                  >
                    <img
                      className="lazy"
                      src={author?.avatar || authorMeta.avatar}
                      alt="author avatar"
                    />
                    <i className="fa fa-check"></i>
                  </Link>
                </div>

                {/* NFT media */}
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

                {/* Meta */}
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

      {!loading && items.length === 0 && (
        <div className="col-12 text-center text-muted py-4">No items found.</div>
      )}
    </div>
  );
};

export default AuthorItems;
