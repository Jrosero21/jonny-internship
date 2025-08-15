import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const LandingIntro = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,            // animate once and remain visible
      easing: "ease-out-cubic",
      offset: 120,
    });
  }, []);

  return (
    <section id="section-intro" className="no-top no-bottom">
      <div className="container">
        <div className="row">
          {/* Box 1 */}
          <div className="col-lg-4 col-md-6 mb-sm-30">
            <div className="feature-box f-boxed style-3">
              {/* Only CONTENT fades up */}
              <i
                className="bg-color-2 i-boxed icon_wallet"
                data-aos="fade-up"
                data-aos-delay="250"
              ></i>
              <div className="text" data-aos="fade-up" data-aos-delay="250">
                <h4>Set up your wallet</h4>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium doloremque laudantium, totam rem.
                </p>
              </div>
              <i
                className="wm icon_wallet"
                data-aos="fade-up"
                data-aos-delay="250"
              ></i>
            </div>
          </div>

          {/* Box 2 */}
          <div className="col-lg-4 col-md-6 mb-sm-30">
            <div className="feature-box f-boxed style-3">
              <i
                className="bg-color-2 i-boxed icon_cloud-upload_alt"
                data-aos="fade-up"
                data-aos-delay="250"
              ></i>
              <div className="text" data-aos="fade-up" data-aos-delay="250">
                <h4>Add your NFT&apos;s</h4>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium doloremque laudantium, totam rem.
                </p>
              </div>
              <i
                className="wm icon_cloud-upload_alt"
                data-aos="fade-up"
                data-aos-delay="250"
              ></i>
            </div>
          </div>

          {/* Box 3 */}
          <div className="col-lg-4 col-md-6 mb-sm-30">
            <div className="feature-box f-boxed style-3">
              <i
                className="bg-color-2 i-boxed icon_tags_alt"
                data-aos="fade-up"
                data-aos-delay="250"
              ></i>
              <div className="text" data-aos="fade-up" data-aos-delay="250">
                <h4>Sell your NFT&apos;s</h4>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium doloremque laudantium, totam rem.
                </p>
              </div>
              <i
                className="wm icon_tags_alt"
                data-aos="fade-up"
                data-aos-delay="250"
              ></i>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingIntro;
