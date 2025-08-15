// src/components/Landing/Landing.jsx
import React, { useEffect } from "react";
import NFT from "../../images/nft.png";
import backgroundImage from "../../images/bg-shape-1.jpg";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

const Landing = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,   // animation duration in ms
      once: true,      // animate only once
      easing: "ease-out-cubic",
      offset: 0,
    });
    // If content might change height dynamically, uncomment to refresh:
    // AOS.refresh();
  }, []);

  return (
    <section
      id="section-hero"
      aria-label="section"
      className="no-top no-bottom vh-100"
      data-bgimage="url(images/bg-shape-1.jpg) bottom"
      style={{ background: `url(${backgroundImage}) bottom / cover` }}
    >
      <div className="v-center">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="spacer-single"></div>

              {/* AOS on heading */}
              <h6
                className="wow fadeInUp"
                data-aos="fade-up"
                data-aos-delay="500"
                style={{ visibility: "visible"}}
              >
                <span className="text-uppercase id-color-2">
                  Ultraverse Market
                </span>
              </h6>

              <div className="spacer-10"></div>

              {/* AOS on title & paragraph */}
              <h1  data-aos="fade-up" data-aos-delay="750">
                Create, sell or collect digital items.
              </h1>
              <p className="lead" data-aos="fade-up" data-aos-delay="1000">
                Unit of data stored on a digital ledger, called a blockchain,
                that certifies a digital asset to be unique and therefore not
                interchangeable
              </p>

              <div className="spacer-10"></div>

              {/* AOS on button */}
              <Link
                className="btn-main lead"
                to="/explore"
                data-aos="fade-up"
                data-aos-delay="1250"
              >
                Explore
              </Link>

              <div className="mb-sm-30"></div>
            </div>

            {/* AOS on image */}
            <div className="col-md-6 xs-hide" data-aos="fade" data-aos-delay="1250">
              <img src={NFT} className="lazy img-fluid" alt="" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Landing;
