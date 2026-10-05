import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const modelImages = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=88",
];

const fallbackProducts = [
  { id: "girl", number: "01", title: "SMR Girl Glow", tag: "100 AI Photo Editing Prompts", price: 19, desc: "Beauty, luxury, cinematic and Instagram-ready visual directions.", image: modelImages[0], type: "pdf", published: true },
  { id: "men", number: "02", title: "SMR Men Style", tag: "100 AI Photo Editing Prompts", price: 19, desc: "Streetwear, fitness, travel, luxury and cinematic creator styles.", image: modelImages[1], type: "pdf", published: true },
  { id: "growth", number: "03", title: "SMR Insta Growth", tag: "30-Day Instagram Growth System", price: 19, desc: "Hooks, content ideas, captions, CTAs and a practical growth system.", image: modelImages[4], type: "pdf", published: true },
  { id: "bundle", number: "04", title: "SMR Creator Starter", tag: "3-in-1 Creator Toolkit", price: 29, desc: "Girl Glow + Men Style + Insta Growth in one starter bundle.", image: modelImages[6], type: "pdf", published: true, best: true },
];

const showcase = [
  ["female","FEMALE","Luxury Portrait","Indian Gen-Z editorial energy",modelImages[0]],
  ["male","MALE","Streetwear Editorial","Delhi / Mumbai street-style direction",modelImages[1]],
  ["female","FEMALE","Beauty Campaign","Clean beauty + creator aesthetic",modelImages[2]],
  ["male","MALE","Luxury Lifestyle","Premium founder / lifestyle mood",modelImages[3]],
  ["female","FEMALE","Travel Creator","Cinematic Indian travel direction",modelImages[4]],
  ["male","MALE","Fitness Campaign","High-energy fitness creator",modelImages[5]],
  ["female","FEMALE","Cinematic Portrait","Reels-cover cinematic mood",modelImages[6]],
  ["male","MALE","Creator Portrait","Modern Instagram-ready look",modelImages[7]],
  ["female","FEMALE","Soft Editorial","Minimal premium fashion mood",modelImages[8]],
  ["male","MALE","Executive Style","Young Indian founder energy",modelImages[9]],
  ["female","FEMALE","Creator Beauty","Social-first beauty direction",modelImages[10]],
  ["male","MALE","Modern Classic","Timeless modern creator look",modelImages[11]],
].map(([type,category,title,text,image]) => ({type,category,title,text,image}));

const faqs = [
  ["What is the ₹1 Daily Drop?", "Every day SMR Creator Lab can publish one or two focused premium prompts. Each Daily Drop is designed around a fresh visual trend, content idea or business strategy and is sold as a one-time ₹1 purchase."],
  ["Can I buy older Daily Drops?", "Yes. Published drops stay in the lab library unless you choose to archive them from the admin panel."],
  ["Is this a subscription?", "No. The core Daily Drops are one-time purchases. You only pay for the prompt or product you choose."],
  ["How is payment processed?", "Checkout is handled through Razorpay and payment verification happens on the server before digital access is delivered."],
  ["Who created SMR Creator Lab?", "SMR Creator Lab is created and curated by Mr. Samar Raj."],
];

function track(event, productId = null) {
  try {
    let visitorId = localStorage.getItem("smr_visitor_id");
    if (!visitorId) {
      visitorId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      localStorage.setItem("smr_visitor_id", visitorId);
    }
    fetch(`${API_BASE}/api/track`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ event, productId, visitorId, path: location.pathname })
    }).catch(() => {});
  } catch {}
}

function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [selected, setSelected] = useState("bundle");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [filter, setFilter] = useState("all");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dailyOnly, setDailyOnly] = useState(false);

  useEffect(() => {
    track("page_view");
    fetch(`${API_BASE}/api/products`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.products) && d.products.length) setProducts(d.products);
      }).catch(() => {});
  }, []);

  const published = useMemo(() => products.filter(p => p.published !== false), [products]);
  const dailyDrops = useMemo(() => published.filter(p => p.type === "prompt").slice(0, 8), [published]);
  const shopProducts = useMemo(() => dailyOnly ? dailyDrops : published, [dailyOnly, dailyDrops, published]);
  const product = published.find(x => x.id === selected) || shopProducts[0] || fallbackProducts[3];
  const filteredShowcase = useMemo(() => filter === "all" ? showcase : showcase.filter(x => x.type === filter), [filter]);

  const goTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
  };

  const chooseProduct = (id) => {
    setSelected(id);
    setSuccess(null);
    setError("");
    track("product_click", id);
    setTimeout(() => goTo("checkout"), 50);
  };

  const startPayment = async () => {
    setError(""); setSuccess(null);
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      setLoading(true);
      track("checkout_start", product.id);
      const config = await (await fetch(`${API_BASE}/api/config`)).json();
      if (!config.success || !config.razorpayKeyId) throw new Error("Razorpay configuration is missing.");
      const orderData = await (await fetch(`${API_BASE}/api/create-order`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({productId:product.id})
      })).json();
      if (!orderData.success) throw new Error(orderData.message || "Unable to create payment order.");
      const options = {
        key: config.razorpayKeyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name:"SMR Creator Lab",
        description:orderData.order.productName,
        order_id:orderData.order.id,
        prefill:{email},
        theme:{color:"#8b7cff"},
        handler: async (response) => {
          try {
            const verifyData = await (await fetch(`${API_BASE}/api/verify-payment`, {
              method:"POST", headers:{"Content-Type":"application/json"},
              body:JSON.stringify({...response, productId:product.id, email})
            })).json();
            if (!verifyData.success) throw new Error(verifyData.message || "Payment verification failed.");
            track("purchase", product.id);
            setSuccess({paymentId:verifyData.paymentId, productName:verifyData.productName || product.title, downloadUrl:verifyData.downloadUrl || null, deliveryUrl:verifyData.deliveryUrl || null, content:verifyData.content || null});
            setTimeout(()=>goTo("success"),100);
          } catch(err) { setError(err.message || "Payment verification failed."); }
          finally { setLoading(false); }
        },
        modal:{ondismiss:()=>setLoading(false)}
      };
      if (!window.Razorpay) throw new Error("Razorpay Checkout could not be loaded.");
      const rz = new window.Razorpay(options);
      rz.on("payment.failed",()=>{setError("Payment failed. Please try again."); setLoading(false);});
      rz.open();
    } catch(err) { setError(err.message || "Something went wrong."); setLoading(false); }
  };

  return <div className="app">
    <div className="ambient ambientOne"/><div className="ambient ambientTwo"/>
    <header className="siteHeader">
      <button className="mobileMenu" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Open navigation"><span/><span/><span/></button>
      <button className="brand" onClick={()=>goTo("top")}><span>SMR</span> CREATOR LAB</button>
      <nav className={mobileOpen ? "navOpen":""}>
        <button onClick={()=>goTo("daily")}>Daily ₹1</button>
        <button onClick={()=>goTo("showcase")}>Showcase</button>
        <button onClick={()=>goTo("products")}>Products</button>
        <button onClick={()=>goTo("how")}>How it works</button>
        <button onClick={()=>goTo("faq")}>FAQ</button>
      </nav>
      <button className="headerCta" onClick={()=>goTo("daily")}>Today's Drop ↗</button>
    </header>

    <main id="top">
      <section className="hero premiumHero">
        <div className="heroContent">
          <div className="eyebrow"><span className="eyebrowDot"/> INDIA'S GEN-Z CREATOR PLAYGROUND · ₹1 DAILY DROPS</div>
          <h1>Your next<br/><em>scroll-stopper.</em><br/>Starts here.</h1>
          <p className="heroText">Fresh AI prompts, visual directions and creator strategies made for the new Indian internet — one powerful drop at a time.</p>
          <div className="heroActions">
            <button className="primaryCta" onClick={()=>goTo("daily")}>Get Today's ₹1 Drop <span>↗</span></button>
            <button className="textCta" onClick={()=>goTo("showcase")}>See the creator showcase <span>→</span></button>
          </div>
          <div className="trustRow"><span>✓ Indian Gen-Z styles</span><span>✓ New drops daily</span><span>✓ Secure Razorpay checkout</span></div>
          <div className="authorLine">Created & curated by <strong>Mr. Samar Raj</strong></div>
        </div>
        <div className="heroVisual">
          <div className="heroGlow"/>
          <div className="heroCollage">
            <div className="heroImage heroImageMain"><img src={modelImages[0]} alt="Indian female creator style example"/></div>
            <div className="heroImage heroImageSide"><img src={modelImages[1]} alt="Indian male creator style example"/></div>
            <div className="heroImage heroImageSmall"><img src={modelImages[4]} alt="Indian creator lifestyle example"/></div>
            <div className="heroMiniCard"><span>SMR / DAILY 001</span><strong>ONE RUPEE.<br/>ONE IDEA.</strong><small>Fresh creator intelligence</small></div>
          </div>
          <div className="heroFloating"><b>₹1</b><span>daily prompt<br/>new trend</span></div>
        </div>
      </section>

      <section className="marquee"><div>INDIAN GEN-Z ✦ REELS ✦ FASHION ✦ BUSINESS ✦ AI ✦ E-COMMERCE ✦ CREATOR ✦ STRATEGY ✦ STYLE ✦</div></section>

      <section id="daily" className="dailySection sectionWide">
        <div className="sectionIntro">
          <div><span>01 / TODAY'S DAILY DROP</span><h2>Small price.<br/><em>Big advantage.</em></h2></div>
          <p>Come back every day for one or two fresh ideas worth saving. Visual trends, business strategy, content hooks and AI prompts — all built to be useful, fast.</p>
        </div>
        <div className="dailyGrid">
          {dailyDrops.length ? dailyDrops.map((item,i)=><article className="dailyCard" key={item.id} onClick={()=>chooseProduct(item.id)}>
            <div className="dailyImage"><img src={item.image || modelImages[i%modelImages.length]} alt={item.title}/><span>₹{item.price}</span><b>{i===0 ? "TODAY" : "FRESH"}</b></div>
            <div className="dailyBody"><small>{item.category || "DAILY DROP"} · {item.publishDate || "TODAY"}</small><h3>{item.title}</h3><p>{item.desc}</p><button>Unlock for ₹{item.price} ↗</button></div>
          </article>) : <div className="emptyDrop"><b>DAILY DROP</b><h3>Tomorrow's idea starts here.</h3><p>Add your first ₹1 prompt from the admin dashboard.</p></div>}
        </div>
      </section>

      <section id="showcase" className="showcase sectionWide">
        <div className="sectionIntro"><div><span>02 / CREATIVE SHOWCASE</span><h2>See the <em>style.</em></h2></div><p>Male and female creator references make the result feel real before someone buys. The visual language is designed around Indian Gen-Z culture.</p></div>
        <div className="filterBar">{[["all","All"],["female","Women"],["male","Men"]].map(([v,l])=><button key={v} className={filter===v?"active":""} onClick={()=>setFilter(v)}>{l}</button>)}<span>{filteredShowcase.length} visual directions</span></div>
        <div className="showcaseGrid">{filteredShowcase.map((item,index)=><article className="showcaseCard" key={item.title}><img src={item.image} alt={`${item.category} ${item.title}`} loading="lazy"/><div className="imageShade"/><div className="showcaseTop"><span>{item.category}</span><b>0{index+1}</b></div><div className="showcaseOverlay"><div><small>{item.category}</small><h3>{item.title}</h3><p>{item.text}</p></div><span>VIEW DIRECTION ↗</span></div></article>)}</div>
      </section>

      <section className="socialProof sectionWide">
        <div><span>03 / BUILT FOR THE NEW INDIAN INTERNET</span><h2>Not a template shop.<br/><em>A creator habit.</em></h2><p>SMR Creator Lab is designed so the first visit feels premium — and the next visit feels necessary. Fresh drops give people a reason to return.</p></div>
        <div className="proofStats"><div><b>₹1</b><span>Daily entry point</span></div><div><b>1–2</b><span>Fresh drops / day</span></div><div><b>100%</b><span>Creator-first</span></div><div><b>24/7</b><span>Digital access</span></div></div>
      </section>

      <section className="transformation">
        <div className="transformationHeader"><span>04 / THE CREATOR LOOP</span><h2>See it.<br/>Try it.<br/><em>Come back.</em></h2><p>Every drop follows a simple loop: discover a trend, unlock a prompt, create something, then return tomorrow for the next edge.</p></div>
        <div className="transformationFlow">
          <div className="transformBox"><span>01</span><div className="transformVisual"><img src={modelImages[8]} alt="Creator source example"/></div><h3>Start with your idea</h3><p>Photo, product, reel, business or brand.</p></div>
          <div className="flowArrow">→</div>
          <div className="transformBox featuredTransform"><span>02</span><div className="promptVisual"><b>SMR</b><small>DAILY CREATIVE DROP</small><strong>Fresh<br/>Direction</strong></div><h3>Unlock the prompt</h3><p>One focused prompt for one focused outcome.</p></div>
          <div className="flowArrow">→</div>
          <div className="transformBox"><span>03</span><div className="transformVisual"><img src={modelImages[9]} alt="Creator result example"/></div><h3>Publish & repeat</h3><p>Use it today. Come back tomorrow.</p></div>
        </div>
      </section>

      <section id="products" className="section productsSection">
        <div className="sectionIntro"><div><span>05 / SHOP THE LAB</span><h2>Build your <em>creator stack.</em></h2></div><p>Keep the larger toolkits while adding tiny, affordable Daily Drops to create a repeat-visit habit.</p></div>
        <div className="shopControls"><button className={!dailyOnly?"active":""} onClick={()=>setDailyOnly(false)}>All products</button><button className={dailyOnly?"active":""} onClick={()=>setDailyOnly(true)}>₹1 Daily Drops</button></div>
        <div className="productGrid">{shopProducts.map(item=><article className={`productCard ${item.best?"productBest":""}`} key={item.id} onMouseEnter={()=>track("product_view",item.id)}>{item.best&&<div className="besttag">BEST VALUE</div>}<div className="productImage"><img src={item.image || modelImages[0]} alt={item.title} loading="lazy"/><span>{item.number || "DROP"}</span></div><div className="productBody"><div className="productTag">{item.tag || item.category || "CREATOR DROP"}</div><h3>{item.title}</h3><p>{item.desc}</p><div className="productBottom"><div className="price">₹{item.price}</div><button onClick={()=>chooseProduct(item.id)}>Get this <span>↗</span></button></div></div></article>)}</div>
      </section>

      <section className="trustSection">
        <div className="trustTitle"><span>06 / WHY PEOPLE RETURN</span><h2>Make the site feel like a <em>studio.</em></h2><p>Premium art direction, useful products, tiny entry pricing and a fresh reason to return every day.</p></div>
        <div className="trustGrid">
          <div><b>01</b><h3>Indian Gen-Z energy</h3><p>Visual references and copy are designed around today's Indian creator culture.</p></div>
          <div><b>02</b><h3>Daily reason to return</h3><p>One or two fresh ₹1 drops can keep the lab alive and evolving every day.</p></div>
          <div><b>03</b><h3>Trust before checkout</h3><p>Models, examples, clear pricing and creator-led positioning reduce uncertainty.</p></div>
          <div><b>04</b><h3>Built to scale</h3><p>Products, sales, views and performance can be managed from your private admin dashboard.</p></div>
        </div>
      </section>

      <section id="how" className="how premiumHow"><span>07 / SIMPLE PROCESS</span><h2>Discover. <em>Unlock. Return.</em></h2><div className="steps"><div><b>01</b><h3>Discover</h3><p>Explore the models, examples and latest creator directions.</p></div><div><b>02</b><h3>Unlock</h3><p>Pay ₹1 for a Daily Drop or choose a larger toolkit.</p></div><div><b>03</b><h3>Return</h3><p>Come back for the next trend, strategy or visual prompt.</p></div></div></section>

      <section id="faq" className="faqSection"><div className="faqIntro"><span>08 / FAQ</span><h2>Questions?<br/><em>We've got you.</em></h2><p>Clear answers before you decide.</p></div><div className="faqList">{faqs.map(([q,a],i)=><div className={`faqItem ${openFaq===i?"faqOpen":""}`} key={q}><button onClick={()=>setOpenFaq(openFaq===i?null:i)}><span>{q}</span><b>{openFaq===i?"−":"+"}</b></button>{openFaq===i&&<p>{a}</p>}</div>)}</div></section>

      <section id="checkout" className="checkout premiumCheckout"><div className="checkoutIntro"><span>09 / SECURE CHECKOUT</span><h2>Start creating<br/><em>today.</em></h2><p>Selected: <strong>{product.title}</strong> · ₹{product.price}</p><div className="checkoutTrust"><span>🔒 Secure payment</span><span>↗ Digital delivery</span><span>✓ One-time purchase</span></div></div><div className="checkoutBox"><div className="checkoutTop"><div><span>SMR CREATOR LAB</span><strong>Secure checkout</strong></div><b>RZ</b></div><label>Email for delivery</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/><button className="pay" onClick={startPayment} disabled={loading}>{loading?"Processing...":`Pay ₹${product.price}`} <span>↗</span></button>{error&&<div className="paymentError">{error}</div>}<small>One-time payment · Razorpay checkout · Digital access is delivered after payment verification.</small></div></section>

      {success&&<section id="success" className="success"><div className="successMark">✓</div><span>PAYMENT COMPLETE</span><h2>You're in. Welcome to SMR Creator Lab.</h2><p>Your payment for <strong>{success.productName}</strong> has been verified.</p><p>Payment ID: <strong>{success.paymentId}</strong></p>{success.downloadUrl?<a className="primaryCta" href={apiUrl(success.downloadUrl)} target="_blank" rel="noopener noreferrer">Download Your Product ↗</a>:success.deliveryUrl?<a className="primaryCta" href={apiUrl(success.deliveryUrl)} target="_blank" rel="noopener noreferrer">Open Your Daily Prompt ↗</a>:success.content?<div className="deliveredPrompt"><small>YOUR DAILY DROP</small><p>{success.content}</p></div>:<p>Your digital access is ready.</p>}</section>}
    </main>

    <footer><div className="footerBrand"><button className="brand" onClick={()=>goTo("top")}><span>SMR</span> CREATOR LAB</button><p>Create Better. Look Better. Grow Smarter.</p><small>Created & curated by <strong>Mr. Samar Raj</strong></small></div><div className="footerLinks"><button onClick={()=>goTo("daily")}>Daily ₹1</button><button onClick={()=>goTo("showcase")}>Showcase</button><button onClick={()=>goTo("products")}>Products</button><button onClick={()=>goTo("faq")}>FAQ</button><a href="/admin">Admin ↗</a></div><div className="footerBottom">© 2026 SMR Creator Lab</div></footer>
  </div>;
}


/* =========================================================
   PRODUCT LANDING PAGE
========================================================= */

function apiUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the PDF file."));
    reader.readAsDataURL(file);
  });
}

function ProductPage({ productId }) {
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [email, setEmail] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    track("page_view", productId);
    track("product_view", productId);

    fetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.success) {
          throw new Error(d.message || "Product not found.");
        }
        return d.product;
      })
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingProduct(false));
  }, [productId]);

  const buy = async () => {
    setError("");
    setSuccess(null);

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!product) return;

    try {
      setPaying(true);
      track("checkout_start", product.id);

      const configResponse = await fetch(`${API_BASE}/api/config`);
      const config = await configResponse.json();

      if (!config.success || !config.razorpayKeyId) {
        throw new Error("Razorpay configuration is missing.");
      }

      const orderResponse = await fetch(`${API_BASE}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.message || "Unable to create payment order.");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout could not be loaded.");
      }

      const options = {
        key: config.razorpayKeyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "SMR Creator Lab",
        description: orderData.order.productName,
        order_id: orderData.order.id,
        prefill: { email },
        theme: { color: "#8b7cff" },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch(`${API_BASE}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                productId: product.id,
                email,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.message || "Payment verification failed.");
            }

            track("purchase", product.id);

            setSuccess({
              paymentId: verifyData.paymentId,
              productName: verifyData.productName || product.title,
              downloadUrl: verifyData.downloadUrl || null,
              deliveryUrl: verifyData.deliveryUrl || null,
              content: verifyData.content || null,
            });
          } catch (e) {
            setError(e.message || "Payment verification failed.");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rz = new window.Razorpay(options);
      rz.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setPaying(false);
      });
      rz.open();
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setPaying(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="productPage">
        <div className="productPageLoading">Loading product…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="productPage">
        <div className="productNotFound">
          <span>SMR CREATOR LAB</span>
          <h1>Product not found.</h1>
          <p>This product may have been removed or is no longer published.</p>
          <a className="primaryCta" href="/">Back to Creator Lab ↗</a>
        </div>
      </div>
    );
  }

  return (
    <div className="productPage">
      <header className="productPageHeader">
        <a className="brand" href="/"><span>SMR</span> CREATOR LAB</a>
        <a href="/" className="productHomeLink">← Back to Creator Lab</a>
      </header>

      <main className="productLanding">
        <div className="productLandingVisual">
          <img src={product.image || modelImages[0]} alt={product.title} />
          <div className="productLandingBadge">
            {product.type === "pdf" ? "PDF / EBOOK" : "DAILY DROP"}
          </div>
        </div>

        <section className="productLandingInfo">
          <span className="productLandingEyebrow">
            {product.category || product.tag || "SMR CREATOR LAB"}
          </span>
          <h1>{product.title}</h1>
          <p className="productLandingDesc">{product.desc}</p>

          <div className="productLandingMeta">
            <span>✓ One-time purchase</span>
            <span>✓ Secure Razorpay payment</span>
            <span>✓ Digital delivery</span>
          </div>

          <div className="productLandingPrice">₹{product.price}</div>

          {success ? (
            <div className="productPurchaseSuccess">
              <div className="successMark">✓</div>
              <small>PAYMENT COMPLETE</small>
              <h2>You're in.</h2>
              <p>Payment for <strong>{success.productName}</strong> has been verified.</p>
              <p className="paymentIdLine">Payment ID: {success.paymentId}</p>

              {success.downloadUrl ? (
                <a className="primaryCta" href={apiUrl(success.downloadUrl)} target="_blank" rel="noopener noreferrer">
                  Download Your PDF ↗
                </a>
              ) : success.deliveryUrl ? (
                <a className="primaryCta" href={apiUrl(success.deliveryUrl)} target="_blank" rel="noopener noreferrer">
                  Open Your Daily Drop ↗
                </a>
              ) : (
                <div className="deliveredPrompt">
                  <small>YOUR DIGITAL PRODUCT</small>
                  <p>{success.content || "Your digital access is ready."}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="productBuyBox">
              <label>Email for delivery</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <button className="pay" onClick={buy} disabled={paying}>
                {paying ? "Processing..." : `Buy Now — ₹${product.price}`} <span>↗</span>
              </button>
              {error && <div className="paymentError">{error}</div>}
              <small>
                Your payment is verified on the server. {product.type === "pdf"
                  ? "After payment, a secure PDF download link is generated."
                  : "After payment, your private prompt delivery page is generated."}
              </small>
            </div>
          )}

          <div className="productPageBottomLinks">
            <a href="/">← Explore all SMR Creator Lab products</a>
            <button
              type="button"
              onClick={() => {
                const url = `${location.origin}/product/${encodeURIComponent(product.slug || product.id)}`;
                navigator.clipboard?.writeText(url);
                alert("Product link copied.");
              }}
            >
              Copy this product link
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   ADMIN PANEL
========================================================= */

function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    title: "",
    type: "prompt",
    tag: "DAILY PROMPT",
    category: "Business",
    price: 1,
    desc: "",
    image: modelImages[0],
    prompt: "",
    publishDate: new Date().toISOString().slice(0, 10),
    pdfFile: null,
    imageFile: null,
  });

  const authHeaders = () => ({
    "x-admin-password": password,
  });

  const load = async () => {
    const [s, p, o] = await Promise.all([
      fetch(`${API_BASE}/api/admin/summary`, { headers: authHeaders() }),
      fetch(`${API_BASE}/api/admin/products`, { headers: authHeaders() }),
      fetch(`${API_BASE}/api/admin/orders`, { headers: authHeaders() }),
    ]);

    if ([s, p, o].some((r) => r.status === 401)) {
      throw new Error("Wrong admin password.");
    }

    const sj = await s.json();
    const pj = await p.json();
    const oj = await o.json();

    if (!sj.success) throw new Error(sj.message || "Could not load dashboard.");

    setSummary(sj.summary || null);
    setProducts(Array.isArray(pj.products) ? pj.products : []);
    setOrders(Array.isArray(oj.orders) ? oj.orders : []);
    setAuthed(true);
  };

  const login = async () => {
    try {
      setBusy(true);
      setMsg("");
      await load();
    } catch (error) {
      setMsg(error.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.title.trim()) {
      setMsg("Product title is required.");
      return;
    }

    if (!Number(form.price) || Number(form.price) <= 0) {
      setMsg("Enter a valid price greater than ₹0.");
      return;
    }

    if (form.type === "prompt" && !form.prompt.trim()) {
      setMsg("Premium prompt/content is required.");
      return;
    }

    if (!form.imageFile) {
      setMsg("Please select a cover image.");
      return;
    }

    if (form.type === "pdf" && !form.pdfFile) {
      setMsg("Please select the PDF / Ebook file.");
      return;
    }

    try {
      setBusy(true);

      let fileData = null;
      let imageData = null;

      if (form.imageFile) {
        if (form.imageFile.size > 10 * 1024 * 1024) {
          throw new Error("Cover image must be 10MB or smaller.");
        }
        imageData = await fileToDataUrl(form.imageFile);
      }

      if (form.type === "pdf" && form.pdfFile) {
        if (form.pdfFile.size > 20 * 1024 * 1024) {
          throw new Error("PDF must be 20MB or smaller.");
        }
        fileData = await fileToDataUrl(form.pdfFile);
      }

      const body = {
        title: form.title.trim(),
        type: form.type,
        tag: form.tag.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        desc: form.desc.trim(),
        imageData,
        imageName: form.imageFile?.name || "",
        prompt: form.type === "prompt" ? form.prompt.trim() : "",
        publishDate: form.publishDate,
        fileData,
        fileName: form.pdfFile?.name || "",
        published: true,
      };

      const r = await fetch(`${API_BASE}/api/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(body),
      });

      const d = await r.json();

      if (!r.ok || !d.success) {
        throw new Error(d.message || "Could not create product.");
      }

      setMsg(`${form.type === "pdf" ? "PDF / Ebook" : "Daily Drop"} published successfully.`);

      setForm({
        title: "",
        type: "prompt",
        tag: "DAILY PROMPT",
        category: "Business",
        price: 1,
        desc: "",
        image: "",
        imageFile: null,
        prompt: "",
        publishDate: new Date().toISOString().slice(0, 10),
        pdfFile: null,
      });

      const fileInput = document.getElementById("admin-pdf-file");
      if (fileInput) fileInput.value = "";
      const imageInput = document.getElementById("admin-cover-image");
      if (imageInput) imageInput.value = "";

      await load();
    } catch (error) {
      setMsg(error.message || "Could not create product.");
    } finally {
      setBusy(false);
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.title}"?\n\nThis removes it from the storefront and product library.`)) {
      return;
    }

    try {
      setBusy(true);
      setMsg("");

      const r = await fetch(`${API_BASE}/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.message || "Could not delete product.");

      setMsg(`"${product.title}" deleted successfully.`);
      await load();
    } catch (error) {
      setMsg(error.message || "Unable to delete product.");
    } finally {
      setBusy(false);
    }
  };

  const copyProductLink = async (product) => {
    const url = `${location.origin}/product/${encodeURIComponent(product.slug || product.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setMsg(`Product link copied: ${url}`);
    } catch {
      window.prompt("Copy this product link:", url);
    }
  };

  if (!authed) {
    return (
      <div className="adminLogin">
        <div className="adminCard">
          <span>SMR / PRIVATE LAB</span>
          <h1>Creator Lab Admin</h1>
          <p>Track views, products, orders and revenue. Add Daily Drops or PDF / Ebook products without editing code.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Admin password"
          />
          <button className="primaryCta" onClick={login} disabled={busy}>
            {busy ? "Checking..." : "Enter dashboard ↗"}
          </button>
          {msg && <div className="paymentError">{msg}</div>}
          <small>Set ADMIN_PASSWORD in .env before production.</small>
        </div>
      </div>
    );
  }

  const isPdf = form.type === "pdf";

  return (
    <div className="adminPage">
      <header className="adminHeader">
        <div>
          <span>SMR CREATOR LAB</span>
          <h1>Command Center</h1>
        </div>
        <a href="/">← View storefront</a>
      </header>

      <main className="adminMain">
        <div className="adminStats">
          {[
            ["Page views", summary?.pageViews || 0],
            ["Visitors", summary?.uniqueVisitors || 0],
            ["Sales", summary?.sales || 0],
            ["Revenue", `₹${summary?.revenue || 0}`],
            ["Product views", summary?.productViews || 0],
          ].map(([a, b]) => (
            <div className="adminStat" key={a}>
              <small>{a}</small>
              <strong>{b}</strong>
            </div>
          ))}
        </div>

        <div className="adminColumns">
          <form className="adminForm" onSubmit={create}>
            <span>PRODUCT CREATOR / QUICK PUBLISH</span>
            <h2>Add a new product</h2>
            <p>Choose Daily Drop for a prompt or PDF / Ebook for a secure downloadable product.</p>

            <select
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value,
                  tag: e.target.value === "pdf" ? "PDF / EBOOK" : "DAILY PROMPT",
                  prompt: "",
                  pdfFile: null,
                  imageFile: null,
                })
              }
            >
              <option value="prompt">Daily Drop / Prompt</option>
              <option value="pdf">PDF / Ebook</option>
            </select>

            <input
              placeholder="Product Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <input
              placeholder="Tag e.g. DAILY PROMPT / PDF / EBOOK"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
            />

            <input
              placeholder="Category e.g. AI / Fashion / Business"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />

            <label className="adminFieldLabel">Price (₹) — enter any price</label>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />

            <div className="pdfUploadBox">
              <label className="adminFieldLabel">Cover Image</label>
              <input
                id="admin-cover-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={(e) =>
                  setForm({ ...form, imageFile: e.target.files?.[0] || null })
                }
                required
              />
              <small>
                {form.imageFile
                  ? `${form.imageFile.name} · ${(form.imageFile.size / 1024 / 1024).toFixed(2)} MB`
                  : "JPG, PNG or WEBP · Maximum 10MB. No image URL needed."}
              </small>
            </div>

            <textarea
              placeholder="Short product description"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              required
            />

            {isPdf ? (
              <div className="pdfUploadBox">
                <label className="adminFieldLabel">PDF / Ebook file</label>
                <input
                  id="admin-pdf-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) =>
                    setForm({ ...form, pdfFile: e.target.files?.[0] || null })
                  }
                  required
                />
                <small>{form.pdfFile ? `${form.pdfFile.name} · ${(form.pdfFile.size / 1024 / 1024).toFixed(2)} MB` : "Maximum 20MB. PDF only."}</small>
              </div>
            ) : (
              <textarea
                placeholder="Premium prompt / strategy users receive after payment"
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                required
              />
            )}

            <input
              type="date"
              value={form.publishDate}
              onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
            />

            <button className="pay" type="submit" disabled={busy}>
              {busy ? "Publishing..." : isPdf ? `Publish PDF / Ebook — ₹${form.price}` : `Publish Daily Drop — ₹${form.price}`} ↗
            </button>

            {msg && <div className="successInline">{msg}</div>}
          </form>

          <section className="adminPanel">
            <div className="panelHead">
              <div>
                <span>PRODUCT LIBRARY</span>
                <h2>Everything you sell</h2>
              </div>
              <span>{products.length} products</span>
            </div>

            {products.length === 0 ? (
              <div className="emptyDrop">
                <b>PRODUCT LIBRARY</b>
                <h3>No products yet.</h3>
                <p>Add your first product using the form.</p>
              </div>
            ) : (
              products.map((p) => (
                <div className="adminProduct" key={p.id}>
                  <div>
                    <b>{p.title}</b>
                    <small>{p.category || p.tag || "PRODUCT"} · ₹{p.price}</small>
                  </div>

                  <div className="adminProductActions">
                    <strong>{p.type === "pdf" ? "PDF / EBOOK" : "DAILY DROP"}</strong>
                    <button type="button" className="copyProductBtn" onClick={() => copyProductLink(p)} disabled={busy}>
                      Copy Link
                    </button>
                    <a className="viewProductBtn" href={`/product/${encodeURIComponent(p.slug || p.id)}`} target="_blank" rel="noopener noreferrer">
                      Open
                    </a>
                    <button type="button" className="deleteProductBtn" onClick={() => deleteProduct(p)} disabled={busy}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>

        <section className="adminPanel">
          <div className="panelHead">
            <div>
              <span>RECENT SALES</span>
              <h2>Orders & revenue</h2>
            </div>
            <span>{orders.length} orders</span>
          </div>

          <div className="ordersTable">
            <div className="orderRow orderHead">
              <span>Product</span>
              <span>Email</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Date</span>
            </div>

            {orders.slice(0, 20).map((o) => (
              <div className="orderRow" key={o.id}>
                <span>{o.productName}</span>
                <span>{o.email || "—"}</span>
                <span>₹{Math.round(Number(o.amount || 0) / 100)}</span>
                <span>{o.status}</span>
                <span>{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const pathParts = location.pathname.split("/").filter(Boolean);
const isAdminRoute = pathParts[0] === "admin";
const isProductRoute = pathParts[0] === "product" && pathParts[1];

createRoot(document.getElementById("root")).render(
  isAdminRoute
    ? <Admin />
    : isProductRoute
      ? <ProductPage productId={decodeURIComponent(pathParts[1])} />
      : <App />
);
