// src/pages/Author.jsx
// Notes (from me to future me):
// - Kept original structure/classes so we don’t fight site-wide CSS.
// - Read :id from the route, fetch author, hydrate the header.
// - Added a front-end only Follow/Unfollow toggle:
//   * Button label switches between "Follow" and "Unfollow"
//   * Follower count increments/decrements locally (no backend)
//   * Resets when the route :id changes
// - Safe fallbacks in place so the UI doesn’t break if a field is missing.

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

import AuthorBanner from "../images/author_banner.jpg";
import AuthorItems from "../components/author/AuthorItems";
import AuthorImageFallback from "../images/author_thumbnail.jpg";

const API =
  "https://us-central1-nft-cloud-functions.cloudfunctions.net/authors";

// Normalize anything the function might return into what we render
function normalizeAuthor(raw) {
  return {
    name: raw?.name || raw?.authorName || "Unknown Artist",
    username: raw?.tag || raw?.username || "@unknown",
    wallet: raw?.wallet || raw?.address || "",
    followers:
      typeof raw?.followers === "number"
        ? raw.followers
        : Number(raw?.followers) || 0,
    avatar: raw?.authorImage || raw?.avatar || AuthorImageFallback,
  };
}

const Author = () => {
  const { id } = useParams(); // /author/:id

  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Follow UI state (front-end only) ---
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Fetch the author when :id changes
  useEffect(() => {
    let alive = true;
    setLoading(true);

    if (!id) {
      setAuthor(null);
      setFollowerCount(0);
      setIsFollowing(false);
      setLoading(false);
      return;
    }

    axios
      .get(`${API}?author=${encodeURIComponent(id)}`, { timeout: 8000 })
      .then(({ data }) => {
        if (!alive) return;
        // API may return an object or array — be defensive
        const raw = Array.isArray(data) ? data[0] : data;
        const norm = raw ? normalizeAuthor(raw) : null;
        setAuthor(norm);

        // Reset follow UI on author switch
        setIsFollowing(false);
        setFollowerCount(norm?.followers ?? 0);
      })
      .catch((err) => {
        console.warn("author fetch failed:", err?.message || err);
        setAuthor(null);
        setIsFollowing(false);
        setFollowerCount(0);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const handleCopy = () => {
    if (!author?.wallet) return;
    try {
      navigator.clipboard.writeText(author.wallet);
    } catch {
      // noop
    }
  };

  // Front-end only follow toggle
  const handleToggleFollow = () => {
    // If we don't have initial data yet, do nothing
    if (loading) return;

    setFollowerCount((prev) => {
      // Increase when following, decrease when unfollowing (never < 0)
      if (!isFollowing) return prev + 1;
      return Math.max(0, prev - 1);
    });
    setIsFollowing((prev) => !prev);
  };

  // Keep your layout; just hydrate values (or show fallbacks while loading)
  const avatar = author?.avatar || AuthorImageFallback;
  const name = loading ? "Loading…" : author?.name || "Unknown Artist";
  const username = loading ? "" : author?.username || "@unknown";
  const wallet = author?.wallet || "";

  return (
    <div id="wrapper">
      <div className="no-bottom no-top" id="content">
        <div id="top"></div>

        <section
          id="profile_banner"
          aria-label="section"
          className="text-light"
          data-bgimage="url(images/author_banner.jpg) top"
          style={{ background: `url(${AuthorBanner}) top` }}
        ></section>

        <section aria-label="section">
          <div className="container">
            <div className="row">
              {/* Header */}
              <div className="col-md-12">
                <div className="d_profile de-flex">
                  <div className="de-flex-col">
                    <div className="profile_avatar">
                      <img src={avatar} alt={name} />
                      <i className="fa fa-check"></i>

                      <div className="profile_name">
                        <h4>
                          {name}
                          {username && (
                            <span className="profile_username">{username}</span>
                          )}
                          {wallet && (
                            <span id="wallet" className="profile_wallet">
                              {wallet}
                            </span>
                          )}
                          <button id="btn_copy" title="Copy Text" onClick={handleCopy}>
                            Copy
                          </button>
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Followers + Follow/Unfollow (front-end only) */}
                  <div className="profile_follow de-flex">
                    <div className="de-flex-col">
                      <div className="profile_follower">
                        {followerCount.toLocaleString()} followers
                      </div>

                      {/* Using a button so there's no navigation; keep theme class for styling */}
                      <button
                        type="button"
                        className="btn-main"
                        onClick={handleToggleFollow}
                        aria-pressed={isFollowing}
                        disabled={loading}
                      >
                        {isFollowing ? "Unfollow" : "Follow"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs / items (unchanged) */}
              <div className="col-md-12">
                <div className="de_tab tab_simple">
                  <AuthorItems />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Author;
