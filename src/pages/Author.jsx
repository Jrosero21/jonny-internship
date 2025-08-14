// src/pages/Author.jsx
// Notes (from me to future me):
// - Kept original structure/classes so we don’t fight site-wide CSS.
// - Only change is: read :id from the route, fetch author by that id, and hydrate the header.
// - Safe fallbacks are in place so the UI doesn’t break if a field is missing.

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

import AuthorBanner from "../images/author_banner.jpg";
import AuthorItems from "../components/author/AuthorItems";
import AuthorImageFallback from "../images/author_thumbnail.jpg";

const API =
  "https://us-central1-nft-cloud-functions.cloudfunctions.net/authors";

// normalize anything the function might return into what we render
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

  // fetch the author when :id changes
  useEffect(() => {
    let alive = true;
    setLoading(true);

    if (!id) {
      setAuthor(null);
      setLoading(false);
      return;
    }

    axios
      .get(`${API}?author=${encodeURIComponent(id)}`, { timeout: 8000 })
      .then(({ data }) => {
        if (!alive) return;
        // API may return an object or array — be defensive
        const raw = Array.isArray(data) ? data[0] : data;
        setAuthor(raw ? normalizeAuthor(raw) : null);
      })
      .catch((err) => {
        console.warn("author fetch failed:", err?.message || err);
        setAuthor(null);
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

  // keep your layout; just hydrate values (or show fallbacks while loading)
  const avatar = author?.avatar || AuthorImageFallback;
  const name = loading ? "Loading…" : author?.name || "Unknown Artist";
  const username = loading ? "" : author?.username || "@unknown";
  const wallet = author?.wallet || "";
  const followers = author?.followers ?? 0;

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
                  <div className="profile_follow de-flex">
                    <div className="de-flex-col">
                      <div className="profile_follower">
                        {followers.toLocaleString()} followers
                      </div>
                      <Link to="#" className="btn-main">
                        Follow
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs / items — leaving as-is; we can wire this up to the same :id next */}
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
