import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const products = [
  {
    id: "girl",
    title: "SMR Girl Glow",
    tag: "100 AI Photo Editing Prompts",
    price: 19,
    desc: "Create new photo aesthetics from your existing pictures.",
  },
  {
    id: "men",
    title: "SMR Men Style",
    tag: "100 AI Photo Editing Prompts",
    price: 19,
    desc: "Explore luxury, streetwear, travel, fitness and cinematic styles.",
  },
  {
    id: "growth",
    title: "SMR Insta Growth",
    tag: "30-Day Instagram Growth System",
    price: 19,
    desc: "Hooks, content ideas, captions, CTAs and a practical 30-day system.",
  },
  {
    id: "bundle",
    title: "SMR Creator Starter",
    tag: "3-in-1 Creator Toolkit",
    price: 29,
    desc: "Girl Glow + Men Style + Insta Growth in one starter bundle.",
    best: true,
  },
];

function App() {
  const [selected, setSelected] = useState("bundle");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const product = products.find((x) => x.id === selected);

  const startPayment = async () => {
    setError("");
    setSuccess(null);

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      // 1. Get Razorpay public key
      const configResponse = await fetch(
        "http://localhost:5000/api/config"
      );

      const config = await configResponse.json();

      if (!config.success || !config.razorpayKeyId) {
        throw new Error("Razorpay configuration is missing.");
      }

      // 2. Create server-side Razorpay order
      const orderResponse = await fetch(
        "http://localhost:5000/api/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.id,
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(
          orderData.message || "Unable to create payment order."
        );
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: config.razorpayKeyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "SMR Creator Lab",
        description: orderData.order.productName,
        order_id: orderData.order.id,

        prefill: {
          email: email,
        },

        theme: {
          color: "#8b7cff",
        },

        handler: async function (response) {
          try {
            setLoading(true);

            // 4. Verify payment on backend
            const verifyResponse = await fetch(
              "http://localhost:5000/api/verify-payment",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  productId: product.id,
                  email: email,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyData.success) {
              throw new Error(
                verifyData.message || "Payment verification failed."
              );
            }

            // 5. Show secure delivery
            setSuccess({
              paymentId: verifyData.paymentId,
              productName:
                verifyData.productName || product.title,
              downloadUrl: verifyData.downloadUrl || null,
            });
          } catch (err) {
            setError(err.message || "Payment verification failed.");
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout could not be loaded.");
      }

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function () {
        setError("Payment failed. Please try again.");
        setLoading(false);
      });

      razorpay.open();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <div className="brand">
          <span>SMR</span> CREATOR LAB
        </div>

        <a href="#products">Products</a>
        <a href="#how">How it works</a>
      </header>

      <main>
        <section className="hero">
          <div className="pill">
            CREATOR TOOLS · STARTING AT ₹19
          </div>

          <h1>
            Your photos.
            <br />
            <em>Your style.</em>
            <br />
            Your creator era.
          </h1>

          <p>
            Simple digital tools for better-looking photos,
            stronger content and smarter Instagram growth.
          </p>

          <a className="cta" href="#products">
            Explore the Creator Lab ↓
          </a>

          <div className="trust">
            Instant digital access · One-time payment · No subscription
          </div>
        </section>

        <section id="products" className="section">
          <div className="sectionHead">
            <span>01 / SHOP</span>
            <h2>Pick your creator tool.</h2>
          </div>

          <div className="grid">
            {products.map((item) => (
              <article
                className={"card " + (item.best ? "best" : "")}
                key={item.id}
              >
                {item.best && (
                  <div className="besttag">BEST VALUE</div>
                )}

                <div className="icon">✦</div>

                <h3>{item.title}</h3>

                <div className="tag">{item.tag}</div>

                <p>{item.desc}</p>

                <div className="price">₹{item.price}</div>

                <button
                  onClick={() => {
                    setSelected(item.id);
                    setSuccess(null);
                    setError("");

                    setTimeout(() => {
                      document
                        .getElementById("checkout")
                        ?.scrollIntoView({
                          behavior: "smooth",
                        });
                    }, 50);
                  }}
                >
                  Get this
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="story">
          <div>
            <span>02 / WHY</span>

            <h2>
              You don't need to be a professional editor
              to create better.
            </h2>
          </div>

          <p>
            Maybe you have great photos sitting in your gallery.
            Maybe you want a new look but don't know what prompt
            to use. Maybe you know you should post, but don't know
            what to post. SMR Creator Lab turns those moments into
            simple, ready-to-use creator tools.
          </p>
        </section>

        <section id="how" className="how">
          <span>03 / SIMPLE</span>

          <h2>Choose. Pay. Create.</h2>

          <div className="steps">
            <div>
              <b>01</b>
              <h3>Choose</h3>
              <p>Pick the tool that fits your goal.</p>
            </div>

            <div>
              <b>02</b>
              <h3>Pay</h3>
              <p>Complete your secure checkout.</p>
            </div>

            <div>
              <b>03</b>
              <h3>Access</h3>
              <p>Get your digital product after payment.</p>
            </div>
          </div>
        </section>

        <section id="checkout" className="checkout">
          <div>
            <span>04 / CHECKOUT</span>

            <h2>Start creating today.</h2>

            <p>
              Selected: <strong>{product.title}</strong> · ₹
              {product.price}
            </p>
          </div>

          <div className="checkoutBox">
            <label>Email for delivery</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <button
              className="pay"
              onClick={startPayment}
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : `Pay ₹${product.price}`}
            </button>

            {error && (
              <div
                style={{
                  marginTop: "14px",
                  color: "#ff7b7b",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            <small>
              Secure Razorpay checkout · One-time payment
            </small>
          </div>
        </section>

        {success && (
          <section className="success">
            <h2>Payment verified. ✨</h2>

            <p>
              Your payment for{" "}
              <strong>{success.productName}</strong> has been
              successfully verified.
            </p>

            <p>
              Payment ID: <strong>{success.paymentId}</strong>
            </p>

            {success.downloadUrl ? (
              <>
                <a
                  className="cta"
                  href={success.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "12px",
                  }}
                >
                  Download Your Product ↓
                </a>

                <p style={{ marginTop: "18px" }}>
                  Your secure download link is ready.
                </p>
              </>
            ) : (
              <p>
                Payment verified, but the secure download URL
                was not returned by the server yet.
              </p>
            )}
          </section>
        )}
      </main>

      <footer>
        <div className="brand">
          <span>SMR</span> CREATOR LAB
        </div>

        <p>Create Better. Look Better. Grow Smarter.</p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);