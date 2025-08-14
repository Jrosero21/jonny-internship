import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AuthorImage from "../../images/author_thumbnail.jpg";

const API =
  "https://us-central1-nft-cloud-functions.cloudfunctions.net/topSellers";

// Normalize the payload so our render stays
function normalizeSeller(raw, idx) {
  const avatar = raw?.authorImage || raw?.avatar || raw?.img || AuthorImage;
  const name = raw?.authorName || raw?.name || raw?.username || "Unnamed";
  const totalNum =
    Number(raw?.total) ||
    Number(raw?.sales) ||
    Number(raw?.volume) ||
    Number(raw?.price) ||
    0;
  const authorId = raw?.authorId ?? raw?.id ?? idx;
  return { avatar, name, authorId, totalNum, totalLabel: `${totalNum.toFixed(1)} ETH` };
}

const TopSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch + sort once on mount
  useEffect(() => {
    let alive = true;
    setLoading(true);

    axios
      .get(API, { timeout: 8000 })
      .then(({ data }) => {
        if (!alive) return;
        const list = (Array.isArray(data) ? data : []).map(normalizeSeller);
        list.sort((a, b) => b.totalNum - a.totalNum); // high → low
        setSellers(list.slice(0, 12)); // comp shows 12 rows
      })
      .catch((err) => {
        console.warn("topSellers axios failed:", err?.message || err);
        setSellers([]); 
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // Render 12 skeleton rows while loading so the page doesn't jump
  const showSkeleton = loading;

  return (
    <section id="section-popular" className="pb-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="text-center">
              <h2>Top Sellers</h2>
              <div className="small-border bg-color-2"></div>
            </div>
          </div>

          <div className="col-md-12">
            <ol className="author_list">
              {showSkeleton
                ? // ---- Skeleton state (12 rows) ----
                  Array.from({ length: 12 }).map((_, idx) => (
                    <li key={`sk-${idx}`}>
                      <div className="author_list_pp">
                        <div className="sk-pp" aria-hidden="true" />
                      </div>
                      <div className="author_list_info">
                        <div className="sk-line sk-name" aria-hidden="true" />
                        <div className="sk-line sk-eth" aria-hidden="true" />
                      </div>
                    </li>
                  ))
                : // ---- Data state ----
                  sellers.map(({ avatar, name, totalLabel, authorId }, idx) => (
                    <li key={authorId ?? idx}>
                      <div className="author_list_pp">
                        <Link to={`/author/${authorId}`}>
                          <img className="lazy pp-author" src={avatar} alt={name} />
                          <i className="fa fa-check"></i>
                        </Link>
                      </div>
                      <div className="author_list_info">
                        <Link to={`/author/${authorId}`}>{name}</Link>
                        <span>{totalLabel}</span>
                      </div>
                    </li>
                  ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Scoped skeleton styles.
         Keeping it tiny and self-contained so we don't spill global CSS. */}
      <style>{`
        /* Base shimmer */
        .sk-pp,
        .sk-line {
          position: relative;
          overflow: hidden;
          background: #f1f3f5;
        }
        .sk-pp::after,
        .sk-line::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: sk-shimmer 1.1s infinite;
        }
        @keyframes sk-shimmer {
          100% { transform: translateX(100%); }
        }

        /* Avatar circle roughly matches .pp-author sizing */
        .sk-pp {
          width: 56px;
          height: 56px;
          border-radius: 9999px;
        }

        /* Text lines approximate name + ETH row heights/widths */
        .sk-line {
          height: 16px;
          border-radius: 8px;
        }
        .sk-name { width: 180px; margin-bottom: 8px; }
        .sk-eth  { width: 70px;  opacity: 0.8; }
        
        /* Small tweak so long names don't push the ETH down while loading */
        .author_list_info .sk-line { display: block; }
      `}</style>
    </section>
  );
};

export default TopSellers;
