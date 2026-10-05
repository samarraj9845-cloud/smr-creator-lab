import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "35mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRIVATE_PRODUCTS_DIR = path.join(__dirname, "private-products");
const PRODUCT_IMAGES_DIR = path.join(__dirname, "product-images");
const ORDERS_FILE = path.join(__dirname, "orders.json");
const PRODUCTS_FILE = path.join(__dirname, "products.json");
const ANALYTICS_FILE = path.join(__dirname, "analytics.json");

if (!fs.existsSync(PRODUCT_IMAGES_DIR)) fs.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });

app.use("/product-images", express.static(PRODUCT_IMAGES_DIR, { maxAge: "1d" }));

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("❌ Razorpay environment variables are missing.");
  process.exit(1);
}
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SMR_ADMIN_CHANGE_ME";

const seedProducts = [
  { id:"girl", number:"01", title:"SMR Girl Glow", tag:"100 AI Photo Editing Prompts", price:19, desc:"Beauty, luxury, cinematic and Instagram-ready visual directions.", image:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=88", type:"pdf", file:"girl-glow.pdf", published:true, createdAt:"2026-10-01" },
  { id:"men", number:"02", title:"SMR Men Style", tag:"100 AI Photo Editing Prompts", price:19, desc:"Streetwear, fitness, travel, luxury and cinematic creator styles.", image:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=88", type:"pdf", file:"men-style.pdf", published:true, createdAt:"2026-10-01" },
  { id:"growth", number:"03", title:"SMR Insta Growth", tag:"30-Day Instagram Growth System", price:19, desc:"Hooks, content ideas, captions, CTAs and a practical growth system.", image:"https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=88", type:"pdf", file:"insta-growth.pdf", published:true, createdAt:"2026-10-01" },
  { id:"bundle", number:"04", title:"SMR Creator Starter", tag:"3-in-1 Creator Toolkit", price:29, desc:"Girl Glow + Men Style + Insta Growth in one starter bundle.", image:"https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=1200&q=88", type:"pdf", file:"creator-starter.pdf", published:true, best:true, createdAt:"2026-10-01" },
  { id:"daily-001", number:"D01", title:"Monsoon Chrome Portrait", tag:"DAILY PROMPT", category:"Visual Trend", price:1, desc:"A high-impact Indian Gen-Z rainy-season chrome portrait direction for social posts.", image:"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1200&q=88", type:"prompt", published:true, publishDate:"2026-10-05", prompt:"Create a premium Indian Gen-Z editorial portrait during a cinematic monsoon evening. Use reflective chrome surfaces, wet street highlights, modern streetwear, subtle neon, realistic skin texture, expressive eyes, editorial lens compression and luxury campaign lighting. Keep the person authentic and natural. Make the final image feel like a high-end Indian fashion campaign designed for Instagram.", createdAt:"2026-10-05" },
  { id:"daily-002", number:"D02", title:"Founder Reels Hook", tag:"DAILY PROMPT", category:"Business Strategy", price:1, desc:"A compact strategy prompt to turn one business idea into a scroll-stopping founder reel.", image:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=88", type:"prompt", published:true, publishDate:"2026-10-05", prompt:"Act as an elite Indian startup content strategist. Turn my business idea into 5 founder-led Instagram Reel concepts for Indian Gen-Z audiences. For each concept give: 1-second hook, 15-second structure, visual direction, on-screen text, CTA, caption and one contrarian insight. Make every concept practical, premium and designed to earn saves and shares without fake hype.", createdAt:"2026-10-05" }
];

function readJson(file, fallback) {
  try { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,"utf8") || JSON.stringify(fallback)) : fallback; }
  catch { return fallback; }
}
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8"); }
function loadProducts() {
  if (!fs.existsSync(PRODUCTS_FILE)) { writeJson(PRODUCTS_FILE, seedProducts); return seedProducts; }
  const items = readJson(PRODUCTS_FILE, seedProducts);
  return Array.isArray(items) && items.length ? items : seedProducts;
}
function loadOrders() { return readJson(ORDERS_FILE, []); }
function saveOrders(items) { writeJson(ORDERS_FILE, items); }
function loadAnalytics() { return readJson(ANALYTICS_FILE, {events:[]}); }
function saveAnalytics(data) { writeJson(ANALYTICS_FILE, data); }
function createDownloadToken() { return crypto.randomBytes(32).toString("hex"); }
function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "product";
}

function uniqueProductSlug(title, products, currentId = null) {
  const base = slugify(title);
  let slug = base;
  let n = 2;
  while (products.some(p => p.id !== currentId && p.slug === slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function saveUploadedPdf(fileData, fileName) {
  if (!fileData || !fileName) return null;
  const match = String(fileData).match(/^data:application\/pdf;base64,(.+)$/s);
  if (!match) throw new Error("Please upload a valid PDF file.");
  const safeName = path.basename(String(fileName)).replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!safeName.toLowerCase().endsWith(".pdf")) throw new Error("Only PDF files are supported.");
  const buffer = Buffer.from(match[1], "base64");
  if (!buffer.length) throw new Error("The uploaded PDF is empty.");
  if (buffer.length > 20 * 1024 * 1024) throw new Error("PDF must be 20MB or smaller.");
  if (!fs.existsSync(PRIVATE_PRODUCTS_DIR)) fs.mkdirSync(PRIVATE_PRODUCTS_DIR, { recursive: true });
  const storedName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeName}`;
  fs.writeFileSync(path.join(PRIVATE_PRODUCTS_DIR, storedName), buffer);
  return storedName;
}
function saveUploadedImage(fileData, fileName) {
  if (!fileData || !fileName) return null;

  const match = String(fileData).match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s);
  if (!match) throw new Error("Please upload a JPG, PNG or WEBP cover image.");

  const mime = match[1];
  const ext = mime === "image/jpeg" ? ".jpg" : mime === "image/png" ? ".png" : ".webp";
  const originalName = path.basename(String(fileName)).replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeBase = originalName.replace(/\.(jpe?g|png|webp)$/i, "") || "cover";
  const buffer = Buffer.from(match[2], "base64");

  if (!buffer.length) throw new Error("The uploaded cover image is empty.");
  if (buffer.length > 10 * 1024 * 1024) throw new Error("Cover image must be 10MB or smaller.");

  if (!fs.existsSync(PRODUCT_IMAGES_DIR)) {
    fs.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });
  }

  const storedName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeBase}${ext}`;
  fs.writeFileSync(path.join(PRODUCT_IMAGES_DIR, storedName), buffer);
  return storedName;
}

function adminOnly(req,res,next) {
  if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) return res.status(401).json({success:false,message:"Unauthorized"});
  next();
}

app.get("/api/health",(req,res)=>res.json({success:true,message:"SMR Creator Lab API is running"}));
app.get("/api/config",(req,res)=>res.json({success:true,razorpayKeyId:process.env.RAZORPAY_KEY_ID}));
app.get("/api/products",(req,res)=>{
  const products = loadProducts().filter(p=>p.published !== false).sort((a,b)=>String(b.publishDate||b.createdAt||"").localeCompare(String(a.publishDate||a.createdAt||"")));
  res.json({success:true,products});
});


app.get("/api/products/:id",(req,res)=>{
  const product = loadProducts().find(p =>
    String(p.id) === String(req.params.id) ||
    String(p.slug || "") === String(req.params.id)
  );
  if (!product || product.published === false) {
    return res.status(404).json({success:false,message:"Product not found."});
  }
  res.json({success:true,product});
});

app.post("/api/track",(req,res)=>{
  const {event, productId, visitorId, path:pagePath} = req.body || {};
  const allowed = new Set(["page_view","product_view","product_click","checkout_start","purchase"]);
  if (!allowed.has(event)) return res.status(400).json({success:false});
  const analytics = loadAnalytics();
  analytics.events.push({id:crypto.randomUUID(),event,productId:productId||null,visitorId:visitorId||null,path:pagePath||null,createdAt:new Date().toISOString()});
  if (analytics.events.length > 50000) analytics.events = analytics.events.slice(-50000);
  saveAnalytics(analytics);
  res.json({success:true});
});

app.post("/api/create-order",async(req,res)=>{
  try {
    const {productId}=req.body;
    const product=loadProducts().find(p=>p.id===productId && p.published !== false);
    if(!product) return res.status(400).json({success:false,message:"Invalid product"});
    const amount = Math.round(Number(product.price)*100);
    const order=await razorpay.orders.create({
      amount,currency:"INR",receipt:`smr_${productId}_${Date.now()}`,
      notes:{product_id:product.id,product_name:product.title}
    });
    res.json({success:true,order:{id:order.id,amount:order.amount,currency:order.currency,productId,productName:product.title}});
  } catch(error) {
    console.error("Razorpay order error:",error);
    res.status(500).json({success:false,message:"Unable to create payment order"});
  }
});

app.post("/api/verify-payment",async(req,res)=>{
  try {
    const {razorpay_order_id,razorpay_payment_id,razorpay_signature,productId,email}=req.body;
    if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature||!productId) return res.status(400).json({success:false,message:"Missing payment verification data"});
    const product=loadProducts().find(p=>p.id===productId);
    if(!product) return res.status(400).json({success:false,message:"Invalid product"});
    const generated=crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const a=Buffer.from(generated), b=Buffer.from(razorpay_signature);
    if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return res.status(400).json({success:false,message:"Payment signature verification failed"});
    const rpOrder=await razorpay.orders.fetch(razorpay_order_id);
    if(rpOrder.notes?.product_id!==productId) return res.status(400).json({success:false,message:"Product verification failed"});
    if(Number(rpOrder.amount)!==Math.round(Number(product.price)*100)) return res.status(400).json({success:false,message:"Payment amount verification failed"});

    const token=createDownloadToken(), now=new Date(), expiresAt=new Date(now.getTime()+24*60*60*1000);
    const orders=loadOrders();
    const record={
      id:crypto.randomUUID(), razorpayOrderId:razorpay_order_id, razorpayPaymentId:razorpay_payment_id,
      productId, productName:product.title, amount:Math.round(Number(product.price)*100), email:email||null,
      status:"paid", downloadToken:token, downloadCount:0, maxDownloads:3,
      createdAt:now.toISOString(), expiresAt:expiresAt.toISOString(),
      deliveryType:product.type||"pdf", promptContent:product.type==="prompt" ? product.prompt : null
    };
    orders.push(record); saveOrders(orders);
    const response={success:true,message:"Payment verified successfully",productId,productName:product.title,paymentId:razorpay_payment_id};
    if(product.type==="prompt") response.deliveryUrl=`/api/delivery/${token}`;
    else response.downloadUrl=`/api/download/${token}`;
    res.json(response);
  } catch(error) {
    console.error("Payment verification error:",error);
    res.status(500).json({success:false,message:"Payment verification failed"});
  }
});

function findOrder(token) {
  return loadOrders().find(x=>x.downloadToken===token);
}
app.get("/api/download/:token",(req,res)=>{
  try {
    const order=findOrder(req.params.token);
    if(!order) return res.status(404).send("Download link is invalid or expired.");
    if(Date.now()>new Date(order.expiresAt).getTime()) return res.status(410).send("This download link has expired.");
    if(order.downloadCount>=order.maxDownloads) return res.status(429).send("Download limit reached.");
    const product=loadProducts().find(p=>p.id===order.productId);
    if(!product || !product.file) return res.status(404).send("Product file is unavailable.");
    const filePath=path.join(PRIVATE_PRODUCTS_DIR,product.file);
    if(!fs.existsSync(filePath)) return res.status(404).send("Product file is currently unavailable.");
    const orders=loadOrders(), current=orders.find(x=>x.id===order.id); current.downloadCount+=1; saveOrders(orders);
    res.download(filePath,product.file);
  } catch { res.status(500).send("Unable to process download."); }
});

app.get("/api/delivery/:token",(req,res)=>{
  const order=findOrder(req.params.token);
  if(!order) return res.status(404).send("Delivery link is invalid or expired.");
  if(Date.now()>new Date(order.expiresAt).getTime()) return res.status(410).send("This delivery link has expired.");
  if(order.deliveryType!=="prompt") return res.status(404).send("Delivery type not supported.");
  res.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>SMR Daily Drop</title><style>body{margin:0;background:#080910;color:#f4f3ff;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px}.card{max-width:760px;border:1px solid #2c2b48;border-radius:24px;padding:38px;background:linear-gradient(145deg,#121426,#0b0c12);box-shadow:0 30px 100px #000}.tag{color:#9f91ff;letter-spacing:.18em;font-size:11px}.prompt{margin-top:22px;padding:24px;border-radius:16px;background:#07080d;border:1px solid #29293d;line-height:1.75;font-size:18px;white-space:pre-wrap}.small{color:#7d8190;font-size:12px;margin-top:20px}h1{font-size:42px;margin:12px 0}</style></head><body><div class="card"><div class="tag">SMR CREATOR LAB · PAID DAILY DROP</div><h1>${escapeHtml(order.productName)}</h1><div class="prompt">${escapeHtml(order.promptContent||"")}</div><div class="small">Created & curated by Mr. Samar Raj · Keep this page for your personal use while the delivery link remains valid.</div></div></body></html>`);
});

function escapeHtml(v="") { return String(v).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

app.get("/api/admin/summary",adminOnly,(req,res)=>{
  const orders=loadOrders(), events=loadAnalytics().events;
  const paid=orders.filter(o=>o.status==="paid");
  const visitors=new Set(events.filter(e=>e.visitorId).map(e=>e.visitorId));
  res.json({success:true,summary:{
    pageViews:events.filter(e=>e.event==="page_view").length,
    uniqueVisitors:visitors.size,
    productViews:events.filter(e=>e.event==="product_view").length,
    sales:paid.length,
    revenue:Math.round(paid.reduce((s,o)=>s+Number(o.amount||0),0)/100)
  }});
});
app.get("/api/admin/products",adminOnly,(req,res)=>res.json({success:true,products:loadProducts()}));
app.get("/api/admin/orders",adminOnly,(req,res)=>res.json({success:true,orders:loadOrders().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))}));
app.get("/api/admin/analytics",adminOnly,(req,res)=>res.json({success:true,events:loadAnalytics().events.slice(-5000)}));

app.post("/api/admin/products",adminOnly,(req,res)=>{
  try {
    const {
      title, tag, category, price, desc, image, imageData, imageName, prompt, publishDate,
      type, fileData, fileName, best
    } = req.body || {};

    const cleanTitle = String(title || "").trim();
    const productType = type === "pdf" ? "pdf" : "prompt";
    const numericPrice = Number(price);

    if (!cleanTitle) {
      return res.status(400).json({success:false,message:"Product title is required."});
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({success:false,message:"Enter a valid product price greater than ₹0."});
    }
    if (!imageData) {
      return res.status(400).json({success:false,message:"Please select a cover image for this product."});
    }
    if (productType === "prompt" && !String(prompt || "").trim()) {
      return res.status(400).json({success:false,message:"Premium prompt/content is required for a Daily Drop."});
    }
    if (productType === "pdf" && !fileData) {
      return res.status(400).json({success:false,message:"Please select a PDF file for this product."});
    }

    const products = loadProducts();
    const id = `${productType}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const storedFile = productType === "pdf" ? saveUploadedPdf(fileData, fileName) : null;
    const storedImage = saveUploadedImage(imageData, imageName);
    const slug = uniqueProductSlug(cleanTitle, products);

    const item = {
      id,
      slug,
      number: productType === "prompt" ? "DROP" : "PDF",
      title: cleanTitle,
      tag: String(tag || (productType === "pdf" ? "PDF / EBOOK" : "DAILY PROMPT")).trim(),
      category: String(category || "Creator").trim(),
      price: numericPrice,
      desc: String(desc || "").trim(),
      image: storedImage ? `/product-images/${encodeURIComponent(storedImage)}` : String(image || "").trim(),
      type: productType,
      published: true,
      publishDate: publishDate || new Date().toISOString().slice(0,10),
      createdAt: new Date().toISOString(),
      ...(productType === "prompt"
        ? { prompt: String(prompt || "").trim() }
        : { file: storedFile, fileName: path.basename(String(fileName || storedFile || "product.pdf")) }),
      ...(best ? { best: true } : {})
    };

    products.unshift(item);
    writeJson(PRODUCTS_FILE, products);

    res.json({success:true,message:"Product created successfully.",product:item});
  } catch(error) {
    console.error("Create product error:",error);
    res.status(500).json({success:false,message:error.message || "Could not create product."});
  }
});

app.patch("/api/admin/products/:id",adminOnly,(req,res)=>{
  try {
    const products = loadProducts();
    const i = products.findIndex(p => String(p.id) === String(req.params.id));
    if (i < 0) return res.status(404).json({success:false,message:"Product not found"});

    const old = products[i];
    const body = req.body || {};
    const updated = {...old, ...body, id: old.id, updatedAt: new Date().toISOString()};

    if (body.title !== undefined) {
      updated.title = String(body.title).trim();
      updated.slug = uniqueProductSlug(updated.title, products, old.id);
    }
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({success:false,message:"Invalid product price."});
      }
      updated.price = price;
    }

    products[i] = updated;
    writeJson(PRODUCTS_FILE, products);
    res.json({success:true,product:updated});
  } catch(error) {
    res.status(500).json({success:false,message:error.message || "Could not update product"});
  }
});

app.delete("/api/admin/products/:id",adminOnly,(req,res)=>{
  try {
    const products = loadProducts();
    const i = products.findIndex(p => String(p.id) === String(req.params.id));
    if (i < 0) return res.status(404).json({success:false,message:"Product not found."});

    const deleted = products[i];
    products.splice(i, 1);
    writeJson(PRODUCTS_FILE, products);

    if (deleted.file) {
      const filePath = path.join(PRIVATE_PRODUCTS_DIR, path.basename(deleted.file));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    if (deleted.image && String(deleted.image).startsWith("/product-images/")) {
      const imageName = decodeURIComponent(String(deleted.image).split("/").pop());
      const imagePath = path.join(PRODUCT_IMAGES_DIR, path.basename(imageName));
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    res.json({success:true,message:`"${deleted.title}" deleted successfully.`,product:deleted});
  } catch(error) {
    console.error("Delete product error:",error);
    res.status(500).json({success:false,message:"Could not delete product."});
  }
});

const PORT=process.env.PORT||5000;
app.listen(PORT,()=>console.log(`🚀 SMR Creator Lab API running on http://localhost:${PORT}`));
