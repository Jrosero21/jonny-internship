import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

import EthImage from "../images/ethereum.svg";
import AuthorImage from "../images/author_thumbnail.jpg";
import NftFallback from "../images/nftImage.jpg";

// Dynamic item details endpoint
const API =
  "https://us-central1-nft-cloud-functions.cloudfunctions.net/itemDetails";

// Small helper: treat "empty" payloads consistently
function isEmptyPayload(x) {
  if (!x) return true;
  if (Array.isArray(x)) return x.length === 0 || (x.length === 1 && !x[0]);
  if (typeof x === "object") return Object.keys(x).length === 0;
  return false;
}

// Map whatever the backend returns into the exact shape our UI needs
function normalize(raw) {
  if (!raw || typeof raw !== "object") {
    // Hard fallbacks so we always render something reasonable
    return {
      image: NftFallback,
      title: "Untitled",
      description: "",
      views: 0,
      likes: 0,
      price: 0,
      owner: { id: null, name: "Unknown", avatar: AuthorImage },
      creator: { id: null, name: "Unknown", avatar: AuthorImage },
    };
  }

  const image =
    raw.nftImage || raw.image || raw.cover || raw.banner || NftFallback;

  const title = raw.title || raw.name || "Untitled";
  const description = raw.description || raw.desc || "";

  const views =
    typeof raw.views === "number" ? raw.views : Number(raw.views) || 0;

  const likes =
    typeof raw.likes === "number" ? raw.likes : Number(raw.likes) || 0;

  // Some payloads expose current price as `price`, others `currentBid`
  const price =
    typeof raw.price === "number"
      ? raw.price
      : typeof raw.currentBid === "number"
      ? raw.currentBid
      : Number(raw.price || raw.currentBid) || 0;

  // Owner can be flat or nested; cover both
  const owner = {
    id:
      raw.ownerId ??
      raw.owner_id ??
      raw.owner?.id ??
      raw.owner ??
      null,
    name:
      raw.ownerName ??
      raw.owner?.name ??
      raw.owner_username ??
      "Unknown",
    avatar:
      raw.ownerImage ??
      raw.owner?.avatar ??
      AuthorImage,
  };

  // Creator/Author also comes in a few shapes
  const creator = {
    id:
      raw.authorId ??
      raw.creatorId ??
      raw.creator?.id ??
      raw.author?.id ??
      raw.creator ??
      raw.author ??
      null,
    name:
      raw.authorName ??
      raw.creatorName ??
      raw.creator?.name ??
      raw.author?.name ??
      "Unknown",
    avatar:
      raw.authorImage ??
      raw.creatorImage ??
      raw.creator?.avatar ??
      raw.author?.avatar ??
      AuthorImage,
  };

  return { image, title, description, views, likes, price, owner, creator };
}

const ItemDetails = () => {
  // /item-details/:nftId
  const { nftId } = useParams();

  const [item, setItem] = useState(null);     // normalized item
  const [loading, setLoading] = useState(true); // skeleton flag

  // Keep existing UX: scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch + normalize
  useEffect(() => {
    let alive = true; // protect against setState after unmount

    if (!nftId) {
      setItem(null);
      setLoading(false);
      return;
    }

    const fetchItem = async () => {
      setLoading(true);
      try {
        
        let res = await axios.get(API, {
          timeout: 8000,
          params: { nftId: `"${nftId}"` },
        });
        let data = Array.isArray(res.data) ? res.data[0] : res.data;

    
        if (isEmptyPayload(data)) {
          const res2 = await axios.get(API, {
            timeout: 8000,
            params: { nftId }, 
          });
          data = Array.isArray(res2.data) ? res2.data[0] : res2.data;
        }

        if (!alive) return;
        setItem(normalize(data));
      } catch (err) {
    
        console.warn("itemDetails fetch failed:", err?.message || err);
        if (!alive) return;
        setItem(normalize(null));
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchItem();
    return () => {
      alive = false;
    };
  }, [nftId]);

  // --- Skeleton UI while axios is in-flight ---
  if (loading) {
    return (
      <div id="wrapper">
        <div className="no-bottom no-top" id="content">
          <div id="top"></div>
          <section aria-label="section" className="mt90 sm-mt-0">
            <div className="container">
              <div className="row">
                <div className="col-md-6 text-center">
                  <div
                    className="skeleton-box"
                    style={{ width: "100%", height: 420, borderRadius: 16, marginBottom: 30 }}
                  />
                </div>
                <div className="col-md-6">
                  <div className="item_info">
                    <div className="skeleton-box" style={{ width: "60%", height: 28, borderRadius: 8, marginBottom: 16 }} />
                    <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                      <div className="skeleton-box" style={{ width: 72, height: 20, borderRadius: 6 }} />
                      <div className="skeleton-box" style={{ width: 72, height: 20, borderRadius: 6 }} />
                    </div>
                    <div className="skeleton-box" style={{ width: "100%", height: 80, borderRadius: 10, marginBottom: 20 }} />
                    <div className="d-flex flex-row">
                      <div className="mr40">
                        <h6>Owner</h6>
                        <div className="item_author">
                          <div className="author_list_pp">
                            <div className="skeleton-box" style={{ width: 42, height: 42, borderRadius: "50%" }} />
                          </div>
                          <div className="author_list_info">
                            <div className="skeleton-box" style={{ width: 120, height: 16, borderRadius: 6 }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="de_tab tab_simple">
                      <div className="de_tab_content">
                        <h6>Creator</h6>
                        <div className="item_author">
                          <div className="author_list_pp">
                            <div className="skeleton-box" style={{ width: 42, height: 42, borderRadius: "50%" }} />
                          </div>
                          <div className="author_list_info">
                            <div className="skeleton-box" style={{ width: 120, height: 16, borderRadius: 6 }} />
                          </div>
                        </div>
                      </div>
                      <div className="spacer-40"></div>
                      <h6>Price</h6>
                      <div className="nft-item-price" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img src={EthImage} alt="" />
                        <div className="skeleton-box" style={{ width: 80, height: 20, borderRadius: 6 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* scoped shimmer for skeleton boxes */}
              <style>{`
                .skeleton-box{position:relative;overflow:hidden;background:#f1f3f5}
                .skeleton-box::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:shimmer 1.2s infinite}
                @keyframes shimmer{100%{transform:translateX(100%)}}
              `}</style>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // --- Data state ---
  const { image, title, description, views, likes, price, owner, creator } =
    item || normalize(null);

  return (
    <div id="wrapper">
      <div className="no-bottom no-top" id="content">
        <div id="top"></div>

        {/* Layout kept as provided by the theme */}
        <section aria-label="section" className="mt90 sm-mt-0">
          <div className="container">
            <div className="row">
              {/* Left: NFT image */}
              <div className="col-md-6 text-center">
                <img
                  src={image}
                  className="img-fluid img-rounded mb-sm-30 nft-image"
                  alt={title}
                />
              </div>

              {/* Right: metadata */}
              <div className="col-md-6">
                <div className="item_info">
                  <h2>{title}</h2>

                  <div className="item_info_counts">
                    <div className="item_info_views">
                      <i className="fa fa-eye"></i>
                      {views}
                    </div>
                    <div className="item_info_like">
                      <i className="fa fa-heart"></i>
                      {likes}
                    </div>
                  </div>

                  <p>{description}</p>

                  {/* Owner */}
                  <div className="d-flex flex-row">
                    <div className="mr40">
                      <h6>Owner</h6>
                      <div className="item_author">
                        <div className="author_list_pp">
                          <Link to={owner?.id != null ? `/author/${owner.id}` : "/author"}>
                            <img className="lazy" src={owner?.avatar || AuthorImage} alt={owner?.name || "Owner"} />
                            <i className="fa fa-check"></i>
                          </Link>
                        </div>
                        <div className="author_list_info">
                          <Link to={owner?.id != null ? `/author/${owner.id}` : "/author"}>
                            {owner?.name || "Owner"}
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div></div>
                  </div>

                  {/* Creator */}
                  <div className="de_tab tab_simple">
                    <div className="de_tab_content">
                      <h6>Creator</h6>
                      <div className="item_author">
                        <div className="author_list_pp">
                          <Link to={creator?.id != null ? `/author/${creator.id}` : "/author"}>
                            <img className="lazy" src={creator?.avatar || AuthorImage} alt={creator?.name || "Creator"} />
                            <i className="fa fa-check"></i>
                          </Link>
                        </div>
                        <div className="author_list_info">
                          <Link to={creator?.id != null ? `/author/${creator.id}` : "/author"}>
                            {creator?.name || "Creator"}
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="spacer-40"></div>

                    {/* Price */}
                    <h6>Price</h6>
                    <div className="nft-item-price">
                      <img src={EthImage} alt="" />
                      <span>{price}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* /right */}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ItemDetails;
