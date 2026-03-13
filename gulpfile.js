import path from "path";
import fs from "fs";
import { glob } from "glob";
import { src, dest, watch, series } from "gulp"; // paralel
import * as dartSass from "sass";
import gulpSass from "gulp-sass";

const sass = gulpSass(dartSass); //extraccion de las dependencias

import terser from "gulp-terser";
import sharp from "sharp";

export function css(done) {
  src("src/scss/app.scss", { sourcemaps: true }) // ubicar el archivo
    .pipe(
      sass({
        outputStyle: "compact",
      }).on("error", sass.logError),
    ) // ubicado el archivo lo compila
    .pipe(dest("dist/css", { sourcemaps: "." })); // lo guarda

  done();
}

export function js(done) {
  src("src/js/app.js").pipe(terser()).pipe(dest("dist/js"));

  done();
}

// hacer las imagenes mas chicas
export async function crop(done) {
  const inputFolder = "src/img/gallery/full";
  const outputFolder = "src/img/gallery/thumb";
  const width = 250;
  const height = 180;
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }
  const images = fs.readdirSync(inputFolder).filter((file) => {
    return /\.(jpg)$/i.test(path.extname(file));
  });
  try {
    images.forEach((file) => {
      const inputFile = path.join(inputFolder, file);
      const outputFile = path.join(outputFolder, file);
      sharp(inputFile)
        .resize(width, height, {
          position: "centre",
        })
        .toFile(outputFile);
    });

    done();
  } catch (error) {
    console.log(error);
  }
}

/// cambio de formato a webp
export async function imagenes(done) {
  const srcDir = "./src/img";
  const buildDir = "./dist/img"; // archivo destino
  const images = await glob("./src/img/**/*{jpg,png}");

  images.forEach((file) => {
    const relativePath = path.relative(srcDir, path.dirname(file));
    const outputSubDir = path.join(buildDir, relativePath);
    procesarImagenes(file, outputSubDir);
  });
  done();
}

function procesarImagenes(file, outputSubDir) {
  if (!fs.existsSync(outputSubDir)) {
    fs.mkdirSync(outputSubDir, { recursive: true });
  }
  const baseName = path.basename(file, path.extname(file));
  const extName = path.extname(file);
  const outputFile = path.join(outputSubDir, `${baseName}${extName}`);
  const outputFileWebp = path.join(outputSubDir, `${baseName}.webp`);
  const outputFileAvif = path.join(outputSubDir, `${baseName}.avif`);

  const options = { quality: 80 };
  sharp(file).jpeg(options).toFile(outputFile);
  sharp(file).webp(options).toFile(outputFileWebp);
  sharp(file).avif().toFile(outputFileAvif);
}

export function dev() {
  watch("src/scss/**/*.scss", css); // observa el archivo y si hay cambios ejecuta css
  watch("src/js/**/*.js", js);
  watch("src/img/**/*{.png,.jpg}", imagenes); // busqueda de imagenes
}

export default series(crop, js, css, imagenes); /// dev para activar el watcher
