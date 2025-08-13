import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// Local fallback images (used if API doesn't provide these values)
import AuthorFallback from "../../images/author_thumbnail.jpg";
import NftFallback from "../../images/nftImage.jpg";

// API endpoint for fetching hot NFT collections
const API =
  "https://us-central1-nft-cloud-functions.cloudfunctions.net/hotCollections";

const HotCollections = () => {
  // Store collections from the API
  const [collections, setCollections] = useState([]);
  // Loading state to show placeholders before data arrives
  const [loading, setLoading] = useState(true);
  // Error message state if API request fails
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true; // Prevents state updates if component unmounts

    // Fetch data from the Hot Collections API
    (async () => {
      try {
        const { data } = await axios.get(API, { timeout: 5000 }); // 5s timeout
        if (mounted) {
          // Ensure we only take the first 6 items
          setCollections(Array.isArray(data) ? data.slice(0, 6) : []);
        }
      } catch (e) {
        // Capture and display an error message
        if (mounted) setErr("Could not load hot collections.");
        console.error(e);
      } finally {
        // Stop showing the loading skeletons
        if (mounted) setLoading(false);
      }
    })();

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="section-collections" className="no-bottom">
      <div className="container">
        <div className="row">
          {/* Section title */}
          <div className="col-lg-12">
            <div className="text-center">
              <h2>Hot Collections</h2>
              <div className="small-border bg-color-2"></div>
            </div>
          </div>

          {/* --- LOADING SKELETONS --- */}
          {loading &&
            new Array(6).fill(0).map((_, i) => (
              <div
                className="col-lg-3 col-md-6 col-sm-6 col-xs-12"
                key={`skeleton-${i}`}
              >
                <div className="nft_coll">
                  {/* Placeholder for collection image */}
                  <div
                    className="nft_wrap"
                    style={{ background: "#f3f3f3", height: 180 }}
                  />
                  {/* Placeholder for author avatar */}
                  <div className="nft_coll_pp">
                    <div
                      className="pp-coll"
                      style={{
                        width: 50,
                        height: 50,
                        background: "#eee",
                        borderRadius: "50%",
                      }}
                    />
                  </div>
                  {/* Placeholder for title & code */}
                  <div className="nft_coll_info">
                    <div
                      style={{
                        width: 120,
                        height: 18,
                        background: "#eee",
                        marginBottom: 6,
                      }}
                    />
                    <div
                      style={{
                        width: 60,
                        height: 14,
                        background: "#f1f1f1",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

          {/* --- ERROR MESSAGE --- */}
          {!loading && err && (
            <div className="col-12">
              <p className="text-center text-danger">{err}</p>
            </div>
          )}

          {/* --- COLLECTION CARDS --- */}
          {!loading &&
            !err &&
            collections.map((c, index) => {
              // Resolve collection image, avatar, title, and code with fallbacks
              const coverImg =
                c?.nftImage || c?.image || c?.cover || c?.banner || NftFallback;
              const avatar =
                c?.authorImage ||
                c?.author?.avatar ||
                c?.avatar ||
                AuthorFallback;
              const title =
                c?.name || c?.title || c?.collectionName || "Untitled";
              const code =
                c?.code || c?.symbol || c?.standard || "ERC-721";
              const nftId = c?.nftId ?? c?.id;
              const authorId = c?.authorId ?? c?.author?.id;

              return (
                <div
                  className="col-lg-3 col-md-6 col-sm-6 col-xs-12"
                  key={nftId ?? index}
                >
                  <div className="nft_coll">
                    {/* Collection image */}
                    <div className="nft_wrap">
                      <Link
                        to={nftId ? `/item-details/${nftId}` : "/item-details"}
                      >
                        <img
                          src={coverImg}
                          className="lazy img-fluid"
                          alt={title}
                        />
                      </Link>
                    </div>

                    {/* Author avatar */}
                    <div className="nft_coll_pp">
                      <Link
                        to={authorId ? `/author/${authorId}` : "/author"}
                      >
                        <img
                          className="lazy pp-coll"
                          src={avatar}
                          alt={`${title} author`}
                        />
                      </Link>
                      <i className="fa fa-check"></i>
                    </div>

                    {/* Collection info */}
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
      </div>
    </section>
  );
};

export default HotCollections;
