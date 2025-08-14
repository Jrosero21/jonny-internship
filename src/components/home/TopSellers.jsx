import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import AuthorImage from "../../images/author_thumbnail.jpg";

// cloud function used for this section
const API =
  "https://us-central1-nft-cloud-functions.cloudfunctions.net/topSellers";

function normalizeSeller(raw, idx) {
  const avatar =
    raw?.authorImage || raw?.avatar || raw?.img || AuthorImage;

  const name =
    raw?.authorName || raw?.name || raw?.username || "Unnamed";

  // try a few common numeric fields; coerce to number
  const totalNum =
    Number(raw?.total) ||
    Number(raw?.sales) ||
    Number(raw?.volume) ||
    Number(raw?.price) ||
    0;

  const authorId = raw?.authorId ?? raw?.id ?? idx;

  return {
    avatar,
    name,
    totalNum,
    totalLabel: `${(isNaN(totalNum) ? 0 : totalNum).toFixed(1)} ETH`,
    authorId,
  };
}

const TopSellers = () => {
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    let alive = true;

    // axios fetch; if this fails we just render an empty list (no skeleton yet)
    axios
      .get(API, { timeout: 8000 })
      .then(({ data }) => {
        if (!alive) return;

        const arr = Array.isArray(data) ? data : [];
        const normalized = arr.map(normalizeSeller);

        // sort by total desc and cap to 12 (design shows 12 rows)
        normalized.sort((a, b) => b.totalNum - a.totalNum);
        setSellers(normalized.slice(0, 12));
      })
      .catch((err) => {
        console.warn("topSellers axios failed:", err?.message || err);
        setSellers([]); // nothing to render; fine for step 1
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="section-popular" className="pb-5">
      <div className="container">
        <div className="row">
          {/* title stays exactly like the template */}
          <div className="col-lg-12">
            <div className="text-center">
              <h2>Top Sellers</h2>
              <div className="small-border bg-color-2"></div>
            </div>
          </div>

          {/* ordered list prints the 1..12 */}
          <div className="col-md-12">
            <ol className="author_list">
              {sellers.map(({ avatar, name, totalLabel, authorId }, index) => (
                <li key={authorId ?? index}>
                  <div className="author_list_pp">
                    {/* clicking avatar or name should go to /author/:id */}
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
    </section>
  );
};

export default TopSellers;
