// index.js
import multer from "multer";
import AdmZip from "adm-zip";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Para obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Rota para servir o arquivo HTML
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/upload", upload.single("file"), (req, res) => {
    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();

    // Modificações no conteúdo do ZIP
    zipEntries.forEach((entry) => {
        // Renomeia a pasta "public" para "img" e mantém os arquivos
        if (entry.isDirectory && entry.entryName === "public/") {
            // Cria a nova pasta "img/"
            zip.addFile("img/", Buffer.from("")); // Adiciona a nova pasta

            // Copia todos os arquivos da pasta "public" para "img"
            zipEntries.forEach((subEntry) => {
                if (subEntry.entryName.startsWith("public/")) {
                    const newEntryName = subEntry.entryName.replace(
                        "public/",
                        "img/",
                    );
                    zip.addFile(newEntryName, zip.readFile(subEntry)); // Adiciona o arquivo na nova pasta
                }
            });

            zip.deleteFile(entry.entryName); // Remove a pasta original "public/"
        } else if (
            entry.entryName.endsWith(".html") ||
            entry.entryName.endsWith(".css")
        ) {
            let content = zip.readAsText(entry);
            // Altera o nome da pasta de "public" para "img" nos links
            content = content.replace(/public\//g, "img/");
            zip.deleteFile(entry.entryName); // Remove o arquivo original
            zip.addFile(entry.entryName, Buffer.from(content, "utf8")); // Adiciona o arquivo modificado
        }
    });

    // Adiciona os arquivos fixos ao ZIP
    const file1Path = path.join(__dirname, "LLWebServerExtended.js");
    const file2Path = path.join(__dirname, "scriptcustom.js");
    const file3Path = path.join(__dirname, "ew-log-viewer.js");

    zip.addLocalFile(file1Path); // Adiciona LLWebServerExtended.js
    zip.addLocalFile(file2Path); // Adiciona scriptcustom.js
    zip.addLocalFile(file3Path); // Adiciona ew-log-viewer.js

    // Salva o novo ZIP em um buffer
    const newZipBuffer = zip.toBuffer();

    // Define o cabeçalho para download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=modified.zip");
    res.send(newZipBuffer);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
