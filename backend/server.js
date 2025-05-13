const express = require("express");
const cors = require("cors");
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const PDFDocument = require("pdfkit");

const app = express();

app.use(cors({
  origin: ["https://certificati-medici.vercel.app"],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server in ascolto su http://localhost:${PORT}`);
});


app.use(express.json());

registerFont("Arial.ttf", { family: "Arial" });

app.post("/generate", async (req, res) => {
  const {
    cognome, nome, cittaNascita, dataNascita, residenza, documento,
    sport, sport2, sport3, validita, scadenza, dataCertificato,
  } = req.body;

  const imagePath = path.join(__dirname, "template.jpg");

  try {
    const baseImage = await loadImage(imagePath);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0);
    ctx.font = "24px Arial";
    ctx.fillStyle = "black";
    ctx.textBaseline = "top";

    ctx.fillText(cognome, 238, 455);
    ctx.fillText(nome, 210, 508);
    ctx.fillText(cittaNascita, 550, 555);
    ctx.fillText(dataNascita, 506, 603);
    ctx.fillText(residenza, 567, 653);
    ctx.fillText(documento, 567, 703);
    ctx.fillText(sport, 567, 753);
    ctx.fillText(sport2, 567, 803);
    ctx.fillText(sport3, 567, 924);
    ctx.fillText(validita, 567, 974);
    ctx.fillText(scadenza, 567, 1028);
    ctx.fillText(dataCertificato, 209, 1225);

    res.setHeader("Content-Type", "image/png");
    canvas.pngStream().pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante la generazione del certificato");
  }
});

app.post("/generate-pdf", (req, res) => {
  const doc = new PDFDocument();
  let buffers = [];

  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => {
    const pdfData = Buffer.concat(buffers);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=certificato.pdf");
    res.send(pdfData);
  });

  doc.fontSize(20).text("Certificato PDF generato", 100, 100);
  doc.end();
});

// ❌ NON USARE app.listen
// ✅ Esporta l'app per Vercel
module.exports = app;
