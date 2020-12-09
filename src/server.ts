import express, { Application } from "express";
import { createServer as createHttpServer, Server as HTTPServer } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";

export class Server {
  private app: Application;
  private httpServer: HTTPServer;

  private readonly HTTP_PORT = 8080;
  // private readonly HTTPS_PORT = 8443;

  constructor() {
    this.app = express();
    this.httpServer = createHttpServer(this.app);

    // serve up public files
    this.app.use(express.static(path.join(__dirname, "../public")));

    // setup multer
    const upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, callback) => {
          callback(null, "./uploads/");
        },
        filename: (req, file, callback) => {
          callback(null, file.originalname);
        },
      }),
    }).single("file");

    // setup routes
    this.app.get("/", (req, res) => {
      res.sendFile("index.html");
    });

    this.app.get("/uploads/:filename", (req, res) => {
      const filepath = path.join(__dirname, "../uploads/", req.params.filename);
      fs.access(filepath, fs.constants.F_OK, (err) => {
        if (err) {
          res.status(404).send("File not found.");
        } else {
          res.sendFile(filepath);
        }
      })
    });

    this.app.post("/uploadFile", (req, res) => {
      upload(req, res, (err) => {
        if (err) {
          res.status(500).send({ err });
        } else {
          console.log("--- File Upload Requests Received ---", req.file);
          res.send({ fileURL: req.file.path });
        }
      });
    });
  }

  public listen(callback: (protocol: string, port: number) => void): void {
    this.httpServer.listen(this.HTTP_PORT, () => {
      callback("http", this.HTTP_PORT);
    });
  }
}
